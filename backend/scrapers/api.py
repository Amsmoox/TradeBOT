from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ScrapedData
from .serializers import ScrapedDataSerializer

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