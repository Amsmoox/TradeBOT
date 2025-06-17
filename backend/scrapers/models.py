from django.db import models
from django.utils import timezone

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
