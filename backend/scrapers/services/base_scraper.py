import logging
import requests
from bs4 import BeautifulSoup
from django.conf import settings
from django.utils import timezone
from ..models import ScrapedData, ScrapingWatermark

logger = logging.getLogger(__name__)

class BaseScraper:
    """
    Base scraper class with core functionality for FX Leaders scraper.
    Enhanced with intelligent delta-scraping using watermarks and conditional HTTP requests.
    """
    def __init__(self, base_url, source_name=None):
        self.base_url = base_url
        self.source_name = source_name or self.__class__.__name__.lower()
        self.session = requests.Session()
        self.logged_in = False
        self.watermark = None
        
    def get_or_create_watermark(self):
        """Get or create watermark for this scraper source"""
        if not self.watermark:
            self.watermark, created = ScrapingWatermark.objects.get_or_create(
                source=self.source_name,
                defaults={
                    'scrape_interval': 60,
                    'consecutive_no_changes': 0
                }
            )
            print(f"📊 Watermark {'created' if created else 'loaded'} for source: {self.source_name}")
        return self.watermark
    
    def get_page_with_conditional_headers(self, url):
        """
        Get a page using conditional HTTP headers to avoid unnecessary downloads
        
        Args:
            url (str): URL to fetch
        
        Returns:
            tuple: (content, is_modified, response_headers)
                - content: HTML content or None
                - is_modified: True if content changed, False if 304 Not Modified
                - response_headers: dict with ETag and Last-Modified for future use
        """
        try:
            print(f"🌐 Making conditional HTTP request to: {url}")
            
            # Get watermark to use conditional headers
            watermark = self.get_or_create_watermark()
            
            # Prepare conditional headers
            headers = {}
            if watermark.last_etag:
                headers['If-None-Match'] = watermark.last_etag
                print(f"📋 Using If-None-Match: {watermark.last_etag[:20]}...")
                
            if watermark.last_modified:
                headers['If-Modified-Since'] = watermark.last_modified
                print(f"📅 Using If-Modified-Since: {watermark.last_modified}")
            
            # Make request
            response = self.session.get(url, headers=headers)
            print(f"📡 Response status: {response.status_code}")
            
            # Handle 304 Not Modified
            if response.status_code == 304:
                print("✅ 304 Not Modified - no changes detected, skipping download")
                watermark.consecutive_no_changes += 1
                watermark.save()
                return None, False, {}
            
            # Handle other HTTP errors
            if response.status_code >= 400:
                logger.error(f"HTTP error: {response.status_code}")
                return None, False, {}
                
            response.raise_for_status()
            
            # Extract response headers for future conditional requests
            response_headers = {
                'etag': response.headers.get('ETag', ''),
                'last_modified': response.headers.get('Last-Modified', '')
            }
            
            print(f"📄 Content downloaded - length: {len(response.text)} chars")
            if response_headers['etag']:
                print(f"🏷️  New ETag: {response_headers['etag'][:20]}...")
            if response_headers['last_modified']:
                print(f"📅 New Last-Modified: {response_headers['last_modified']}")
                
            # Reset consecutive no-changes counter since we got new content
            watermark.consecutive_no_changes = 0
            watermark.save()
            
            return response.text, True, response_headers
            
        except Exception as e:
            logger.error(f"Error fetching page {url}: {str(e)}")
            return None, False, {}
    
    def get_page(self, url):
        """
        Legacy method for backward compatibility
        """
        content, is_modified, headers = self.get_page_with_conditional_headers(url)
        return content
    
    def update_watermark(self, response_headers=None, new_signals_count=0):
        """
        Update watermark with latest scraping information
        
        Args:
            response_headers (dict): HTTP response headers with ETag and Last-Modified
            new_signals_count (int): Number of new signals processed
        """
        watermark = self.get_or_create_watermark()
        
        # Update timestamp
        watermark.last_timestamp = timezone.now()
        
        # Update HTTP headers if provided
        if response_headers:
            if response_headers.get('etag'):
                watermark.last_etag = response_headers['etag']
            if response_headers.get('last_modified'):
                watermark.last_modified = response_headers['last_modified']
        
        # Adjust scrape interval based on activity
        if new_signals_count == 0:
            watermark.consecutive_no_changes += 1
            # Gradually increase interval if no changes (max 5 minutes)
            if watermark.consecutive_no_changes > 3:
                watermark.scrape_interval = min(300, watermark.scrape_interval + 30)
                print(f"📈 Increased scrape interval to {watermark.scrape_interval}s due to inactivity")
        else:
            watermark.consecutive_no_changes = 0
            # Decrease interval if we're getting new signals (min 30 seconds)
            watermark.scrape_interval = max(30, watermark.scrape_interval - 15)
            print(f"📉 Decreased scrape interval to {watermark.scrape_interval}s due to activity")
        
        watermark.save()
        print(f"💾 Watermark updated - New signals: {new_signals_count}, Next interval: {watermark.scrape_interval}s")
    
    def save_scraped_data(self, formatted_text, source_url, raw_html=None):
        """
        Save the scraped forex signals to the database
        
        Args:
            formatted_text (str): Formatted text content
            source_url (str): URL where data was scraped from
            raw_html (str, optional): Raw HTML content
            
        Returns:
            ScrapedData: The saved data instance
        """
        scraped_data = ScrapedData(
            content_html=raw_html,
            content_text=formatted_text,
            source_url=source_url,
            status='success',
            is_processed=True
        )
        scraped_data.save()
        logger.info(f"Saved scraped data from {source_url}")
        
        return scraped_data 