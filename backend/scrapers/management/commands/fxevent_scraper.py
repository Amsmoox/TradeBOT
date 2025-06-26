import os
import logging
import traceback
import time
import re
from django.core.management.base import BaseCommand
from django.conf import settings
from bs4 import BeautifulSoup
import requests
from datetime import datetime
from scrapers.models import EconomicEvent

# Selenium imports
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Scrape economic calendar events from BabyPips'

    ALLOWED_CURRENCIES = ['USD', 'GBP', 'JPY', 'EUR']

    def add_arguments(self, parser):
        parser.add_argument(
            '--selenium',
            action='store_true',
            help='Use Selenium for dynamic content loading (recommended)'
        )
        parser.add_argument(
            '--days',
            type=int,
            default=31,
            help='Number of days to scrape (default: 31)'
        )
        parser.add_argument(
            '--impact',
            choices=['all', 'high', 'med', 'low'],
            default='all',
            help='Filter events by impact level (default: all)'
        )

    def handle(self, *args, **options):
        use_selenium = options.get('selenium', False)
        days_to_scrape = options.get('days', 31)
        impact_filter = options.get('impact', 'all')
        
        try:
            self.stdout.write(self.style.WARNING(f"Starting BabyPips Economic Calendar scraper..."))
            
            calendar_url = 'https://www.babypips.com/economic-calendar/'
            
            # Try Selenium first if requested
            events = None
            if use_selenium:
                try:
                    events = self.scrape_with_selenium(calendar_url, days_to_scrape, impact_filter)
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Selenium scraping failed, falling back to regular scraping method..."))
                    events = None
            
            # If Selenium failed or wasn't requested, use regular scraping
            if not events:
                events = self.scrape_with_requests(calendar_url, days_to_scrape, impact_filter)
            
            if not events:
                self.stderr.write(self.style.ERROR('Failed to scrape events from BabyPips Economic Calendar'))
                return
            
            # Filter and save events
            saved_count = self.save_events(events)
            
            self.stdout.write(self.style.SUCCESS(f"Successfully scraped and saved {saved_count} economic events"))
            
            # Print formatted events
            self.print_formatted_events(events)
                
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error during scraping: {str(e)}"))
            self.stderr.write(traceback.format_exc())
            logger.exception("Error during scraping")
            
        self.stdout.write(self.style.SUCCESS('Done'))
    
    def scrape_with_requests(self, url, days_to_scrape, impact_filter):
        """Scrape with requests library"""
        try:
            # Configure requests session with headers to mimic a browser
            session = requests.Session()
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.babypips.com/',
                'Connection': 'keep-alive',
            }
            session.headers.update(headers)
            
            # Fetch the page
            response = session.get(url)
            response.raise_for_status()
            
            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract events
            return self.extract_events(soup, days_to_scrape, impact_filter)
            
        except Exception as e:
            logger.error(f"Error scraping with requests: {str(e)}")
            return []
    
    def scrape_with_selenium(self, url, days_to_scrape, impact_filter):
        """Scrape with Selenium for dynamic content"""
        driver = None
        try:
            # Initialize WebDriver with optimized options
            options = Options()
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--headless")  # Run in headless mode
            options.add_argument("--window-size=1920,1080")  # Set larger window size
            
            chromedriver_path = os.environ.get('CHROMEDRIVER_PATH', '/usr/bin/chromedriver')
            driver = webdriver.Chrome(service=ChromeService(chromedriver_path), options=options)
            
            # Navigate to calendar page
            driver.get(url)
            
            # Wait for content to load and scroll to load more content
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "table"))
                )
                
                # Scroll multiple times to ensure all content is loaded
                last_height = driver.execute_script("return document.body.scrollHeight")
                while True:
                    # Scroll down
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    # Wait for new content
                    time.sleep(2)
                    
                    # Calculate new scroll height
                    new_height = driver.execute_script("return document.body.scrollHeight")
                    
                    # Break if no more new content
                    if new_height == last_height:
                        break
                    last_height = new_height
                    
            except TimeoutException:
                logger.error("Timeout waiting for content to load")
                # Try to continue anyway
            
            # Get the page source and parse it
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            
            # Extract events
            return self.extract_events(soup, days_to_scrape, impact_filter)
            
        except Exception as e:
            logger.error(f"Error scraping with Selenium: {str(e)}")
            return []
            
        finally:
            # Always close the driver
            if driver:
                driver.quit()
    
    def extract_events(self, soup, days_to_scrape, impact_filter):
        """Extract economic calendar events from the page"""
        events = []
        
        try:
            # Find all tables that contain events
            tables = soup.find_all('table')
            
            # Track the number of day tables processed
            days_processed = 0
            
            for table in tables:
                # Find the day header for this table
                day_header = self.get_table_day(table)
                
                if day_header:
                    # Increment counter when we find a new day
                    days_processed += 1
                    
                    # Check if we've processed enough days
                    if days_processed > days_to_scrape:
                        break
                    
                    # Find all rows in the table
                    rows = table.find_all('tr')
                    
                    # Skip header row if present
                    for row in rows[1:]:  # Skip first row which is typically header
                        event = self.extract_event_from_row(row, day_header)
                        if event:
                            # Apply impact filter
                            if impact_filter == 'all' or event['impact'].lower() == impact_filter.lower():
                                events.append(event)
            
            return events
            
        except Exception as e:
            logger.error(f"Error extracting events: {str(e)}")
            return []
    
    def get_table_day(self, table):
        """Get the day header for a table"""
        # Look for the day header in previous elements
        prev_elem = table.find_previous(['h2', 'h3', 'h4', 'div'])
        if prev_elem and prev_elem.text and 'Back to Top' in prev_elem.text:
            day_text = prev_elem.text.split('Back to Top')[0].strip()
            return day_text
        return None
    
    def extract_event_from_row(self, row, day_header):
        """Extract event data from a table row"""
        try:
            cells = row.find_all(['td', 'th'])
            if not cells or len(cells) < 3:
                return None
                
            # Initialize event with the day
            event = {
                'day': day_header,
                'time': '',
                'currency': '',
                'event_name': '',
                'impact': '',
                'actual': '',
                'forecast': '',
                'previous': ''
            }
            
            # Extract data based on column position
            if len(cells) > 0:
                event['time'] = cells[0].text.strip()
                
            if len(cells) > 1:
                event['currency'] = cells[1].text.strip()
                # Skip if not in allowed currencies
                if event['currency'] not in self.ALLOWED_CURRENCIES:
                    return None
                
            if len(cells) > 2:
                event_cell = cells[2]
                event_link = event_cell.find('a')
                if event_link:
                    event['event_name'] = event_link.text.strip()
                else:
                    event['event_name'] = event_cell.text.strip()
            
            if len(cells) > 3:
                impact_text = cells[3].text.strip().lower()
                if impact_text:
                    event['impact'] = impact_text
                else:
                    # Try to find impact from class or other attributes
                    if 'high' in str(cells[3]).lower():
                        event['impact'] = 'high'
                    elif 'med' in str(cells[3]).lower():
                        event['impact'] = 'med'
                    elif 'low' in str(cells[3]).lower():
                        event['impact'] = 'low'
            
            if len(cells) > 4:
                event['actual'] = cells[4].text.strip()
                
            if len(cells) > 5:
                event['forecast'] = cells[5].text.strip()
                
            if len(cells) > 6:
                event['previous'] = cells[6].text.strip()
            
            return event
            
        except Exception as e:
            logger.error(f"Error extracting event from row: {str(e)}")
            return None
    
    def print_formatted_events(self, events):
        """Print events in a well-formatted way"""
        current_day = None
        
        for event in events:
            # Print day header when it changes
            if event['day'] != current_day:
                current_day = event['day']
                self.stdout.write("\n" + "=" * 50)
                self.stdout.write(self.style.SUCCESS(f"{current_day}"))
                self.stdout.write("=" * 50)
            
            # Format the event details
            event_str = f"{event['time']} | {event['currency']} | {event['event_name']}"
            
            # Add impact with color
            impact = event['impact'].lower()
            if impact == 'high':
                impact_str = self.style.ERROR(impact.upper())
            elif impact == 'med':
                impact_str = self.style.WARNING(impact.upper())
            elif impact == 'low':
                impact_str = self.style.SUCCESS(impact.lower())
            else:
                impact_str = impact
                
            event_str += f" | Impact: {impact_str}"
            
            # Add actual, forecast, previous if available
            values = []
            if event['actual']:
                values.append(f"Actual: {event['actual']}")
            if event['forecast']:
                values.append(f"Forecast: {event['forecast']}")
            if event['previous']:
                values.append(f"Previous: {event['previous']}")
                
            if values:
                event_str += f" | {' | '.join(values)}"
                
            # Print the event
            self.stdout.write(event_str)
            self.stdout.write("-" * 50)
    
    def save_events(self, events):
        """Save events to database after filtering for allowed currencies"""
        saved_count = 0
        for event in events:
            # Skip events for currencies we don't want
            if event['currency'] not in self.ALLOWED_CURRENCIES:
                continue
                
            try:
                # Parse the date correctly from format like "May27Tuesday"
                day_str = event['day']
                # Extract month and day
                month = day_str[:3]  # Get first 3 chars (May)
                day = ''.join(filter(str.isdigit, day_str))  # Extract numbers (27)
                
                # Create date string and parse
                date_str = f"{month} {day}"
                day_date = datetime.strptime(date_str, '%b %d').replace(year=datetime.now().year)
                
                # Clean impact level
                impact = event['impact'].upper() if event['impact'] else 'LOW'
                if impact not in ['HIGH', 'MED', 'LOW']:
                    impact = 'LOW'
                
                # Clean the previous value (remove asterisk if present)
                previous = event['previous'].replace('*', '') if event['previous'] else None
                
                # Create or update the event
                economic_event, created = EconomicEvent.objects.update_or_create(
                    day=day_date,
                    time=event['time'],
                    currency=event['currency'],
                    event_name=event['event_name'],
                    defaults={
                        'impact': impact,
                        'actual': event['actual'] or None,
                        'forecast': event['forecast'] or None,
                        'previous': previous
                    }
                )
                saved_count += 1
                
            except Exception as e:
                logger.error(f"Error saving event {event}: {str(e)}")
                continue
                
        return saved_count