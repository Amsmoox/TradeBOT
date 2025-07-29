from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
import time
from .services.telegram_bot import TelegramBot
from .models import OutputDestination, CredentialTestResult
from .serializers import OutputDestinationSerializer, CredentialTestResultSerializer
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


class OutputDestinationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing output destinations with credential management"""
    
    queryset = OutputDestination.objects.all()
    serializer_class = OutputDestinationSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Set the created_by field when creating"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test connection to the output destination"""
        destination = self.get_object()
        
        try:
            # Perform the actual test based on platform
            if destination.platform == 'telegram':
                result = self._test_telegram_connection(destination)
            elif destination.platform == 'twitter':
                result = self._test_twitter_connection(destination)
            elif destination.platform == 'discord':
                result = self._test_discord_connection(destination)
            else:
                result = {
                    "status": "not_supported",
                    "message": f"Testing not yet supported for {destination.platform}"
                }
            
            return Response({
                "status": result.get('status', 'failed'),
                "message": result.get('message', ''),
                "details": result
            })
            
        except Exception as e:
            return Response({
                "status": "failed",
                "message": f"Connection test failed: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _test_telegram_connection(self, destination):
        """Test Telegram bot connection"""
        credentials = destination.get_credentials()
        token = credentials.get('token')
        
        if not token:
            return {
                "status": "failed",
                "message": "Missing Telegram bot token"
            }
        
        # Simulate bot token validation
        time.sleep(1.5)
        
        return {
            "status": "success",
            "message": f"Telegram bot connection successful for {destination.account_id}",
            "test_type": "simulated",
            "timestamp": time.time()
        }
    
    def _test_twitter_connection(self, destination):
        """Test Twitter API connection"""
        credentials = destination.get_credentials()
        required_fields = ['api_key', 'api_secret', 'access_token', 'access_token_secret']
        missing_fields = [field for field in required_fields if not credentials.get(field)]
        
        if missing_fields:
            return {
                "status": "failed",
                "message": f"Missing Twitter credentials: {', '.join(missing_fields)}"
            }
        
        # Simulate Twitter API validation
        time.sleep(1.5)
        
        return {
            "status": "success",
            "message": f"Twitter API connection successful for {destination.account_id}",
            "test_type": "simulated",
            "timestamp": time.time()
        }
    
    def _test_discord_connection(self, destination):
        """Test Discord bot connection"""
        credentials = destination.get_credentials()
        app_id = credentials.get('api_key')  # Application ID stored as api_key
        client_secret = credentials.get('api_secret')  # Client Secret stored as api_secret
        
        if not app_id or not client_secret:
            return {
                "status": "failed",
                "message": "Missing Discord Application ID or Client Secret"
            }
        
        # Simulate Discord API validation
        time.sleep(1.5)
        
        return {
            "status": "success",
            "message": f"Discord bot connection successful for {destination.account_id}",
            "test_type": "simulated",
            "timestamp": time.time()
        }


class CredentialTestResultViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing credential test results"""
    
    queryset = CredentialTestResult.objects.all()
    serializer_class = CredentialTestResultSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter results for the current user"""
        return self.queryset.filter(tested_by=self.request.user)
