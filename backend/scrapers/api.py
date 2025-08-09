from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import ScrapedData, ScrapingWatermark, ScraperCredentials
from .serializers import ScrapedDataSerializer, ScraperCredentialsSerializer
from .tasks import intelligent_delta_scrape_task, get_scraping_status
from .services.fxleaders_scraper import FXLeadersScraper

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
    ViewSet for forex signals - read-only operations
    """
    serializer_class = ScrapedDataSerializer
    queryset = ScrapedData.objects.filter(status_signal='Active').order_by('-scrape_date')
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the latest signals (last 10)"""
        latest_signals = self.queryset[:10]
        serializer = self.get_serializer(latest_signals, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def trigger_delta_scrape(self, request):
        """Trigger a delta scrape manually"""
        try:
            # Run the task synchronously for immediate response
            result = intelligent_delta_scrape_task()
            return Response({
                'success': True,
                'message': 'Delta scraping completed successfully',
                'result': result
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def scraping_status(self, request):
        """Get current scraping status and statistics"""
        try:
            status_data = get_scraping_status()
            return Response(status_data)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ScraperCredentialsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing scraper credentials
    """
    serializer_class = ScraperCredentialsSerializer
    queryset = ScraperCredentials.objects.all().order_by('scraper_name')
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test the credentials by attempting to authenticate"""
        try:
            credential = self.get_object()
            
            if credential.scraper_name == 'fxleaders':
                # Test FX Leaders credentials
                scraper = FXLeadersScraper()
                
                # Override credentials for testing
                scraper.login_url = credential.login_url
                scraper.signals_url = credential.signals_url
                scraper.username = credential.username
                scraper.password = credential.password
                
                # Test authentication
                auth_success = scraper.authenticate()
                
                if auth_success:
                    return Response({
                        'success': True,
                        'message': 'Authentication successful',
                        'scraper': credential.scraper_name
                    })
                else:
                    return Response({
                        'success': False,
                        'message': 'Authentication failed - please check your credentials',
                        'scraper': credential.scraper_name
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'success': False,
                    'message': f'Testing not implemented for {credential.scraper_name}',
                    'scraper': credential.scraper_name
                }, status=status.HTTP_501_NOT_IMPLEMENTED)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)