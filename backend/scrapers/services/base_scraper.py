import logging
import requests
from bs4 import BeautifulSoup
from django.conf import settings
from ..models import ScrapedData

logger = logging.getLogger(__name__)

class BaseScraper:
    """
    Base scraper class with core functionality for FX Leaders scraper.
    """
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.logged_in = False
    
    def get_page(self, url):
        """
        Get a page from the website
        
        Args:
            url (str): URL to fetch
        
        Returns:
            str: HTML content or None if failed
        """
        try:
            logger.info(f"Getting page: {url}")
            response = self.session.get(url)
            
            # Log response details
            logger.info(f"Response status: {response.status_code}, content length: {len(response.text)}")
            
            if response.status_code >= 400:
                logger.error(f"HTTP error: {response.status_code}")
                return None
                
            response.raise_for_status()
            return response.text
        except Exception as e:
            logger.error(f"Error fetching page {url}: {str(e)}")
            return None
    
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