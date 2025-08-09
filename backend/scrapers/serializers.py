from rest_framework import serializers
from .models import ScrapedData, ScraperCredentials

class ScrapedDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScrapedData
        fields = [
            'id', 'instrument', 'action', 'entry_price', 'take_profit', 
            'stop_loss', 'status_signal', 'scrape_date', 'source_url', 
            'content_text', 'status', 'is_processed'
        ]
        read_only_fields = ['id', 'scrape_date', 'signal_hash']

class ScraperCredentialsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScraperCredentials
        fields = [
            'id', 'scraper_name', 'username', 'password', 'login_url', 
            'signals_url', 'api_key', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True},
            'api_key': {'write_only': True}
        } 