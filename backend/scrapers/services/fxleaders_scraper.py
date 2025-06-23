import logging
import os
import re
import hashlib
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException, NoSuchElementException
from django.utils import timezone
from datetime import timedelta

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Try to import webdriver_manager
try:
    from webdriver_manager.chrome import ChromeDriverManager
except ImportError:
    ChromeDriverManager = None

from ..models import ScrapedData

logger = logging.getLogger(__name__)

class FXLeadersScraper(BaseScraper):
    """
    Enhanced FX Leaders scraper with comprehensive logging and error handling
    """
    
    def __init__(self):
        # Load credentials first and log their status
        login_url = os.environ.get('FXLEADERS_LOGIN_URL')
        signals_url = os.environ.get('FXLEADERS_SIGNALS_URL')
        username = os.environ.get('FXLEADERS_USERNAME')
        password = os.environ.get('FXLEADERS_PASSWORD')
        
        print(f"🔧 FXLeaders Scraper Configuration:")
        print(f"   • Login URL: {'✅ SET' if login_url else '❌ NOT SET'}")
        print(f"   • Signals URL: {'✅ SET' if signals_url else '❌ NOT SET'}")
        print(f"   • Username: {'✅ SET' if username else '❌ NOT SET'}")
        print(f"   • Password: {'✅ SET' if password else '❌ NOT SET'}")
        
        if not all([login_url, signals_url, username, password]):
            missing = []
            if not login_url: missing.append('FXLEADERS_LOGIN_URL')
            if not signals_url: missing.append('FXLEADERS_SIGNALS_URL')
            if not username: missing.append('FXLEADERS_USERNAME')
            if not password: missing.append('FXLEADERS_PASSWORD')
            
            print(f"❌ Missing environment variables: {', '.join(missing)}")
            print(f"💡 Please check your .env file or environment configuration")
        
        # Extract base URL from login URL
        if login_url:
            base_url = '/'.join(login_url.split('/')[:3])
        else:
            base_url = 'https://www.fxleaders.com'
            
        super().__init__(base_url, source_name='fxleaders')
        self.login_url = login_url
        self.signals_url = signals_url
        self.username = username
        self.password = password
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
        Authenticate with FX Leaders using Selenium (with enhanced logging)
        """
        if not all([self.username, self.password, self.login_url]):
            error_msg = "Missing authentication credentials or login URL"
            print(f"❌ Authentication failed: {error_msg}")
            logger.error(error_msg)
            return False
            
        print(f"🔐 Starting authentication process...")
        print(f"   • Target URL: {self.login_url}")
        print(f"   • Username: {self.username}")
        
        try:
            # Initialize WebDriver with optimized options
            print(f"🚗 Initializing Chrome WebDriver...")
            options = webdriver.ChromeOptions()
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--headless")  # Run in headless mode (no visual browser)
            options.add_argument("--window-size=1366,768")  # Smaller window size
            options.add_argument("--disable-extensions")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)

            if ChromeDriverManager:
                print(f"   • Using webdriver-manager for Chrome driver")
                self.driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
            else:
                print(f"   • Using system Chrome driver")
                self.driver = webdriver.Chrome(options=options)
                
            # Navigate to login page
            print(f"🌐 Navigating to login page...")
            self.driver.get(self.login_url)
            print(f"   • Current URL: {self.driver.current_url}")
            
            # Wait for page to load and find login elements
            print(f"⏳ Waiting for login form elements...")
            wait_timeout = 15
            try:
                username_field = WebDriverWait(self.driver, wait_timeout).until(
                    EC.presence_of_element_located((By.NAME, 'log'))
                )
                print(f"   ✅ Found username field")
                
                password_field = self.driver.find_element(By.NAME, 'pwd')
                print(f"   ✅ Found password field")
                
                login_button = WebDriverWait(self.driver, wait_timeout).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "#fxl-btn-login"))
                )
                print(f"   ✅ Found login button")
                
            except TimeoutException as e:
                error_msg = f"Timeout waiting for login form elements: {str(e)}"
                print(f"❌ {error_msg}")
                logger.error(error_msg)
                return False
                
            # Enter credentials and login
            print(f"📝 Entering credentials...")
            username_field.clear()
            username_field.send_keys(self.username)
            password_field.clear()
            password_field.send_keys(self.password)
            
            print(f"🔐 Clicking login button...")
            login_button.click()
            
            # Wait for login to complete
            print(f"⏳ Verifying login success...")
            wait_timeout_result = 10
            login_successful = False
            
            # Check for login success indicators
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
                        print(f"   ✅ Login successful: Found {indicator['description']}")
                        login_successful = True
                        break
                    elif indicator["type"] == "absence":
                        WebDriverWait(self.driver, wait_timeout_result).until(
                            EC.invisibility_of_element_located((By.CSS_SELECTOR, indicator["selector"]))
                        )
                        print(f"   ✅ Login successful: {indicator['description']}")
                        login_successful = True
                        break
                except TimeoutException:
                    print(f"   ⏳ Checking {indicator['description']}...")
                    continue
            
            # URL-based check as fallback
            if not login_successful:
                current_url = self.driver.current_url
                print(f"   🔍 Current URL after login: {current_url}")
                if "/account" in current_url or "logged-in" in current_url or "dashboard" in current_url:
                    login_successful = True
                    print(f"   ✅ Login successful: URL indicates logged in state")
                elif self.login_url in current_url:
                    print(f"   ❌ Still on login page after login attempt")
                    
                    # Try to check for error messages
                    try:
                        error_elements = self.driver.find_elements(By.CSS_SELECTOR, ".error, .alert-danger, .notice-error")
                        if error_elements:
                            for elem in error_elements:
                                if elem.is_displayed() and elem.text.strip():
                                    print(f"   ❌ Login error message: {elem.text.strip()}")
                    except Exception:
                        pass
                    
                    return False
            
            # Short stabilization wait
            time.sleep(2)
            
            self.logged_in = login_successful
            if login_successful:
                print(f"✅ Authentication completed successfully!")
                logger.info("Successfully logged in to FX Leaders")
            else:
                print(f"❌ Authentication failed")
                logger.error("Login verification failed")
            
            return login_successful
            
        except Exception as e:
            error_msg = f"Error during authentication: {str(e)}"
            print(f"❌ {error_msg}")
            logger.error(error_msg)
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
        Extract forex signals from HTML content (with enhanced logging)
        """
        print("🔍 Parsing HTML content for signals...")
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Check if we're on the right page
        if "Live Forex Signals" not in html_content:
            print("❌ Page doesn't contain 'Live Forex Signals' - not on the forex signals page")
            logger.error("Not on the forex signals page")
            return None
        
        print("   ✅ Confirmed we're on the forex signals page")
            
        # Find signals container (optimized search)
        print("🔍 Looking for signals container in HTML...")
        signals_div = soup.find(id='fxl-sig-active-cntr') or soup.find(id='fxl-p-signals')
        
        if not signals_div:
            print("   ⚠️  Primary signal containers not found, trying alternative approach...")
            # Quick alternative search
            all_signal_containers = soup.find_all('div', class_='fxml-sig-cntr')
            if all_signal_containers:
                print(f"   ✅ Found {len(all_signal_containers)} individual signal containers")
                signals_div = soup.new_tag('div')
                for container in all_signal_containers:
                    signals_div.append(container)
            else:
                print("   ❌ No signal containers found with any method")
                logger.error("Could not find any signal containers")
                return None
        else:
            print("   ✅ Found signals container")
        
        # Find signal containers
        print("📋 Extracting individual signals...")
        signal_containers = signals_div.find_all('div', class_='fxml-sig-cntr')
        if not signal_containers:
            print("   ⚠️  No signals with 'fxml-sig-cntr' class, trying alternative classes...")
            signal_containers = signals_div.find_all('div', class_=lambda c: c and ('sig-cntr' in c))
            
        if not signal_containers:
            print("   ❌ No signal containers found")
            logger.error("No signal containers found")
            return None
            
        print(f"   📊 Found {len(signal_containers)} signal containers to process")
        formatted_signals = []
        
        for i, container in enumerate(signal_containers, 1):
            print(f"   🔍 Processing signal {i}/{len(signal_containers)}...")
            try:
                # Extract instrument name
                instrument_link = container.find('a', class_='hover text-black') or \
                                container.find('a', class_=lambda c: c and 'hover' in c) or \
                                container.find('a', attrs={'href': lambda h: h and '/live-rates/' in h})
                    
                if not instrument_link:
                    print(f"      ⚠️  Signal {i}: No instrument link found, skipping")
                    continue
                    
                instrument = instrument_link.text.strip()
                print(f"      📈 Signal {i}: Instrument = {instrument}")
                
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
                print(f"      🎯 Signal {i}: Action = {action}")
                
                # Extract prices with direct search
                entry_span = container.find('span', attrs={'ng-if': lambda x: x and 'entryPrice' in x})
                entry_price = entry_span.text.strip() if entry_span else 'N/A'
                
                stop_loss_span = container.find('span', attrs={'ng-if': lambda x: x and 'stopLoss' in x})
                stop_loss = stop_loss_span.text.strip() if stop_loss_span else 'N/A'
                
                take_profit_span = container.find('span', attrs={'ng-if': lambda x: x and 'takeProfit' in x})
                take_profit = take_profit_span.text.strip() if take_profit_span else 'N/A'
                
                print(f"      💰 Signal {i}: Entry={entry_price}, SL={stop_loss}, TP={take_profit}")
                
                # Find status
                status_span = container.find('span', class_=lambda x: x and ('blink' in x or 'ellipsis-animate' in x))
                if not status_span:
                    for span in container.find_all('span'):
                        if span.text.strip() in ['Active', 'Get Ready', 'Closed']:
                            status_span = span
                            break
                
                status = status_span.text.strip() if status_span else 'Unknown'
                print(f"      📊 Signal {i}: Status = {status}")
                
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
                
                print(f"      ✅ Signal {i}: Successfully extracted and formatted")
                
            except Exception as e:
                print(f"      ❌ Signal {i}: Error extracting - {str(e)}")
                logger.error(f"Error extracting signal: {str(e)}")
                continue
        
        print(f"✅ Successfully extracted {len(formatted_signals)} signals total")
        if len(formatted_signals) > 0:
            print(f"📋 Signal summary:")
            for i, signal in enumerate(formatted_signals, 1):
                print(f"   {i}. {signal['instrument']} - {signal['action']} - {signal['status']}")
        
        return formatted_signals

    def delta_scrape_forex_signals(self):
        """
        Intelligent delta-scraping with duplicate detection and conditional HTTP requests
        """
        print("🚀 Starting intelligent delta-scrape for FX Leaders...")
        
        # Check configuration first
        if not all([self.username, self.password, self.login_url, self.signals_url]):
            missing = []
            if not self.username: missing.append('FXLEADERS_USERNAME')
            if not self.password: missing.append('FXLEADERS_PASSWORD')
            if not self.login_url: missing.append('FXLEADERS_LOGIN_URL')
            if not self.signals_url: missing.append('FXLEADERS_SIGNALS_URL')
            
            error_msg = f"Missing configuration: {', '.join(missing)}"
            print(f"❌ Delta-scrape failed: {error_msg}")
            return {
                'success': False,
                'new_signals': 0,
                'duplicates_skipped': 0,
                'error': error_msg
            }
        
        # Check if authentication is needed
        if not self.logged_in:
            print("🔐 Authentication required for FX Leaders...")
            if not self.authenticate():
                print("❌ Authentication failed - cannot proceed with scraping")
                return {
                    'success': False,
                    'new_signals': 0,
                    'duplicates_skipped': 0,
                    'error': 'Authentication failed'
                }
        
        try:
            if self.driver:
                print("🌐 Using Selenium-based scraping (authenticated session)")
                # For Selenium, we can't use conditional headers directly
                # but we can still check for changes and avoid duplicate processing
                return self._delta_scrape_with_selenium()
            else:
                print("📡 Using HTTP requests-based scraping")
                # Use conditional HTTP requests for non-Selenium scraping
                return self._delta_scrape_with_requests()
                
        except Exception as e:
            error_msg = f"Error during delta-scraping: {str(e)}"
            logger.error(error_msg)
            print(f"❌ Delta-scrape failed: {error_msg}")
            print(f"🔍 Exception details: {repr(e)}")
            return {
                'success': False,
                'new_signals': 0,
                'duplicates_skipped': 0,
                'error': error_msg
            }
        finally:
            # Always close Selenium driver
            if self.driver:
                print("🔧 Closing Selenium driver...")
                self.driver.quit()
                self.driver = None
    
    def _delta_scrape_with_selenium(self):
        """Delta scraping using Selenium (for authenticated pages)"""
        print("🌐 Executing Selenium-based delta-scraping...")
        
        # Navigate to signals page
        print(f"📍 Navigating to signals page: {self.signals_url}")
        self.driver.get(self.signals_url)
        
        print(f"   • Current URL: {self.driver.current_url}")
        
        # Wait for page to load
        print("⏳ Waiting for page to load...")
        time.sleep(5)
        
        # Check if we're on the right page
        if "forex-signals" not in self.driver.current_url.lower():
            print(f"⚠️  Warning: URL doesn't contain 'forex-signals', might not be on signals page")
        
        # Wait for signals container
        print("🔍 Looking for signals container...")
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "fxl-sig-active-cntr"))
            )
            print("   ✅ Found signals container")
        except TimeoutException:
            print("   ⚠️  Signals container not found with primary selector, checking alternatives...")
            try:
                WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".fxml-sig-cntr"))
                )
                print("   ✅ Found signals with alternative selector")
            except TimeoutException:
                print("   ❌ No signals container found - page might not have loaded correctly")
        
        # Get page source and process
        print("📄 Extracting page content...")
        html_content = self.driver.page_source
        
        print(f"📏 Page content length: {len(html_content)} characters")
        
        # Quick check for expected content
        if "Live Forex Signals" in html_content:
            print("   ✅ Page contains 'Live Forex Signals' - looks correct")
        else:
            print("   ⚠️  Page doesn't contain 'Live Forex Signals' - might be wrong page or loading issue")
        
        signals = self._extract_signals(html_content)
        
        if not signals:
            print("⚠️  No signals extracted from page")
            self.update_watermark(new_signals_count=0)
            return {
                'success': True,
                'new_signals': 0,
                'duplicates_skipped': 0,
                'message': 'No signals found on page'
            }
        
        print(f"📊 Successfully extracted {len(signals)} signals from page")
        
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