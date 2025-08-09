from django.db import models
from django.utils import timezone
import hashlib

class ScrapedData(models.Model):
    """
    Model to store scraped forex signals data
    """
    content_html = models.TextField(blank=True, null=True, help_text="Raw HTML content scraped")
    content_text = models.TextField(blank=True, null=True, help_text="Formatted text content")
    source_url = models.URLField(blank=True, null=True, help_text="URL where data was scraped from")
    scrape_date = models.DateTimeField(auto_now_add=True, help_text="When the data was scraped")
    status = models.CharField(max_length=20, default='pending', help_text="Status of scraping (success, failed, pending)")
    is_processed = models.BooleanField(default=False, help_text="Whether the data has been processed")
    
    # Signal-specific fields
    instrument = models.CharField(max_length=50, blank=True, null=True, help_text="Trading instrument (e.g., EUR/USD)")
    action = models.CharField(max_length=10, blank=True, null=True, help_text="Trading action (Buy/Sell)")
    entry_price = models.CharField(max_length=20, blank=True, null=True, help_text="Entry price for the signal")
    take_profit = models.CharField(max_length=20, blank=True, null=True, help_text="Take profit price")
    stop_loss = models.CharField(max_length=20, blank=True, null=True, help_text="Stop loss price")
    status_signal = models.CharField(max_length=20, default='Active', help_text="Signal status (Active, Inactive, Closed)")
    
    # Hash for duplicate detection
    signal_hash = models.CharField(max_length=64, unique=True, blank=True, null=True, help_text="SHA256 hash for duplicate detection")
    
    # Missing count for inactivation logic
    missing_count = models.IntegerField(default=0, help_text="Number of times signal was not found in consecutive scrapes")
    
    class Meta:
        ordering = ['-scrape_date']
        verbose_name = "Scraped Data"
        verbose_name_plural = "Scraped Data"
    
    def __str__(self):
        return f"{self.instrument} {self.action} - {self.scrape_date.strftime('%Y-%m-%d %H:%M')}"
    
    def save(self, *args, **kwargs):
        # Generate hash if not provided
        if not self.signal_hash and self.instrument and self.action:
            signal_data = f"{self.instrument}_{self.action}_{self.entry_price}_{self.stop_loss}_{self.take_profit}"
            self.signal_hash = hashlib.sha256(signal_data.encode()).hexdigest()
        super().save(*args, **kwargs)

class ScrapingWatermark(models.Model):
    """
    Model to track scraping watermarks and prevent duplicate scraping
    """
    source = models.CharField(max_length=100, unique=True, help_text="Source identifier (e.g., 'fxleaders')")
    last_timestamp = models.DateTimeField(auto_now=True, help_text="Last scraping timestamp")
    last_etag = models.CharField(max_length=255, blank=True, help_text="Last ETag from HTTP response")
    last_modified = models.DateTimeField(auto_now=True, help_text="Last modified timestamp")
    scrape_interval = models.IntegerField(default=300, help_text="Scraping interval in seconds")
    consecutive_no_changes = models.IntegerField(default=0, help_text="Consecutive scrapes with no changes")
    
    class Meta:
        verbose_name = "Scraping Watermark"
        verbose_name_plural = "Scraping Watermarks"
    
    def __str__(self):
        return f"{self.source} - {self.last_timestamp.strftime('%Y-%m-%d %H:%M')}"

class EconomicEvent(models.Model):
    """
    Model to store economic calendar events
    """
    event_name = models.CharField(max_length=255, help_text="Name of the economic event")
    currency = models.CharField(max_length=10, help_text="Currency affected (e.g., USD, EUR)")
    impact = models.CharField(max_length=20, help_text="Impact level (High, Medium, Low)")
    day = models.CharField(max_length=20, help_text="Day of the week")
    time = models.CharField(max_length=20, help_text="Time of the event")
    forecast = models.CharField(max_length=50, blank=True, null=True, help_text="Forecasted value")
    previous = models.CharField(max_length=50, blank=True, null=True, help_text="Previous value")
    actual = models.CharField(max_length=50, blank=True, null=True, help_text="Actual value")
    scheduled_time = models.DateTimeField(null=True, blank=True, help_text="Scheduled time of the event")
    
    class Meta:
        ordering = ['scheduled_time']
        verbose_name = "Economic Event"
        verbose_name_plural = "Economic Events"
    
    def __str__(self):
        return f"{self.event_name} - {self.currency} ({self.scheduled_time.strftime('%Y-%m-%d %H:%M') if self.scheduled_time else 'No time'})"

class ScraperCredentials(models.Model):
    """
    Model to store API credentials and URLs for different scrapers
    """
    SCRAPER_CHOICES = [
        ('fxleaders', 'FX Leaders'),
        ('dailyfx', 'DailyFX'),
        ('myfxbook', 'MyFXBook'),
        ('tradingview', 'TradingView'),
        ('custom', 'Custom API'),
    ]
    
    scraper_name = models.CharField(max_length=50, choices=SCRAPER_CHOICES, unique=True, help_text="Name of the scraper")
    username = models.CharField(max_length=255, blank=True, help_text="Username for authentication")
    password = models.CharField(max_length=255, blank=True, help_text="Password for authentication")
    login_url = models.URLField(blank=True, help_text="Login URL for the scraper")
    signals_url = models.URLField(blank=True, help_text="Signals URL for the scraper")
    api_key = models.CharField(max_length=255, blank=True, help_text="API key if required")
    is_active = models.BooleanField(default=True, help_text="Whether this scraper is active")
    created_at = models.DateTimeField(auto_now_add=True, help_text="When the credentials were created")
    updated_at = models.DateTimeField(auto_now=True, help_text="When the credentials were last updated")
    
    class Meta:
        verbose_name = "Scraper Credentials"
        verbose_name_plural = "Scraper Credentials"
        ordering = ['scraper_name']
    
    def __str__(self):
        return f"{self.get_scraper_name_display()} - {'Active' if self.is_active else 'Inactive'}"
    
    def get_credentials(self):
        """
        Return credentials as a dictionary
        """
        return {
            'username': self.username,
            'password': self.password,
            'login_url': self.login_url,
            'signals_url': self.signals_url,
            'api_key': self.api_key,
        }
