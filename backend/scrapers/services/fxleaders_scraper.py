import logging
import os
import re
import hashlib
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper
import time

# Selenium imports
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException, NoSuchElementException
try:
    from webdriver_manager.chrome import ChromeDriverManager
except ImportError:
    ChromeDriverManager = None

logger = logging.getLogger(__name__)

class FXLeadersScraper(BaseScraper):
    """
    Optimized scraper for FX Leaders forex signals with intelligent delta-scraping.
    """
    
    def __init__(self):
        login_url = os.environ.get('FXLEADERS_LOGIN_URL')
        signals_url = os.environ.get('FXLEADERS_SIGNALS_URL')
        
        # Extract base URL from login URL
        if login_url:
            base_url = '/'.join(login_url.split('/')[:3])
        else:
            base_url = 'https://www.fxleaders.com'
            
        super().__init__(base_url, source_name='fxleaders')
        self.login_url = login_url
        self.signals_url = signals_url
        self.driver = None
        
        # Add realistic browser headers
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.fxleaders.com/',
            'Origin': 'https://www.fxleaders.com',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        
    def authenticate(self):
        """
        Authenticate with FX Leaders using Selenium (optimized)
        """
        username = os.environ.get('FXLEADERS_USERNAME')
        password = os.environ.get('FXLEADERS_PASSWORD')
        
        if not all([username, password, self.login_url]):
            logger.error("Missing credentials or login URL in environment variables")
            return False
            
        print(f"Logging in to {self.login_url}")
        
        try:
            # Initialize WebDriver with optimized options
            options = webdriver.ChromeOptions()
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--headless")  # Run in headless mode (no visual browser)
            options.add_argument("--window-size=1366,768")  # Smaller window size
            options.add_argument("--disable-extensions")
            
            if ChromeDriverManager:
                self.driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
            else:
                self.driver = webdriver.Chrome(options=options)
                
            # Navigate to login page
            self.driver.get(self.login_url)
            
            # Reduced timeout for login form elements
            wait_timeout = 10
            try:
                username_field = WebDriverWait(self.driver, wait_timeout).until(
                    EC.presence_of_element_located((By.NAME, 'log'))
                )
                password_field = self.driver.find_element(By.NAME, 'pwd')
                login_button = WebDriverWait(self.driver, wait_timeout).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "#fxl-btn-login"))
                )
            except TimeoutException:
                logger.error("Timeout waiting for login form elements")
                return False
                
            # Enter credentials and login
            username_field.send_keys(username)
            password_field.send_keys(password)
            login_button.click()
            
            # Reduced timeout for login verification
            wait_timeout_result = 8
            login_successful = False
            
            # Prioritized login verification methods
            login_indicators = [
                {"type": "presence", "selector": "a[href*='logout']", "description": "Logout link"},
                {"type": "absence", "selector": "#fxl-btn-login", "description": "Login button absence"}
            ]
            
            for indicator in login_indicators:
                try:
                    if indicator["type"] == "presence":
                        WebDriverWait(self.driver, wait_timeout_result).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, indicator["selector"]))
                        )
                        login_successful = True
                        break
                    elif indicator["type"] == "absence":
                        WebDriverWait(self.driver, wait_timeout_result).until(
                            EC.invisibility_of_element_located((By.CSS_SELECTOR, indicator["selector"]))
                        )
                        login_successful = True
                        break
                except TimeoutException:
                    continue
            
            # URL-based check as fallback
            if not login_successful:
                current_url = self.driver.current_url
                if "/account" in current_url or "logged-in" in current_url or "dashboard" in current_url:
                    login_successful = True
                elif self.login_url in current_url:
                    logger.error("Still on login page after login attempt")
                    return False
            
            # Short stabilization wait
            time.sleep(2)  # Reduced from 6 seconds
            
            self.logged_in = login_successful
            if login_successful:
                logger.info("Successfully logged in")
            else:
                logger.error("Login verification failed")
            
            return login_successful
            
        except Exception as e:
            logger.error(f"Error during login: {str(e)}")
            return False
            
    def get_forex_signals(self):
        """
        Scrape forex signals from FX Leaders (optimized)
        """
        if not self.logged_in:
            if not self.authenticate():
                logger.error("Authentication failed")
                return None
        
        try:
            if self.driver:
                # Navigate to signals page
                print(f"Navigating to signals page: {self.signals_url}")
                self.driver.get(self.signals_url)
                
                # Reduced wait for page load
                time.sleep(5)  # Reduced from 15 seconds
                
                # Wait for signals container with reduced timeout
                signals_container_selector = "#fxl-sig-active-cntr"
                wait_timeout = 10  # Reduced from 30 seconds
                try:
                    signals_container = WebDriverWait(self.driver, wait_timeout).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, signals_container_selector))
                    )
                    
                    # Quick check for any price element (reduced timeout)
                    try:
                        WebDriverWait(self.driver, 3).until(
                            EC.visibility_of_element_located((By.CSS_SELECTOR, ".fxml-sig-cntr .col-8 .row span"))
                        )
                    except TimeoutException:
                        # Continue anyway if prices aren't immediately visible
                        pass
                
                except TimeoutException:
                    logger.error("Timed out waiting for signals container")
                    return None
                
                # Get page source and extract signals
                html_content = self.driver.page_source
                return self._extract_signals(html_content)
                
            else:
                # Fallback to requests if Selenium not available
                html_content = self.get_page(self.signals_url)
                if not html_content:
                    logger.error(f"Failed to get page content")
                    return None
                return self._extract_signals(html_content)
                
        except Exception as e:
            logger.error(f"Error scraping signals: {str(e)}")
            return None
        finally:
            # Close Selenium driver
            if self.driver:
                self.driver.quit()
                self.driver = None
    
    def _extract_signals(self, html_content):
        """
        Extract forex signals from HTML content (optimized)
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Check if we're on the right page
        if "Live Forex Signals" not in html_content:
            logger.error("Not on the forex signals page")
            return None
            
        # Find signals container (optimized search)
        signals_div = soup.find(id='fxl-sig-active-cntr') or soup.find(id='fxl-p-signals')
        
        if not signals_div:
            # Quick alternative search
            all_signal_containers = soup.find_all('div', class_='fxml-sig-cntr')
            if all_signal_containers:
                signals_div = soup.new_tag('div')
                for container in all_signal_containers:
                    signals_div.append(container)
            else:
                logger.error("Could not find any signal containers")
                return None
        
        # Find signal containers
        signal_containers = signals_div.find_all('div', class_='fxml-sig-cntr')
        if not signal_containers:
            signal_containers = signals_div.find_all('div', class_=lambda c: c and ('sig-cntr' in c))
            
        if not signal_containers:
            logger.error("No signal containers found")
            return None
            
        print(f"Found {len(signal_containers)} signals")
        formatted_signals = []
        
        for container in signal_containers:
            try:
                # Extract instrument name
                instrument_link = container.find('a', class_='hover text-black') or \
                                container.find('a', class_=lambda c: c and 'hover' in c) or \
                                container.find('a', attrs={'href': lambda h: h and '/live-rates/' in h})
                    
                if not instrument_link:
                    continue
                    
                instrument = instrument_link.text.strip()
                
                # Extract action (buy/sell)
                action_span = container.find('span', class_=lambda x: x and 'text-uppercase' in x)
                if not action_span:
                    action_spans = container.find_all('span')
                    for span in action_spans:
                        text = span.text.strip().upper()
                        if text in ['BUY', 'SELL']:
                            action_span = span
                            break
                            
                action = action_span.text.strip() if action_span else 'Unknown'
                
                # Extract prices with direct search
                entry_span = container.find('span', attrs={'ng-if': lambda x: x and 'entryPrice' in x})
                entry_price = entry_span.text.strip() if entry_span else 'N/A'
                
                stop_loss_span = container.find('span', attrs={'ng-if': lambda x: x and 'stopLoss' in x})
                stop_loss = stop_loss_span.text.strip() if stop_loss_span else 'N/A'
                
                take_profit_span = container.find('span', attrs={'ng-if': lambda x: x and 'takeProfit' in x})
                take_profit = take_profit_span.text.strip() if take_profit_span else 'N/A'
                
                # Find status
                status_span = container.find('span', class_=lambda x: x and ('blink' in x or 'ellipsis-animate' in x))
                if not status_span:
                    for span in container.find_all('span'):
                        if span.text.strip() in ['Active', 'Get Ready', 'Closed']:
                            status_span = span
                            break
                
                status = status_span.text.strip() if status_span else 'Unknown'
                
                # Create formatted signal
                signal_emoji = "🔴" if action.lower() == "sell" else "🟢"
                status_emoji = "⚡" if status.lower() == "active" else "⏳"
                
                formatted_signal = f"{signal_emoji} {status_emoji} Signal for: {instrument}\n"
                formatted_signal += f"Action: {action}\n"
                formatted_signal += f"Status: {status}\n"
                
                if entry_price != 'N/A':
                    formatted_signal += f"Entry Price: {entry_price}\n"
                if stop_loss != 'N/A':
                    formatted_signal += f"Stop Loss: {stop_loss}\n"
                if take_profit != 'N/A':
                    formatted_signal += f"Take Profit: {take_profit}\n"
                
                formatted_signals.append({
                    'formatted_text': formatted_signal,
                    'instrument': instrument,
                    'action': action,
                    'status': status,
                    'entry_price': entry_price,
                    'stop_loss': stop_loss,
                    'take_profit': take_profit,
                    'raw_html': str(container)
                })
                
            except Exception as e:
                logger.error(f"Error extracting signal: {str(e)}")
                continue
        
        print(f"Successfully extracted {len(formatted_signals)} signals")
        return formatted_signals 

    def delta_scrape_forex_signals(self):
        """
        Intelligent delta-scraping with duplicate detection and conditional HTTP requests
        """
        print("🚀 Starting intelligent delta-scrape for FX Leaders...")
        
        # Check if authentication is needed
        if not self.logged_in:
            print("🔐 Authentication required...")
            if not self.authenticate():
                print("❌ Authentication failed")
                return {
                    'success': False,
                    'new_signals': 0,
                    'duplicates_skipped': 0,
                    'error': 'Authentication failed'
                }
        
        try:
            if self.driver:
                # For Selenium, we can't use conditional headers directly
                # but we can still check for changes and avoid duplicate processing
                return self._delta_scrape_with_selenium()
            else:
                # Use conditional HTTP requests for non-Selenium scraping
                return self._delta_scrape_with_requests()
                
        except Exception as e:
            error_msg = f"Error during delta-scraping: {str(e)}"
            logger.error(error_msg)
            print(f"❌ {error_msg}")
            return {
                'success': False,
                'new_signals': 0,
                'duplicates_skipped': 0,
                'error': error_msg
            }
        finally:
            # Always close Selenium driver
            if self.driver:
                self.driver.quit()
                self.driver = None
    
    def _delta_scrape_with_selenium(self):
        """Delta scraping using Selenium (for authenticated pages)"""
        print("🌐 Using Selenium for authenticated delta-scraping...")
        
        # Navigate to signals page
        print(f"📍 Navigating to: {self.signals_url}")
        self.driver.get(self.signals_url)
        
        # Wait for page to load
        time.sleep(5)
        
        # Get page source and process
        html_content = self.driver.page_source
        signals = self._extract_signals(html_content)
        
        if not signals:
            print("⚠️  No signals found")
            self.update_watermark(new_signals_count=0)
            return {
                'success': True,
                'new_signals': 0,
                'duplicates_skipped': 0,
                'message': 'No signals found'
            }
        
        # Process signals with duplicate detection
        return self._process_signals_with_duplicate_detection(signals)
    
    def _delta_scrape_with_requests(self):
        """Delta scraping using conditional HTTP requests"""
        print("📡 Using conditional HTTP requests for delta-scraping...")
        
        # Make conditional request
        html_content, is_modified, response_headers = self.get_page_with_conditional_headers(self.signals_url)
        
        if not is_modified:
            print("✅ No changes detected - exiting early")
            return {
                'success': True,
                'new_signals': 0,
                'duplicates_skipped': 0,
                'message': '304 Not Modified - no changes'
            }
        
        if not html_content:
            print("❌ Failed to get page content")
            return {
                'success': False,
                'new_signals': 0,
                'duplicates_skipped': 0,
                'error': 'Failed to get page content'
            }
        
        # Extract signals
        signals = self._extract_signals(html_content)
        
        if not signals:
            print("⚠️  No signals found in content")
            self.update_watermark(response_headers, new_signals_count=0)
            return {
                'success': True,
                'new_signals': 0,
                'duplicates_skipped': 0,
                'message': 'No signals found'
            }
        
        # Process signals with duplicate detection
        result = self._process_signals_with_duplicate_detection(signals)
        
        # Update watermark with response headers
        self.update_watermark(response_headers, result['new_signals'])
        
        return result
    
    def _process_signals_with_duplicate_detection(self, signals):
        """
        Process signals with intelligent duplicate detection
        """
        print(f"🔍 Processing {len(signals)} signals with duplicate detection...")
        
        # Get existing signal hashes to check for duplicates
        from ..models import ScrapedData
        existing_hashes = set(ScrapedData.objects.values_list('signal_hash', flat=True))
        print(f"📋 Loaded {len(existing_hashes)} existing signal hashes for duplicate check")
        
        new_signals = 0
        duplicates_skipped = 0
        
        for i, signal in enumerate(signals, 1):
            # Generate signal hash for duplicate detection
            signal_data = f"{signal.get('instrument', '')}_{signal.get('action', '')}_{signal.get('entry_price', '')}_{signal.get('stop_loss', '')}_{signal.get('take_profit', '')}"
            signal_hash = hashlib.sha256(signal_data.encode()).hexdigest()
            
            # Check for duplicates
            if signal_hash in existing_hashes:
                print(f"⏭️  Signal #{i}: DUPLICATE SKIPPED - {signal.get('instrument', 'Unknown')} {signal.get('action', '')}")
                duplicates_skipped += 1
                continue
            
            print(f"💾 Signal #{i}: SAVING NEW - {signal.get('instrument', 'Unknown')} {signal.get('action', '')}")
            print(f"       🔑 Hash: {signal_hash[:16]}...")
            
            # Save new signal to database
            try:
                scraped_data = ScrapedData(
                    content_html=signal.get('raw_html', ''),
                    content_text=signal['formatted_text'],
                    source_url=self.signals_url,
                    status='success',
                    is_processed=True,
                    instrument=signal.get('instrument', ''),
                    action=signal.get('action', ''),
                    entry_price=signal.get('entry_price', ''),
                    take_profit=signal.get('take_profit', ''),
                    stop_loss=signal.get('stop_loss', ''),
                    status_signal=signal.get('status', ''),
                    signal_hash=signal_hash
                )
                scraped_data.save()
                new_signals += 1
                
                # Add to our in-memory set to avoid duplicates within this batch
                existing_hashes.add(signal_hash)
                
            except Exception as e:
                print(f"❌ Error saving signal #{i}: {str(e)}")
                continue
        
        result = {
            'success': True,
            'new_signals': new_signals,
            'duplicates_skipped': duplicates_skipped,
            'total_processed': len(signals),
            'message': f'Processed {len(signals)} signals: {new_signals} new, {duplicates_skipped} duplicates'
        }
        
        print(f"✅ Delta-scrape complete: {result['message']}")
        return result 