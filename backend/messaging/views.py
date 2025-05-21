from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services.telegram_bot import TelegramBot
from scrapers.models import ScrapedData


@api_view(['POST'])
def send_telegram_alert(request):
    return Response({"status": "ok", "message": "Alert received"})


@api_view(['GET'])
def fetch_and_send_signals(request):
    """Fetch the latest forex signals from the database and send them to Telegram."""
    try:
        # Get the 5 most recent successful and processed signals
        signals = ScrapedData.objects.filter(
            status='success', 
            is_processed=True
        ).order_by('-scrape_date')[:5]
        
        if not signals:
            return Response({"status": "warning", "message": "No signals found"})

        bot = TelegramBot()
        results = []

        for signal in signals:
            # Format the message for Telegram
            # Using HTML formatting for better display
            signal_emoji = "🔴" if signal.action.lower() == "sell" else "🟢"
            
            msg = (
                f"{signal_emoji} <b>{signal.instrument}</b>\n"
                f"<b>Action:</b> {signal.action}\n"
            )
            
            # Add optional fields if they exist
            if signal.entry_price:
                msg += f"<b>Entry:</b> {signal.entry_price}\n"
            if signal.stop_loss:
                msg += f"<b>Stop Loss:</b> {signal.stop_loss}\n"
            if signal.take_profit:
                msg += f"<b>Take Profit:</b> {signal.take_profit}\n"
            if signal.status_signal:
                msg += f"<b>Status:</b> {signal.status_signal}\n"
                
            # Add timestamp and source
            msg += f"\n<i>Scraped on: {signal.scrape_date.strftime('%Y-%m-%d %H:%M')}</i>"
            
            # Send the message to Telegram
            result = bot.send_message(msg)
            results.append({
                "signal_id": signal.id,
                "telegram_result": result
            })

        return Response({
            "status": "success", 
            "message": f"Sent {len(results)} signals to Telegram", 
            "details": results
        })

    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)
