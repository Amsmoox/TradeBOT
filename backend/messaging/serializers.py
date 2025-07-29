
from rest_framework import serializers
from .models import OutputDestination, CredentialTestResult

class SignalSerializer(serializers.Serializer):
    symbol = serializers.CharField(max_length=10)
    direction = serializers.ChoiceField(choices=['buy', 'sell'])
    entry = serializers.DecimalField(max_digits=10, decimal_places=4)
    sl = serializers.DecimalField(max_digits=10, decimal_places=4)
    tp = serializers.DecimalField(max_digits=10, decimal_places=4)

class OutputDestinationSerializer(serializers.ModelSerializer):
    """Serializer for OutputDestination model"""
    
    credentials = serializers.SerializerMethodField()
    config = serializers.SerializerMethodField()
    
    class Meta:
        model = OutputDestination
        fields = [
            'id', 'platform', 'label', 'account_id', 'credentials', 'config',
            'is_active', 'created_at', 'updated_at'
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
        """Create new output destination with credentials"""
        credentials_data = self.initial_data.get('credentials', {})
        config_data = self.initial_data.get('config', {})
        
        # Remove credentials and config from validated_data
        validated_data.pop('credentials', None)
        validated_data.pop('config', None)
        
        # Create the instance
        instance = OutputDestination.objects.create(**validated_data)
        
        # Set credentials and config
        if credentials_data:
            instance.set_credentials(credentials_data)
        if config_data:
            instance.set_config(config_data)
        
        instance.save()
        return instance
    
    def update(self, instance, validated_data):
        """Update output destination with credentials"""
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

class CredentialTestResultSerializer(serializers.ModelSerializer):
    """Serializer for CredentialTestResult model"""
    
    response_data = serializers.SerializerMethodField()
    
    class Meta:
        model = CredentialTestResult
        fields = [
            'id', 'test_type', 'object_id', 'status', 'message', 
            'response_data', 'tested_at'
        ]
        read_only_fields = ['id', 'tested_at']
    
    def get_response_data(self, obj):
        """Return response data"""
        return obj.get_response_data()