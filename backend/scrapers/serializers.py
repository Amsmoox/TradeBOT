from rest_framework import serializers
from .models import ScrapedData, InputSource

class ScrapedDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScrapedData
        fields = [
            'id', 'instrument', 'action', 'entry_price', 
            'take_profit', 'stop_loss', 'status_signal', 
            'scrape_date', 'source_url', 'status'
        ]

class InputSourceSerializer(serializers.ModelSerializer):
    """Serializer for InputSource model"""
    
    credentials = serializers.SerializerMethodField()
    config = serializers.SerializerMethodField()
    
    class Meta:
        model = InputSource
        fields = [
            'id', 'name', 'source_type', 'method', 'endpoint_url',
            'credentials', 'config', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_credentials(self, obj):
        """Return decrypted credentials (masked for security)"""
        creds = obj.get_credentials()
        # Mask sensitive fields for API response
        masked_creds = {}
        for key, value in creds.items():
            if key.lower() in ['password', 'secret', 'token', 'key']:
                masked_creds[key] = '***' if value else ''
            else:
                masked_creds[key] = value
        return masked_creds
    
    def get_config(self, obj):
        """Return configuration"""
        return obj.get_config()
    
    def create(self, validated_data):
        """Create new input source with credentials"""
        credentials_data = self.initial_data.get('credentials', {})
        config_data = self.initial_data.get('config', {})
        
        # Remove credentials and config from validated_data
        validated_data.pop('credentials', None)
        validated_data.pop('config', None)
        
        # Create the instance
        instance = InputSource.objects.create(**validated_data)
        
        # Set credentials and config
        if credentials_data:
            instance.set_credentials(credentials_data)
        if config_data:
            instance.set_config(config_data)
        
        instance.save()
        return instance
    
    def update(self, instance, validated_data):
        """Update input source with credentials"""
        credentials_data = self.initial_data.get('credentials', {})
        config_data = self.initial_data.get('config', {})
        
        # Remove credentials and config from validated_data
        validated_data.pop('credentials', None)
        validated_data.pop('config', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update credentials and config if provided
        if credentials_data:
            instance.set_credentials(credentials_data)
        if config_data:
            instance.set_config(config_data)
        
        instance.save()
        return instance 