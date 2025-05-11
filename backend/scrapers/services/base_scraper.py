import logging
import requests
from bs4 import BeautifulSoup
from django.conf import settings
from ..models import ScrapedData

logger = logging.getLogger(__name__)

class BaseScraper:
    """
    Base scraper class with login functionality and core scraping methods.
    """
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.logged_in = False
    
    def login(self, login_url, credentials):
        """
        Log in to the website using provided credentials
        
        Args:
            login_url (str): URL for the login page
            credentials (dict): Username, password and any other required fields
        
        Returns:
            bool: True if login successful, False otherwise
        """
        try:
            response = self.session.post(login_url, data=credentials)
            response.raise_for_status()  # Raise exception for HTTP errors
            
            # Check if login was successful (customize this check for your site)
            # This could check for presence of certain elements, cookies, or redirects
            self.logged_in = self._verify_login(response)
            
            if self.logged_in:
                logger.info(f"Successfully logged in to {login_url}")
            else:
                logger.error(f"Failed to log in to {login_url}")
            
            return self.logged_in
        
        except Exception as e:
            logger.error(f"Error during login: {str(e)}")
            return False
    
    def _verify_login(self, response):
        """
        Verify if login was successful based on response
        Override this method for specific websites
        
        Args:
            response (Response): The response from the login request
        
        Returns:
            bool: True if login successful, False otherwise
        """
        # This is a placeholder - override in subclasses
        # Example: Check for login success by looking for a specific element
        return True
    
    def get_page(self, url):
        """
        Get a page from the website
        
        Args:
            url (str): URL to fetch
        
        Returns:
            str: HTML content or None if failed
        """
        if not self.logged_in:
            logger.error("Not logged in. Call login() first.")
            return None
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logger.error(f"Error fetching page {url}: {str(e)}")
            return None
    
    def extract_data(self, html, div_id):
        """
        Extract HTML content from specific div
        
        Args:
            html (str): HTML content
            div_id (str): ID of the div to extract
        
        Returns:
            str: HTML content of the div or None if not found
        """
        try:
            soup = BeautifulSoup(html, 'html.parser')
            target_div = soup.find(id=div_id)
            
            if target_div:
                return str(target_div)
            else:
                logger.warning(f"Div with id '{div_id}' not found")
                return None
                
        except Exception as e:
            logger.error(f"Error extracting data: {str(e)}")
            return None
    
    def process_text(self, html_content):
        """
        Process extracted HTML into clean text
        Override in subclasses for specific formatting needs
        
        Args:
            html_content (str): HTML content to process
        
        Returns:
            str: Processed text
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        return soup.get_text(separator=' ', strip=True)
    
    def save_scraped_data(self, html_content, source_url, processed_text=None):
        """
        Save the scraped data to the database
        
        Args:
            html_content (str): Raw HTML content
            source_url (str): URL where data was scraped from
            processed_text (str, optional): Processed text. If None, will be generated
            
        Returns:
            ScrapedData: The saved data instance
        """
        if processed_text is None and html_content:
            processed_text = self.process_text(html_content)
            is_processed = True
        else:
            is_processed = processed_text is not None
            
        scraped_data = ScrapedData(
            content_html=html_content,
            content_text=processed_text,
            source_url=source_url,
            status='success',
            is_processed=is_processed
        )
        scraped_data.save()
        logger.info(f"Saved scraped data from {source_url}")
        
        return scraped_data 