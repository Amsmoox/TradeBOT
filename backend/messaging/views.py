from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests
from .services.telegram_bot import TelegramBot


@api_view(['POST'])
def send_telegram_alert(request):
    return Response({"status": "ok", "message": "Alert received"})


@api_view(['GET'])
def fetch_and_send_signals(request):
    external_api = "https://run.mocky.io/v3/6a4fd821-e125-4aca-a404-d1a5a42b119f" 
    return fetch_and_send_data(external_api, "signals")


@api_view(['GET'])
def fetch_and_send_events(request):
    external_api = "https://run.mocky.io/v3/de7a1daa-dad8-4144-b3b0-c7e2cd65de2f" 
    return fetch_and_send_data(external_api, "events")


@api_view(['GET'])
def fetch_and_send_news(request):
    external_api = "https://run.mocky.io/v3/a2a94682-5e11-4270-9871-78071dc0f604" 
    return fetch_and_send_data(external_api, "news")


def fetch_and_send_data(api_url, data_type):
    try:
        res = requests.get(api_url)
        items = res.json()

        if not isinstance(items, list):
            return Response({"status": "error", "message": f"{data_type} response is not a list"}, status=400)

        bot = TelegramBot()
        results = []

        for item in items:
            if data_type == "signals":
                msg = (
                    f"<b>{item.get('pair', 'N/A')}</b>\n"
                    f"Action: {item.get('action', 'N/A')}\n"
                    f"SL: {item.get('sl', '-')}\n"
                    f"TP: {item.get('tp', '-')}"
                )
            elif data_type == "events":
                msg = (
                    f"<b>Event: {item.get('title', 'N/A')}</b>\n"
                    f"Country: {item.get('country', 'N/A')}\n"
                    f"Time: {item.get('time', '-')}"
                )
            elif data_type == "news":
                msg = (
                    f"<b>Headline:</b> {item.get('headline', 'N/A')}\n"
                    f"<i>Source:</i> {item.get('source', 'N/A')}\n"
                    f"Time: {item.get('time', '-')}"
                )
            else:
                msg = f"<b>{data_type.capitalize()} Update</b>\nNo formatter defined."

            result = bot.send_message(msg)
            results.append(result)

        return Response({"status": "sent", "type": data_type, "details": results})

    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)
