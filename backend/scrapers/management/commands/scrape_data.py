import os
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from scrapers.services.website_scraper import WebsiteScraper

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Scrape data from the target website'

    def add_arguments(self, parser):
        parser.add_argument(
            '--url',
            type=str,
            help='The URL to scrape',
            required=True
        )
        parser.add_argument(
            '--div-id',
            type=str,
            help='The ID of the div to extract',
            required=True
        )
        parser.add_argument(
            '--username',
            type=str,
            help='Username for login',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for login',
        )
        parser.add_argument(
            '--login-url',
            type=str,
            help='URL for the login page',
        )

    def handle(self, *args, **options):
        # Get command line arguments
        url = options['url']
        div_id = options['div_id']
        username = options.get('username') or os.environ.get('SCRAPER_USERNAME')
        password = options.get('password') or os.environ.get('SCRAPER_PASSWORD')
        login_url = options.get('login_url') or os.environ.get('SCRAPER_LOGIN_URL')
        
        if not all([username, password, login_url]):
            self.stderr.write(
                self.style.ERROR(
                    'Please provide username, password, and login URL either as command arguments or environment variables'
                )
            )
            return
        
        # Extract base URL from the target URL
        base_url = url.split('/')[0] + '//' + url.split('/')[2]
        
        try:
            # Create and initialize the scraper
            scraper = WebsiteScraper(base_url)
            
            # Login
            self.stdout.write(self.style.WARNING(f"Logging in to {login_url}..."))
            credentials = {
                'username': username,
                'password': password,
                # Add any other required fields for your login form
            }
            
            login_success = scraper.login(login_url, credentials)
            if not login_success:
                self.stderr.write(self.style.ERROR('Login failed'))
                return
            
            self.stdout.write(self.style.SUCCESS('Login successful'))
            
            # Scrape the target data
            self.stdout.write(self.style.WARNING(f"Scraping data from {url}, div ID: {div_id}..."))
            scraped_data = scraper.scrape_target_data(url, div_id)
            
            if scraped_data:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully scraped data from {url} "
                        f"(ID: {scraped_data.id}, {len(scraped_data.content_text)} chars)"
                    )
                )
            else:
                self.stderr.write(self.style.ERROR(f"Failed to scrape data from {url}"))
                
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error during scraping: {str(e)}"))
            logger.exception("Error during scraping")
            
        self.stdout.write(self.style.SUCCESS('Done')) 