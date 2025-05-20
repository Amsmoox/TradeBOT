from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests
from .services.telegram_bot import TelegramBot


@api_view(['POST'])
def send_telegram_alert(request):
    return Response({"status": "ok", "message": "Alert received"})


@api_view(['GET'])
def fetch_and_send_signals(request):
    """Fetch signals from external API and send them to Telegram."""
    external_api = "https://run.mocky.io/v3/6a4fd821-e125-4aca-a404-d1a5a42b119f"  # 🔁 Change this to the real endpoint

    try:
        res = requests.get(external_api)
        signals = res.json()

        if not isinstance(signals, list):
            return Response({"status": "error", "message": "Expected list of signals"}, status=400)

        bot = TelegramBot()
        results = []

        for signal in signals:
            # 🛠 Customize message format based on actual structure
            msg = (
                f"<b>{signal.get('pair', 'N/A')}</b>\n"
                f"Action: {signal.get('action', 'N/A')}\n"
                f"SL: {signal.get('sl', '-')}\n"
                f"TP: {signal.get('tp', '-')}"
            )
            result = bot.send_message(msg)
            results.append(result)

        return Response({"status": "sent", "details": results})

    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)
