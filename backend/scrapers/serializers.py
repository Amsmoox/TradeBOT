from rest_framework import serializers
from .models import ScrapedData

class ScrapedDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScrapedData
        fields = [
            'id', 'instrument', 'action', 'entry_price', 
            'take_profit', 'stop_loss', 'status_signal', 
            'scrape_date', 'source_url', 'status'
        ] 