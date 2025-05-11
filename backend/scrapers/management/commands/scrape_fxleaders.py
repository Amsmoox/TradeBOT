import os
import logging
import traceback
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from scrapers.services.fxleaders_scraper import FXLeadersScraper
from scrapers.models import ScrapedData

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Scrape forex signals from FX Leaders'

    def add_arguments(self, parser):
        parser.add_argument(
            '--print-only',
            action='store_true',
            help='Only print the signals without saving to database'
        )
        parser.add_argument(
            '--debug',
            action='store_true',
            help='Print additional debugging information'
        )
        parser.add_argument(
            '--timing',
            action='store_true',
            help='Show detailed timing information for each step'
        )

    def handle(self, *args, **options):
        print_only = options.get('print_only', False)
        debug = options.get('debug', False)
        show_timing = options.get('timing', False)
        
        if debug:
            self.stdout.write(self.style.WARNING("DEBUG MODE ENABLED"))
            self.stdout.write(f"Environment variables:")
            self.stdout.write(f"LOGIN_URL: {os.environ.get('FXLEADERS_LOGIN_URL')}")
            self.stdout.write(f"SIGNALS_URL: {os.environ.get('FXLEADERS_SIGNALS_URL')}")
            self.stdout.write(f"USERNAME: {os.environ.get('FXLEADERS_USERNAME')}")
            self.stdout.write(f"PASSWORD: {'*' * len(os.environ.get('FXLEADERS_PASSWORD', ''))}")
        
        try:
            self.stdout.write(self.style.WARNING(f"Starting FX Leaders scraper..."))
            
            # Track start time
            total_start_time = time.time()
            
            # Create and initialize the scraper
            scraper = FXLeadersScraper()
            
            # Get signals with timing
            login_start_time = time.time()
            signals = scraper.get_forex_signals()
            scraping_time = time.time() - login_start_time
            
            if not signals:
                self.stderr.write(self.style.ERROR('Failed to scrape signals from FX Leaders'))
                return
            
            self.stdout.write(self.style.SUCCESS(f"Successfully scraped {len(signals)} signals"))
            
            if show_timing:
                self.stdout.write(self.style.WARNING(f"Scraping time: {scraping_time:.2f} seconds"))
            
            # Print formatted signals
            for i, signal in enumerate(signals, 1):
                self.stdout.write("\n" + "-" * 40)
                self.stdout.write(f"Signal #{i}:")
                self.stdout.write(signal['formatted_text'])
                
            # Save to database if not print_only
            if not print_only:
                db_start_time = time.time()
                saved_count = 0
                
                for signal in signals:
                    # Save detailed signal data to our enhanced model
                    scraped_data = ScrapedData(
                        content_html=signal.get('raw_html', ''),
                        content_text=signal['formatted_text'],
                        source_url=os.environ.get('FXLEADERS_SIGNALS_URL', 'https://www.fxleaders.com/forex-signals/'),
                        status='success',
                        is_processed=True,
                        # Save the detailed fields
                        instrument=signal.get('instrument', ''),
                        action=signal.get('action', ''),
                        entry_price=signal.get('entry_price', ''),
                        take_profit=signal.get('take_profit', ''),
                        stop_loss=signal.get('stop_loss', ''),
                        status_signal=signal.get('status', '')
                    )
                    scraped_data.save()
                    saved_count += 1
                
                db_time = time.time() - db_start_time
                self.stdout.write(self.style.SUCCESS(f"Saved {saved_count} signals to database"))
                
                if show_timing:
                    self.stdout.write(self.style.WARNING(f"Database save time: {db_time:.2f} seconds"))
                
            # Show total execution time
            total_time = time.time() - total_start_time
            self.stdout.write(self.style.SUCCESS(f"Total execution time: {total_time:.2f} seconds"))
                
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error during scraping: {str(e)}"))
            if debug:
                self.stderr.write(traceback.format_exc())
            logger.exception("Error during scraping")
            
        self.stdout.write(self.style.SUCCESS('Done')) 