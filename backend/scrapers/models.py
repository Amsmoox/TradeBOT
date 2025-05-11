from django.db import models
from django.utils import timezone

class ScrapedData(models.Model):
    """Model to store scraped data from the target website"""
    content_html = models.TextField(help_text="The raw HTML content that was scraped")
    content_text = models.TextField(help_text="The processed text content", blank=True)
    scrape_date = models.DateTimeField(default=timezone.now)
    source_url = models.URLField(help_text="URL where the data was scraped from")
    
    def __str__(self):
        return f"Scraped data from {self.source_url} on {self.scrape_date.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        ordering = ['-scrape_date']
        verbose_name = "Scraped Data"
        verbose_name_plural = "Scraped Data"
