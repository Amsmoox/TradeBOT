import logging
import os
import re
import requests
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper
import time

# Add Selenium imports
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
    Scraper for FX Leaders forex signals.
    Handles authentication and extracts forex signals with formatting.
    """
    
    def __init__(self):
        login_url = os.environ.get('FXLEADERS_LOGIN_URL')
        signals_url = os.environ.get('FXLEADERS_SIGNALS_URL')
        
        # Extract base URL from login URL
        if login_url:
            base_url = '/'.join(login_url.split('/')[:3])
        else:
            base_url = 'https://www.fxleaders.com'
            
        super().__init__(base_url)
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
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1',
        })
        
    def authenticate(self):
        """
        Authenticate with FX Leaders using Selenium
        
        Returns:
            bool: True if login successful, False otherwise
        """
        username = os.environ.get('FXLEADERS_USERNAME')
        password = os.environ.get('FXLEADERS_PASSWORD')
        
        if not all([username, password, self.login_url]):
            logger.error("Missing credentials or login URL in environment variables")
            return False
            
        print(f"Logging in to {self.login_url} with username {username}")
        
        try:
            # Initialize Selenium WebDriver
            options = webdriver.ChromeOptions()
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            options.add_argument("--window-size=1920,1080")
            options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
            
            if ChromeDriverManager:
                self.driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
            else:
                self.driver = webdriver.Chrome(options=options)
                
            print("Initialized Selenium WebDriver")
            
            # Navigate to login page
            print(f"Navigating to login page: {self.login_url}")
            self.driver.get(self.login_url)
            
            # Wait for login form elements
            wait_timeout = 15
            try:
                print("Waiting for login form elements...")
                username_field = WebDriverWait(self.driver, wait_timeout).until(
                    EC.presence_of_element_located((By.NAME, 'log'))
                )
                password_field = self.driver.find_element(By.NAME, 'pwd')
                
                # Find the login button
                login_button_selector = "#fxl-btn-login"  # Main button selector
                login_button = WebDriverWait(self.driver, wait_timeout).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, login_button_selector))
                )
                print("Login form elements found")
                
            except TimeoutException:
                logger.error("Timeout waiting for login form elements")
                print("Error: Could not find login form elements")
                return False
                
            # Enter credentials and login
            print("Entering credentials...")
            username_field.clear()
            username_field.send_keys(username)
            password_field.clear()
            password_field.send_keys(password)
            
            print("Clicking login button...")
            login_button.click()
            
            # Wait for login to complete - check for success indicators
            wait_timeout_result = 15
            login_successful = False
            
            # Different login verification methods
            login_indicators = [
                {"type": "presence", "selector": "a[href*='logout']", "description": "Logout link"},
                {"type": "presence", "selector": ".account-menu", "description": "Account menu"},
                {"type": "absence", "selector": "#fxl-btn-login", "description": "Login button absence"}
            ]
            
            print("Verifying login with multiple methods...")
            for indicator in login_indicators:
                try:
                    if indicator["type"] == "presence":
                        WebDriverWait(self.driver, wait_timeout_result).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, indicator["selector"]))
                        )
                        print(f"Login verified with {indicator['description']} presence")
                        login_successful = True
                        break
                    elif indicator["type"] == "absence":
                        WebDriverWait(self.driver, wait_timeout_result).until(
                            EC.invisibility_of_element_located((By.CSS_SELECTOR, indicator["selector"]))
                        )
                        print(f"Login verified with {indicator['description']}")
                        login_successful = True
                        break
                except TimeoutException:
                    print(f"Could not verify login with {indicator['description']}")
                    continue
            
            # Check URL-based indicators
            current_url = self.driver.current_url
            if not login_successful:
                if "/account" in current_url or "logged-in" in current_url or "dashboard" in current_url:
                    print(f"Login verified by URL: {current_url}")
                    login_successful = True
            
            # Final login check
            if not login_successful:
                # Check if we're still on login page
                if self.login_url in self.driver.current_url:
                    logger.error("Still on login page after login attempt")
                    print("Login failed: Still on login page")
                    return False
                
                # Check for login error messages
                login_errors = self.driver.find_elements(By.CSS_SELECTOR, ".error-message, .alert-danger")
                if login_errors:
                    error_messages = [err.text for err in login_errors]
                    logger.error(f"Login error messages: {', '.join(error_messages)}")
                    print(f"Login failed: Error messages: {', '.join(error_messages)}")
                    return False
            
            # Add wait after login for session stabilization
            print("Login successful. Waiting for session to stabilize...")
            time.sleep(6)
            
            # If we got here, login is considered successful
            self.logged_in = True
            logger.info("Successfully logged in via Selenium")
            print("Successfully logged in via Selenium")
            return True
            
        except Exception as e:
            logger.error(f"Error during Selenium login: {str(e)}")
            print(f"Login error: {str(e)}")
            return False
            
    def get_forex_signals(self):
        """
        Scrape forex signals from FX Leaders
        
        Returns:
            list: List of formatted signal dictionaries or None if scraping failed
        """
        if not self.logged_in:
            if not self.authenticate():
                logger.error("Authentication failed. Cannot get forex signals")
                return None
        
        try:
            if self.driver:
                # Use Selenium to get signals page
                print(f"Navigating to signals page: {self.signals_url}")
                self.driver.get(self.signals_url)
                
                # Wait for dynamic content
                print("Waiting for page to load completely...")
                time.sleep(15)
                
                # Wait for signals container
                signals_container_selector = "#fxl-sig-active-cntr"
                wait_timeout = 30
                try:
                    print(f"Waiting for signals container ({signals_container_selector})...")
                    signals_container = WebDriverWait(self.driver, wait_timeout).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, signals_container_selector))
                    )
                    print("Signals container loaded")
                    
                    # Wait for first price element
                    first_price_selector = f"{signals_container_selector} div.fxml-sig-cntr .col-8 .row.font-12 > .col-4:nth-of-type(1) span[ng-if]"
                    try:
                        print("Waiting for first price element...")
                        WebDriverWait(self.driver, 10).until(
                            EC.visibility_of_element_located((By.CSS_SELECTOR, first_price_selector))
                        )
                        print("First price element is visible")
                    except TimeoutException:
                        print("Timed out waiting for first price element. Proceeding anyway.")
                
                except TimeoutException:
                    logger.error("Timed out waiting for signals container")
                    print("Error: Timed out waiting for signals container")
                    return None
                
                # Get page source
                html_content = self.driver.page_source
                return self._extract_signals(html_content)
                
            else:
                # Fallback to requests if Selenium not available
                print(f"Selenium driver not available. Using requests to access: {self.signals_url}")
                html_content = self.get_page(self.signals_url)
                
                if not html_content:
                    logger.error(f"Failed to get page content from {self.signals_url}")
                    return None
                    
                print("Successfully accessed signals page, scraping forex signals...")
                return self._extract_signals(html_content)
                
        except Exception as e:
            logger.error(f"Error scraping signals: {str(e)}")
            print(f"Error scraping signals: {str(e)}")
            return None
        finally:
            # Close Selenium driver if it exists
            if self.driver:
                print("Closing Selenium WebDriver")
                self.driver.quit()
                self.driver = None
    
    def _extract_signals(self, html_content):
        """
        Extract forex signals from HTML content
        
        Args:
            html_content (str): HTML content of the signals page
            
        Returns:
            list: List of formatted signal dictionaries
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Check if we're on the right page
        if "Live Forex Signals" not in html_content:
            logger.error("Not on the forex signals page. Content does not match expected patterns")
            return None
            
        print("Found 'Live Forex Signals' on page, extracting signals...")
        
        # First try with the expected ID
        signals_div = soup.find(id='fxl-p-signals')
        
        if not signals_div:
            # Try alternative container search
            logger.warning("Could not find signals container with ID 'fxl-p-signals', trying alternative search")
            print("Searching for alternative signal containers...")
            
            # Try to find by class instead
            alternative_containers = [
                soup.find('div', class_='fxl-p-signals'),
                soup.find('div', class_='signals-container'),
                soup.find('div', class_='forex-signals')
            ]
            
            # Try to find the main section containing signals
            for container in alternative_containers:
                if container:
                    signals_div = container
                    print(f"Found alternative signals container with class: {container.get('class')}")
                    break
            
            if not signals_div:
                # Last resort: try to find any div containing signal containers
                all_signal_containers = soup.find_all('div', class_='fxml-sig-cntr')
                if all_signal_containers:
                    # Create a parent div to hold all signals
                    signals_div = soup.new_tag('div')
                    for container in all_signal_containers:
                        signals_div.append(container)
                    print(f"Created virtual container with {len(all_signal_containers)} signal containers")
                else:
                    logger.error("Could not find any signal containers, page structure may have changed")
                    print("Could not find any signal containers on the page")
                    return None
        
        # Find all signal containers
        signal_containers = signals_div.find_all('div', class_='fxml-sig-cntr')
        if not signal_containers:
            logger.warning("No signal containers found. Trying alternative classes...")
            # Try alternative classes for signal containers
            signal_containers = signals_div.find_all('div', class_=lambda c: c and ('sig-cntr' in c or 'signal-container' in c))
            
        if not signal_containers:
            logger.warning("No signal containers found with any known classes. Page structure may have changed")
            return None
            
        print(f"Found {len(signal_containers)} signal containers")
        formatted_signals = []
        
        for container in signal_containers:
            try:
                # Try to find the instrument name with multiple selectors
                instrument_link = container.find('a', class_='hover text-black')
                if not instrument_link:
                    instrument_link = container.find('a', class_=lambda c: c and 'hover' in c)
                if not instrument_link:
                    instrument_link = container.find('a', attrs={'href': lambda h: h and '/live-rates/' in h})
                    
                if not instrument_link:
                    print("Skipping a container: Could not extract instrument name")
                    continue
                    
                instrument = instrument_link.text.strip()
                
                # Extract action (buy/sell) with multiple selectors
                action_span = container.find('span', class_=lambda x: x and 'text-uppercase' in x)
                if not action_span:
                    # Try alternative ways to find action
                    action_spans = container.find_all('span')
                    for span in action_spans:
                        text = span.text.strip().upper()
                        if text in ['BUY', 'SELL']:
                            action_span = span
                            break
                            
                action = action_span.text.strip() if action_span else 'Unknown'
                
                # Extract prices with multiple selectors
                # First try the specific ng-if attributes
                entry_span = container.find('span', attrs={'ng-if': lambda x: x and 'signal.entryPrice' in x})
                if not entry_span:
                    # Try finding by context or position in columns
                    entry_cells = container.find_all('div', class_=lambda c: c and 'col-4' in c)
                    for cell in entry_cells:
                        prev_cell = cell.find_previous_sibling('div')
                        if prev_cell and 'Entry Price' in prev_cell.text:
                            entry_span = cell.find('span')
                            break
                
                entry_price = entry_span.text.strip() if entry_span else 'N/A'
                if entry_price == 'N/A':
                    print(f"Could not find entry price for {instrument}")
                
                # Similar approach for stop loss and take profit
                stop_loss_span = container.find('span', attrs={'ng-if': lambda x: x and 'signal.stopLoss' in x})
                stop_loss = stop_loss_span.text.strip() if stop_loss_span else 'N/A'
                
                take_profit_span = container.find('span', attrs={'ng-if': lambda x: x and 'signal.takeProfit' in x})
                take_profit = take_profit_span.text.strip() if take_profit_span else 'N/A'
                
                # Find status with multiple selectors
                status_span = container.find('span', class_=lambda x: x and ('blink' in x or 'ellipsis-animate' in x))
                if not status_span:
                    # Try to find by text content
                    status_candidates = ['Active', 'Get Ready', 'Closed']
                    for span in container.find_all('span'):
                        if span.text.strip() in status_candidates:
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
                print(f"Error extracting a signal: {str(e)}")
                continue
        
        print(f"Successfully extracted {len(formatted_signals)} signals")
        return formatted_signals 