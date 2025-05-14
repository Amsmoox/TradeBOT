from django.core.management.base import BaseCommand
from messaging.services.telegram_bot import TelegramBot
from messaging.serializers import SignalSerializer

class Command(BaseCommand):
    help = 'Send test trading signal to Telegram'

    def handle(self, *args, **options):
        # Create dummy signal
        test_data = {
            "symbol": "EUR/USD",
            "direction": "buy",
            "entry": 1.0850,
            "sl": 1.0800,
            "tp": 1.0950
        }

        # Validate using serializer
        serializer = SignalSerializer(data=test_data)
        if serializer.is_valid():
            bot = TelegramBot()
            message = f"""
            🚨 TEST SIGNAL
            Pair: {serializer.validated_data['symbol']}
            Action: {serializer.validated_data['direction'].upper()}
            Entry: {serializer.validated_data['entry']}
            SL: {serializer.validated_data['sl']}
            TP: {serializer.validated_data['tp']}
            """
            success = bot.send_message(message)

            if success:
                self.stdout.write(self.style.SUCCESS('✅ Test signal sent to Telegram!'))
            else:
                self.stdout.write(self.style.ERROR('❌ Failed to send signal'))
        else:
            self.stdout.write(self.style.ERROR('Invalid test data'))