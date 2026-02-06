from fastapi import APIRouter, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from api.agent.graph import chat_with_ai
import logging
import os
import shutil
import base64
import json
import uuid
import traceback
from api.services.tts_service import text_to_speech
from api.services.stt_service import speech_to_text
from api.services.websocket_manager import manager
from openai import AsyncOpenAI 
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Agent"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    audio_buffer = bytearray()
    
    try:
        while True:
            try:
                message = await websocket.receive()
            except RuntimeError:
                break

            if "bytes" in message:
                audio_buffer.extend(message["bytes"])
                continue

            if "text" in message:
                raw_text = message["text"]

                if not raw_text.startswith("{"):
                    try:
                        user_text = raw_text
                        logger.info(f"Chat: {user_text}")
                        ai_response = await chat_with_ai(user_text, thread_id="1")
                        await manager.send_json({"status": "success", "message": ai_response}, websocket)
                    except Exception as e:
                        logger.error(f"Chat Error: {e}")
                        await manager.send_json({"status": "error", "message": str(e)}, websocket)
                    continue

                try:
                    data = json.loads(raw_text)
                except:
                    continue

                command_type = data.get("type")

                if command_type == "start_recording":
                    audio_buffer = bytearray()
                    logger.info("Audio recording has started...")

                elif command_type == "stop_recording":
                    logger.info(f"Recording is finished ({len(audio_buffer)} bytes). Processing...")
                    
                    # Eğer buffer boşsa hata dön ve çık
                    if len(audio_buffer) == 0:
                        await manager.send_json({"status": "error", "message": "No sound was received (Empty data)."}, websocket)
                        continue

                    await manager.send_json({"status": "processing"}, websocket)

                    temp_filename = f"voice_{uuid.uuid4()}.webm"
                    
                    try:
                        with open(temp_filename, "wb") as f:
                            f.write(audio_buffer)

                        try:
                            user_text = await speech_to_text(temp_filename)
                            logger.info(f"Detected: {user_text}")
                            
                            if not user_text:
                                raise Exception("Audio unintelligible (Empty text).")
                                
                        except Exception as stt_err:
                            logger.error(f"STT Error: {stt_err}")
                            await manager.send_json({"status": "error", "message": "I couldn't hear you."}, websocket)
                            if os.path.exists(temp_filename): os.remove(temp_filename)
                            audio_buffer = bytearray()
                            continue

                        try:
                            ai_response = await chat_with_ai(user_text, thread_id="1")
                            logger.info(f"Agent: {ai_response}")
                        except Exception as llm_err:
                             await manager.send_json({
                                "status": "error", 
                                "transcription": user_text,
                                "message": f"Agent Error: {llm_err}"
                             }, websocket)
                             continue

                        await manager.send_json({
                            "status": "success",
                            "transcription": user_text,
                            "message": ai_response
                        }, websocket)

                        try:
                            audio_bytes = await text_to_speech(ai_response)
                            if audio_bytes:
                                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                                await manager.send_json({
                                    "status": "audio_ready", 
                                    "audio": audio_base64
                                }, websocket)
                                logger.info("Audio sent.")
                        except Exception as tts_err:
                            logger.error(f"TTS Error: {tts_err}") 

                    except Exception as e:
                        logger.error(f"Processing Error: {traceback.format_exc()}")
                        await manager.send_json({"status": "error", "message": "A system error has occurred."}, websocket)
                    
                    finally:
                        if os.path.exists(temp_filename):
                            os.remove(temp_filename)
                        audio_buffer = bytearray()

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket disconnect.")
    except Exception as e:
        logger.error(f"WS Main Loop Error: {e}")
        manager.disconnect(websocket)