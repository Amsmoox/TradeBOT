from django.db import models
from django.contrib.auth.models import User
import json
import base64
from scrapers.utils.encryption import credential_manager

# Simple encryption utility for credentials
class SimpleEncryption:
    """Simple base64 encoding for credential storage (enhance with proper encryption in production)"""
    
    @staticmethod
    def encrypt_data(data):
        """Simple base64 encoding"""
        if not data:
            return ""
        return base64.b64encode(data.encode()).decode()
    
    @staticmethod
    def decrypt_data(encrypted_data):
        """Simple base64 decoding"""
        if not encrypted_data:
            return ""
        try:
            return base64.b64decode(encrypted_data.encode()).decode()
        except Exception as e:
            print(f"❌ Failed to decrypt data: {e}")
            return ""

class OutputDestination(models.Model):
    """Model for managing output destinations with platform-specific credentials"""
    
    PLATFORMS = [
        ('telegram', 'Telegram'),
        ('twitter', 'Twitter'),
        ('discord', 'Discord'),
        ('whatsapp', 'WhatsApp'),
    ]
    
    # Basic Information
    platform = models.CharField(max_length=20, choices=PLATFORMS, help_text="Platform to send messages to")
    label = models.CharField(max_length=100, help_text="Human-readable label for this destination")
    account_id = models.CharField(max_length=200, help_text="Account/Channel ID or handle")
    
    # Credential Storage (base64 encoded)
    encrypted_credentials = models.TextField(blank=True, help_text="Base64 encoded JSON of platform credentials")
    
    # Metadata
    is_active = models.BooleanField(default=True, help_text="Whether this destination is currently active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    # Configuration
    config_json = models.TextField(default='{}', help_text="Platform-specific configuration as JSON")
    
    def set_credentials(self, credentials_dict):
        """Encrypt and store platform credentials using Fernet encryption"""
        self.encrypted_credentials = credential_manager.encrypt_credentials(credentials_dict)
    
    def get_credentials(self):
        """Decrypt and return platform credentials using Fernet encryption"""
        return credential_manager.decrypt_credentials(self.encrypted_credentials)
    
    def get_config(self):
        """Return configuration as dict"""
        try:
            return json.loads(self.config_json)
        except json.JSONDecodeError:
            return {}
    
    def set_config(self, config_dict):
        """Set configuration from dict"""
        self.config_json = json.dumps(config_dict)
    
    def __str__(self):
        return f"{self.label} ({self.get_platform_display()})"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Output Destination"
        verbose_name_plural = "Output Destinations"

class CredentialTestResult(models.Model):
    """Model to store credential test results"""
    
    TEST_TYPES = [
        ('input_source', 'Input Source'),
        ('output_destination', 'Output Destination'),
    ]
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
    ]
    
    test_type = models.CharField(max_length=20, choices=TEST_TYPES)
    object_id = models.PositiveIntegerField(help_text="ID of the tested object")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, help_text="Test result message or error details")
    response_data = models.TextField(blank=True, help_text="Raw response data as JSON")
    tested_at = models.DateTimeField(auto_now_add=True)
    tested_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    def get_response_data(self):
        """Return response data as dict"""
        try:
            return json.loads(self.response_data) if self.response_data else {}
        except json.JSONDecodeError:
            return {}
    
    def set_response_data(self, data_dict):
        """Set response data from dict"""
        self.response_data = json.dumps(data_dict)
    
    def __str__(self):
        return f"{self.get_test_type_display()} Test - {self.status} ({self.tested_at})"
    
    class Meta:
        ordering = ['-tested_at']
        verbose_name = "Credential Test Result"
        verbose_name_plural = "Credential Test Results"
