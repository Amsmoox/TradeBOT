from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services.telegram_bot import TelegramBot

@api_view(['POST'])
def send_telegram_alert(request):
    """API endpoint for sending alerts"""
    message = request.data.get('message')
    if not message:
        return Response({"status": "error", "message": "No message provided"}, status=400)

    bot = TelegramBot()
    result = bot.send_message(message)
    return Response(result)
