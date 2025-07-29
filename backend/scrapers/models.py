from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
import json
import base64
from .utils.encryption import credential_manager

class ScrapedData(models.Model):
    """Model to store scraped forex signals data from FX Leaders"""
    STATUS_CHOICES = (
        ('success', 'Success'),
        ('error', 'Error'),
        ('pending', 'Pending'),
    )
    content_html = models.TextField(help_text="The raw HTML content of the forex signal", blank=True, null=True)
    content_text = models.TextField(help_text="The formatted text representation of the forex signal")
    scrape_date = models.DateTimeField(default=timezone.now)
    source_url = models.URLField(help_text="FX Leaders URL where the signal was scraped from")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='success',
                              help_text="Status of the scraping operation")
    is_processed = models.BooleanField(default=True, help_text="Whether the signal has been processed")
    
    # Additional forex signal specific fields
    instrument = models.CharField(max_length=50, help_text="Forex pair or instrument", blank=True)
    action = models.CharField(max_length=10, help_text="Buy or Sell signal", blank=True)
    entry_price = models.CharField(max_length=20, help_text="Entry price for the signal", blank=True)
    take_profit = models.CharField(max_length=20, help_text="Take profit price", blank=True)
    stop_loss = models.CharField(max_length=20, help_text="Stop loss price", blank=True)
    status_signal = models.CharField(max_length=20, help_text="Signal status (Active, Closed, etc.)", blank=True)
    
    # Hash for duplicate detection
    signal_hash = models.CharField(max_length=64, db_index=True, help_text="Hash for duplicate detection", blank=True)
    
    def __str__(self):
        return f"{self.action} {self.instrument} @ {self.entry_price} on {self.scrape_date.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        ordering = ['-scrape_date']
        verbose_name = "Forex Signal"
        verbose_name_plural = "Forex Signals"

class ScrapingWatermark(models.Model):
    """Model to track scraping progress and avoid duplicate fetches"""
    source = models.CharField(
        max_length=50, 
        unique=True, 
        help_text="Source identifier (e.g., 'fxleaders')"
    )
    last_timestamp = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text='Last successful scrape timestamp'
    )
    last_etag = models.CharField(
        max_length=255, 
        blank=True, 
        help_text='Last ETag from HTTP response'
    )
    last_modified = models.CharField(
        max_length=255, 
        blank=True, 
        help_text='Last-Modified header from HTTP response'
    )
    scrape_interval = models.IntegerField(
        default=60, 
        help_text='Current scraping interval in seconds'
    )
    consecutive_no_changes = models.IntegerField(
        default=0, 
        help_text='Count of consecutive scrapes with no changes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Watermark for {self.source} - Last: {self.last_timestamp}"
    
    class Meta:
        verbose_name = 'Scraping Watermark'
        verbose_name_plural = 'Scraping Watermarks'

class EconomicEvent(models.Model):
    CURRENCY_CHOICES = [
        ('USD', 'US Dollar'),
        ('GBP', 'British Pound'),
        ('JPY', 'Japanese Yen'),
        ('EUR', 'Euro'),
    ]
    
    IMPACT_CHOICES = [
        ('HIGH', 'High Impact'),
        ('MED', 'Medium Impact'),
        ('LOW', 'Low Impact'),
    ]
    
    day = models.DateField()
    time = models.CharField(max_length=10)  # Store as string since we might have "All Day" events
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES)
    event_name = models.CharField(max_length=255)
    impact = models.CharField(max_length=4, choices=IMPACT_CHOICES)
    actual = models.CharField(max_length=50, blank=True, null=True)
    forecast = models.CharField(max_length=50, blank=True, null=True)
    previous = models.CharField(max_length=50, blank=True, null=True)
    
    # Additional metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['day', 'time', 'currency', 'event_name']  # Prevent duplicates
        ordering = ['day', 'time']
    
    def __str__(self):
        return f"{self.day} {self.time} - {self.currency} - {self.event_name}"

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

class InputSource(models.Model):
    """Model for managing input data sources with dynamic credentials"""
    
    SOURCE_TYPES = [
        ('economic_calendar', 'Economic Calendar'),
        ('trading_signals', 'Trading Signals'),
        ('market_news', 'Market News'),
    ]
    
    METHODS = [
        ('api', 'API'),
        ('scraping', 'Scraping'),
    ]
    
    # Basic Information
    name = models.CharField(max_length=100, help_text="Human-readable name for the source")
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES, help_text="Type of content this source provides")
    method = models.CharField(max_length=10, choices=METHODS, help_text="How to fetch data from this source")
    endpoint_url = models.URLField(help_text="API endpoint or website URL")
    
    # Credential Storage (base64 encoded)
    encrypted_credentials = models.TextField(blank=True, help_text="Base64 encoded JSON of credentials")
    
    # Metadata
    is_active = models.BooleanField(default=True, help_text="Whether this source is currently active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    # Configuration
    config_json = models.TextField(default='{}', help_text="Additional configuration as JSON")
    
    def set_credentials(self, credentials_dict):
        """Encrypt and store credentials using Fernet encryption"""
        self.encrypted_credentials = credential_manager.encrypt_credentials(credentials_dict)
    
    def get_credentials(self):
        """Decrypt and return credentials using Fernet encryption"""
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
        return f"{self.name} ({self.get_source_type_display()})"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Input Source"
        verbose_name_plural = "Input Sources"
