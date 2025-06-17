import os
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

class TelegramBot:
    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN","7606463860:AAGzEfRMZkmpE342K4jBUc0wKUodEmNIo10")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID","-1002660018013")
    def send_message(self, message: str) -> dict:
        if not self.token or not self.chat_id:
            logger.error("Missing Telegram credentials")
            return {"status": "error", "message": "Bot not configured"}

        try:
            response = requests.post(
                f"https://api.telegram.org/bot{self.token}/sendMessage",
                params={
                    "chat_id": self.chat_id,
                    "text": message,
                    "parse_mode": "HTML"
                },
                timeout=5
            )
            response.raise_for_status()
            return {"status": "success", "data": response.json()}
        except requests.exceptions.RequestException as e:
            logger.error(f"Telegram API error: {str(e)}")
            return {"status": "error", "message": str(e)}