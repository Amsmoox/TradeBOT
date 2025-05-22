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
    
    def __str__(self):
        return f"{self.action} {self.instrument} @ {self.entry_price} on {self.scrape_date.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        ordering = ['-scrape_date']
        verbose_name = "Forex Signal"
        verbose_name_plural = "Forex Signals"

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
