import os
import logging
import httpx
import asyncio
from typing import Optional
from twilio.rest import Client

logger = logging.getLogger(__name__)

class NotificationManager:
    """
    Omnichannel Notification Service (Telegram, SMS, Voice Call)
    Works with Singleton pattern.
    """

    def __init__(self):

        self.twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_from_number = os.getenv("TWILIO_FROM_NUMBER")
        
        self.telegram_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.default_telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID") 

        if self.twilio_sid and self.twilio_auth:
            self.twilio_client = Client(self.twilio_sid, self.twilio_auth)
            logger.info("Twilio Client was successfully launched.")
        else:
            self.twilio_client = None
            logger.warning("Twilio keys are missing. Calls/SMS will only be logged.")

    async def send_telegram_alert(self, message: str, chat_id: Optional[str] = None) -> bool:
        """It sends Telegram messages asynchronously."""

        target_id = chat_id or self.default_telegram_chat_id
        
        if not self.telegram_token or not target_id:
            logger.warning(f"[TELEGRAM SIMULATION] Target: {target_id} | Message: {message}")
            return False

        url = f"https://api.telegram.org/bot{self.telegram_token}/sendMessage"
        payload = {
            "chat_id": target_id,
            "text": message,
            "parse_mode": "Markdown"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=10.0)
                response.raise_for_status()
                logger.info(f"Telegram message sent (Chat ID: {target_id})")
                return True
        except Exception as e:
            logger.error(f"Telegram sending error: {str(e)}")
            return False

    async def send_telegram_photo(
        self, photo_bytes: bytes, caption: str, chat_id: Optional[str] = None
    ) -> bool:
        """Send a photo with caption to Telegram asynchronously."""
        target_id = chat_id or self.default_telegram_chat_id

        if not self.telegram_token or not target_id:
            logger.warning(f"[TELEGRAM PHOTO SIMULATION] Target: {target_id} | Caption: {caption}")
            return False

        url = f"https://api.telegram.org/bot{self.telegram_token}/sendPhoto"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    data={"chat_id": target_id, "caption": caption, "parse_mode": "Markdown"},
                    files={"photo": ("fall_screenshot.jpg", photo_bytes, "image/jpeg")},
                    timeout=15.0,
                )
                response.raise_for_status()
                logger.info(f"Telegram photo sent (Chat ID: {target_id})")
                return True
        except Exception as e:
            logger.error(f"Telegram photo sending error: {str(e)}")
            return False

    def _sync_send_sms(self, phone_number: str, message: str) -> bool:
        """Twilio SDK is synchronous, so it's an isolated helper function."""

        if not self.twilio_client:
            logger.warning(f"[SMS SIMULATION] Target: {phone_number} | Message: {message}")
            return False
        try:
            msg = self.twilio_client.messages.create(
                body=message,
                from_=self.twilio_from_number,
                to=phone_number
            )
            logger.info(f"SMS Sent. SID: {msg.sid}")
            return True
        except Exception as e:
            logger.error(f"SMS sending error: {str(e)}")
            return False

    async def send_sms(self, phone_number: str, message: str) -> bool:
        """To avoid locking the main event loop, it assigns the process to a background thread."""

        if not phone_number:
            logger.error("SMS could not be sent: The target number was not specified.")
            return False
        return await asyncio.to_thread(self._sync_send_sms, phone_number, message)

    def _sync_make_voice_call(self, phone_number: str, tts_message: str) -> bool:
        """It reads text directly to the target using TwiML."""

        if not self.twilio_client:
            logger.warning(f"[VOICE SIMULATION] Target: {phone_number} | Announcement: '{tts_message}'")
            return False
        try:
            twiml_response = f"<Response><Say language='tr-TR' voice='Polly.Filiz'>{tts_message}</Say></Response>"
            
            call = self.twilio_client.calls.create(
                twiml=twiml_response,
                to=phone_number,
                from_=self.twilio_from_number
            )
            logger.info(f"Voice call initiated. SID: {call.sid}")
            return True
        except Exception as e:
            logger.error(f"Voice search error: {str(e)}")
            return False

    async def make_voice_call(self, phone_number: str, tts_message: str) -> bool:
        """It operates the voice call asynchronously."""

        if not phone_number:
            logger.error("The call could not be made: The target number was not specified.")
            return False
        return await asyncio.to_thread(self._sync_make_voice_call, phone_number, tts_message)

notifier = NotificationManager()