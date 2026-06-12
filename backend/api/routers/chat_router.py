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
import io
import asyncio
import re

from api.services.tts_service import text_to_speech
from api.services.stt_service import speech_to_text
from api.services.websocket_manager import manager
from api.services.speaker_service import speaker_service
from openai import AsyncOpenAI 
from dotenv import load_dotenv

from api.routers.reflex_router import local_reflex_router
from api.routers.devices_router import control_device, DeviceControl

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Agent"])

def clean_for_tts(text: str) -> str:
    """It removes markdown symbols (*, _, #, `, ~) before converting it to speech."""

    return re.sub(r'[*_#`~]', '', text)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    audio_buffer = bytearray()

    session_thread_id = str(uuid.uuid4())
    
    try:
        while True:
            try:
                message = await websocket.receive()
            except RuntimeError:
                logger.warning("WebSocket receive error (RuntimeError). Breaking loop.")
                break

            if "bytes" in message:
                audio_buffer.extend(message["bytes"])
                continue

            if "text" in message:
                raw_text = message["text"]

                if not raw_text.startswith("{"):
                    try:
                        user_text = raw_text
                        logger.info(f"Chat (Text): {user_text}")

                        reflex_decision = local_reflex_router.route_command(user_text)
                        
                        if reflex_decision["destination"] == "REFLEX":
                            logger.info(f"⚡ TEXT REFLEX TRIGGERED: {reflex_decision}")
                            try:
                                await control_device(
                                    device_id=reflex_decision["device_id"], 
                                    control=DeviceControl(on=reflex_decision["is_on"])
                                )
                                action_text = "on" if reflex_decision["is_on"] else "off"
                                device_name = reflex_decision.get("device_name", "device")
                                tts_text = f"Done! I've turned {action_text} the {device_name}."
                                
                                await manager.send_json({
                                    "status": "text_chunk",
                                    "chunk": tts_text
                                }, websocket)
                                await asyncio.sleep(0.05)
                                await manager.send_json({"status": "stream_finished"}, websocket)
                                continue 
                            except Exception as e:
                                logger.error(f"Text Reflex execution failed: {e}")

                        logger.info("Passing command to Brain (LLM)...")
                        stream_generator = chat_with_ai(user_text, thread_id=session_thread_id)
                        
                        async for chunk in stream_generator:
                            await manager.send_json({
                                "status": "text_chunk",
                                "chunk": chunk
                            }, websocket)
                        
                        await asyncio.sleep(0.05)
                        await manager.send_json({"status": "stream_finished"}, websocket)
                    
                    except Exception as e:
                        logger.error(f"Text Chat Error: {traceback.format_exc()}")
                        await manager.send_json({"status": "error", "message": "An Error occured."}, websocket)
                    
                    continue

                try:
                    data = json.loads(raw_text)
                except:
                    continue

                command_type = data.get("type")

                if command_type == "start_recording":
                    audio_buffer = bytearray() 
                    logger.info("Audio Record started...")

                elif command_type == "stop_recording":
                    logger.info(f"Audio Record finished. Processing...")
                    
                    if len(audio_buffer) == 0: 
                        continue

                    await manager.send_json({"status": "processing"}, websocket)

                    try:
                        audio_bytes = bytes(audio_buffer)
                        audio_stream = io.BytesIO(audio_bytes) 

                        task_stt = speech_to_text(audio_stream)
                        task_id = asyncio.to_thread(speaker_service.identify_speaker, audio_bytes)
                        
                        results = await asyncio.gather(task_id, task_stt)
                        (identified_user, score), user_text = results

                        logger.info(f"Speaker: {identified_user} ({score:.2f}) | Text: {user_text}")
            
                        if not user_text:
                            await manager.send_json({"status": "error", "message": "Voice couldn't be understand."}, websocket)
                            continue

                        await manager.send_json({
                            "status": "transcription",
                            "text": f"({identified_user}) {user_text}"
                        }, websocket)

                        if "guest" not in identified_user.lower():
                            reflex_decision = local_reflex_router.route_command(user_text)
                            
                            if reflex_decision["destination"] == "REFLEX":
                                logger.info(f"⚡ VOICE REFLEX TRIGGERED: {reflex_decision}")
                                try:
                                    await control_device(
                                        device_id=reflex_decision["device_id"], 
                                        control=DeviceControl(on=reflex_decision["is_on"])
                                    )
                                    action_text = "on" if reflex_decision["is_on"] else "off"
                                    device_name = reflex_decision.get("device_name", "device")
                                    tts_text = f"Done! I've turned {action_text} the {device_name}."
                                    
                                    await manager.send_json({
                                        "status": "text_chunk",
                                        "chunk": tts_text
                                    }, websocket)
                                    
                                    audio_res_bytes = await text_to_speech(clean_for_tts(tts_text))
                                    if audio_res_bytes:
                                        audio_base64 = base64.b64encode(audio_res_bytes).decode('utf-8')
                                        await manager.send_json({
                                            "status": "audio_chunk", 
                                            "audio": audio_base64
                                        }, websocket)

                                    await asyncio.sleep(0.05)
                                    await manager.send_json({"status": "stream_finished"}, websocket)
                                    continue 
                                except Exception as e:
                                    logger.error(f"Voice Reflex execution failed: {e}")

                        logger.info("Passing voice command to Brain (LLM)...")
                        context_aware_input = f"[User: {identified_user}] {user_text}"
                        stream_generator = chat_with_ai(context_aware_input, thread_id="1")
                        sentence_buffer = ""

                        async for chunk in stream_generator:
                            if not chunk or not isinstance(chunk, str):
                                continue

                            sentence_buffer += chunk 

                            await manager.send_json({
                                "status": "text_chunk",
                                "chunk": chunk
                            }, websocket)

                            if any(p in sentence_buffer for p in [".", "?", "!"]):
                                if len(sentence_buffer.strip()) > 5:
                                    logger.info(f"Synthesized Sentence:{sentence_buffer.strip()}")
                                    audio_bytes_synth = await text_to_speech(clean_for_tts(sentence_buffer.strip()))
                                    if audio_bytes_synth:
                                        audio_base64 = base64.b64encode(audio_bytes_synth).decode('utf-8')
                                        await manager.send_json({
                                            "status": "audio_chunk", 
                                            "audio": audio_base64
                                        }, websocket)
                                    sentence_buffer = ""
                        
                        if sentence_buffer.strip():
                            logger.info(f"The Last Remaining Piece is Being Synthesized (Flush): {sentence_buffer.strip()}")
                            audio_bytes_synth = await text_to_speech(clean_for_tts(sentence_buffer.strip()))
                            if audio_bytes_synth:
                                audio_base64 = base64.b64encode(audio_bytes_synth).decode('utf-8')
                                await manager.send_json({
                                    "status": "audio_chunk", 
                                    "audio": audio_base64
                                }, websocket)

                        await asyncio.sleep(0.05)
                        await manager.send_json({"status": "stream_finished"}, websocket)

                    except Exception as e:
                        logger.error(f"Audio Processing Error: {traceback.format_exc()}")
                        await manager.send_json({"status": "error", "message": "An error occured when processing audio."}, websocket)
                    
                    finally:
                        audio_buffer = bytearray()

    except WebSocketDisconnect:
        logger.info("Client disconnected")
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Critical WS Error: {e}")
        manager.disconnect(websocket)