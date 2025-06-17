from rest_framework import viewsets, filters
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import ScrapedData, ScrapingWatermark
from .serializers import ScrapedDataSerializer
from .services.fxleaders_scraper import FXLeadersScraper
from .tasks import intelligent_delta_scrape_task as main_delta_scrape_task

# Try to import Celery functionality
try:
    from celery import shared_task
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False
    # Create a dummy decorator for when Celery is not available
    def shared_task(func):
        return func

class ForexSignalViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for forex signals
    """
    queryset = ScrapedData.objects.filter(status='success', is_processed=True)
    serializer_class = ScrapedDataSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['scrape_date', 'instrument']
    ordering = ['-scrape_date']  # Default ordering
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Get the latest forex signals
        """
        latest_signals = self.queryset.order_by('-scrape_date')[:5]
        serializer = self.serializer_class(latest_signals, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_instrument(self, request):
        """
        Get signals filtered by forex instrument
        """
        instrument = request.query_params.get('name', None)
        if instrument:
            signals = self.queryset.filter(instrument__icontains=instrument)
            serializer = self.serializer_class(signals, many=True)
            return Response(serializer.data)
        return Response({"error": "Instrument parameter is required"}, status=400)
    
    @action(detail=False, methods=['post'])
    def trigger_delta_scrape(self, request):
        """
        Trigger an intelligent delta-scrape for FX Leaders signals
        """
        print("🎯 API: Delta-scrape triggered via API endpoint")
        
        try:
            # Check if we should run as async task or synchronous
            run_async = request.data.get('async', True)
            
            if run_async and CELERY_AVAILABLE:
                print("🔄 Running delta-scrape as Celery task...")
                task = main_delta_scrape_task.delay()
                return Response({
                    'status': 'success',
                    'message': 'Delta-scrape task queued successfully',
                    'task_id': task.id,
                    'async': True
                })
            else:
                print("⚡ Running delta-scrape synchronously...")
                result = run_intelligent_delta_scrape()
                return Response({
                    'status': 'success' if result['success'] else 'error',
                    'data': result,
                    'async': False
                })
                
        except Exception as e:
            error_msg = f"Error triggering delta-scrape: {str(e)}"
            print(f"❌ {error_msg}")
            return Response({
                'status': 'error',
                'message': error_msg
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def scraping_status(self, request):
        """
        Get current scraping watermark and status information
        """
        try:
            watermark = ScrapingWatermark.objects.filter(source='fxleaders').first()
            
            if not watermark:
                return Response({
                    'status': 'no_watermark',
                    'message': 'No scraping watermark found - scraping has not been initialized'
                })
            
            # Get recent signals count
            recent_signals = ScrapedData.objects.filter(
                scrape_date__gte=timezone.now() - timezone.timedelta(hours=24)
            ).count()
            
            return Response({
                'status': 'success',
                'watermark': {
                    'source': watermark.source,
                    'last_timestamp': watermark.last_timestamp,
                    'last_etag': watermark.last_etag[:20] + '...' if watermark.last_etag else None,
                    'last_modified': watermark.last_modified,
                    'scrape_interval': watermark.scrape_interval,
                    'consecutive_no_changes': watermark.consecutive_no_changes,
                    'created_at': watermark.created_at,
                    'updated_at': watermark.updated_at
                },
                'recent_activity': {
                    'signals_last_24h': recent_signals,
                    'total_signals': ScrapedData.objects.count()
                },
                'celery_available': CELERY_AVAILABLE
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Error fetching scraping status: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def run_intelligent_delta_scrape():
    """
    Core function to run intelligent delta-scraping
    Can be called from Celery task or API endpoint
    """
    print("🚀 Starting intelligent delta-scrape process...")
    start_time = timezone.now()
    
    try:
        # Initialize scraper
        scraper = FXLeadersScraper()
        
        # Run delta-scrape
        result = scraper.delta_scrape_forex_signals()
        
        # Add timing information
        end_time = timezone.now()
        duration = (end_time - start_time).total_seconds()
        result['duration_seconds'] = duration
        result['timestamp'] = end_time.isoformat()
        
        print(f"⏱️  Delta-scrape completed in {duration:.2f} seconds")
        
        # Send to Telegram if we have new signals
        if result.get('new_signals', 0) > 0:
            print(f"📨 Attempting to send {result['new_signals']} new signals to Telegram...")
            try:
                telegram_result = send_new_signals_to_telegram(result['new_signals'])
                result['telegram_sent'] = telegram_result
                print(f"📨 Telegram result: {telegram_result}")
            except Exception as e:
                print(f"⚠️  Telegram sending failed: {str(e)}")
                result['telegram_error'] = str(e)
        
        return result
        
    except Exception as e:
        error_msg = f"Delta-scrape process failed: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            'success': False,
            'error': error_msg,
            'new_signals': 0,
            'duplicates_skipped': 0
        }


def send_new_signals_to_telegram(new_signals_count):
    """
    Send the latest new signals to Telegram
    """
    try:
        # Import here to avoid circular imports
        from messaging.services.telegram_bot import TelegramBot
        
        # Get the most recent signals
        latest_signals = ScrapedData.objects.filter(
            status='success',
            is_processed=True
        ).order_by('-scrape_date')[:new_signals_count]
        
        if not latest_signals:
            return {'status': 'no_signals', 'count': 0}
        
        bot = TelegramBot()
        sent_count = 0
        
        for signal in latest_signals:
            # Format message for Telegram
            signal_emoji = "🔴" if signal.action.lower() == "sell" else "🟢"
            status_emoji = "⚡" if signal.status_signal.lower() == "active" else "⏳"
            
            msg = (
                f"{signal_emoji} {status_emoji} <b>{signal.instrument}</b>\n"
                f"<b>Action:</b> {signal.action}\n"
            )
            
            if signal.entry_price:
                msg += f"<b>Entry:</b> {signal.entry_price}\n"
            if signal.stop_loss:
                msg += f"<b>Stop Loss:</b> {signal.stop_loss}\n"
            if signal.take_profit:
                msg += f"<b>Take Profit:</b> {signal.take_profit}\n"
            if signal.status_signal:
                msg += f"<b>Status:</b> {signal.status_signal}\n"
                
            msg += f"\n<i>🕐 {signal.scrape_date.strftime('%H:%M')} | 🤖 Auto Delta-Scrape</i>"
            
            result = bot.send_message(msg)
            if result.get('success'):
                sent_count += 1
        
        return {
            'status': 'success',
            'sent_count': sent_count,
            'total_signals': len(latest_signals)
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'sent_count': 0
        }


# Standalone API endpoints
@api_view(['POST'])
def manual_delta_scrape(request):
    """
    Manual trigger for delta-scraping (standalone endpoint)
    """
    print("🎯 Manual delta-scrape triggered via standalone API")
    
    try:
        result = run_intelligent_delta_scrape()
        return Response({
            'status': 'success' if result['success'] else 'error',
            'data': result
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def watermark_info(request):
    """
    Get watermark information (standalone endpoint)
    """
    try:
        watermarks = ScrapingWatermark.objects.all()
        data = []
        
        for wm in watermarks:
            data.append({
                'source': wm.source,
                'last_timestamp': wm.last_timestamp,
                'scrape_interval': wm.scrape_interval,
                'consecutive_no_changes': wm.consecutive_no_changes,
                'has_etag': bool(wm.last_etag),
                'has_last_modified': bool(wm.last_modified),
                'updated_at': wm.updated_at
            })
        
        return Response({
            'status': 'success',
            'watermarks': data,
            'celery_available': CELERY_AVAILABLE
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 