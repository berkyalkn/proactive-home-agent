import asyncio
import subprocess
import numpy as np
import logging
import os
import time
from sqlmodel import Session, select
from database.settings import engine
from database.models import SecuritySettings

from api.routers.vision_router import execute_emergency_lockdown
from api.services.notification_service import notifier

try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    import tensorflow.lite as tflite

logger = logging.getLogger(__name__)

BABY_CRY_CLASSES = [20, 21] 
GLASS_BREAK_CLASSES = [426, 427, 428, 364, 374]

class AcousticService:
    def __init__(self):
        self.model_path = "data/models/yamnet.tflite"
        self.interpreter = None
        self.input_details = None
        self.output_details = None
        
        self.ffmpeg_process = None
        self.is_running = False
        
        self.rtsp_url = "rtsp://127.0.0.1:8554/living_room_cam"
        
        self.chunk_size = 31200 
        self.last_alert_time = 0

    def load_model(self):
        if not os.path.exists(self.model_path):
            logger.error(f"YAMNet model not found at {self.model_path}")
            return False
        
        self.interpreter = tflite.Interpreter(model_path=self.model_path)
        self.interpreter.allocate_tensors()
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        logger.info("YAMNet Edge Audio Model Loaded Successfully.")
        return True

    def _start_ffmpeg(self):
        """Starts the FFmpeg pipeline to extract raw audio from RTSP."""
        if self.ffmpeg_process:
            self.ffmpeg_process.kill()
            
        command = [
            'ffmpeg',
            '-i', self.rtsp_url,
            '-f', 's16le',      
            '-acodec', 'pcm_s16le',
            '-ar', '16000',      
            '-ac', '1',          
            '-vn',               
            '-loglevel', 'quiet',
            '-'                  
        ]
        
        self.ffmpeg_process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL
        )
        logger.info("[Acoustic] FFmpeg audio pipeline connected to go2rtc.")

    def _get_active_settings(self):
        """Checks DB if any acoustic monitoring is enabled."""

        with Session(engine) as session:
            settings = session.exec(select(SecuritySettings).where(SecuritySettings.is_active == True)).first()
            if not settings:
                return False, False, None
            
            return settings.detect_glass_break, settings.detect_baby_cry, settings

    async def run(self):
        if not self.load_model():
            return

        self.is_running = True
        
        while self.is_running:
            glass_enabled, baby_enabled, settings = self._get_active_settings()
            
            if not glass_enabled and not baby_enabled:
                if self.ffmpeg_process:
                    self.ffmpeg_process.kill()
                    self.ffmpeg_process = None
                await asyncio.sleep(5) 
                continue
                
            if self.ffmpeg_process is None or self.ffmpeg_process.poll() is not None:
                self._start_ffmpeg()
                
            try:
                raw_audio = await asyncio.get_event_loop().run_in_executor(
                    None, self.ffmpeg_process.stdout.read, self.chunk_size
                )

                if len(raw_audio) > 0:
                    logger.debug(f"[Acoustic] {len(raw_audio)} bytes audio packet successfully captured!")
                
                if len(raw_audio) != self.chunk_size:
                    logger.warning("[Acoustic] Partial audio chunk received, reconnecting...")
                    self._start_ffmpeg()
                    await asyncio.sleep(2)
                    continue

                audio_np = np.frombuffer(raw_audio, dtype=np.int16).astype(np.float32) / 32768.0
                
                self.interpreter.set_tensor(self.input_details[0]['index'], audio_np)
                self.interpreter.invoke()
                scores = self.interpreter.get_tensor(self.output_details[0]['index'])[0]
                
                await self._evaluate_scores(scores, glass_enabled, baby_enabled, settings)
                
            except Exception as e:
                logger.error(f"[Acoustic] Pipeline error: {e}")
                await asyncio.sleep(2)

    async def _evaluate_scores(self, scores, glass_enabled, baby_enabled, settings):
        max_idx = np.argmax(scores)
        if scores[max_idx] > 0.15:  
            glass_score = max(scores[426], scores[428])
            baby_score = max(scores[20], scores[21])
            logger.info(
                f"[Acoustic] Top Class: {max_idx} ({scores[max_idx]:.0%}) | "
                f"Glass Hidden Score: {glass_score:.0%} | Baby Hidden Score: {baby_score:.0%}"
            )
            
        current_time = time.time()
        
        if current_time - self.last_alert_time < 15:
            return

        if glass_enabled:
            for cls in GLASS_BREAK_CLASSES:
                if scores[cls] > 0.40:  
                    logger.critical(f"[Acoustic] GLASS BREAK DETECTED! (Confidence: {scores[cls]:.2%})")
                    self.last_alert_time = current_time
                    await execute_emergency_lockdown("System (Audio Sensor)", settings)
                    return

        if baby_enabled:
            for cls in BABY_CRY_CLASSES:
                if scores[cls] > 0.40:  
                    logger.info(f"[Acoustic] BABY CRY DETECTED! (Confidence: {scores[cls]:.2%})")
                    self.last_alert_time = current_time
                    alert_msg = f"*Baby Monitor Alert*\nThe camera picked up crying sounds in the room (Confidence: {scores[cls]:.2%})."
                    if settings.use_telegram:
                        from api.services.notification_service import notifier
                        import asyncio
                        asyncio.create_task(notifier.send_telegram_alert(alert_msg))
                    return

acoustic_engine = AcousticService()