"""
Dynamic credential management for FXLeaders scraper
"""
from django.core.management.base import BaseCommand
from scrapers.models import InputSource
from scrapers.services.fxleaders_scraper import FXLeadersScraper
import os

class Command(BaseCommand):
    help = 'Update FXLeaders scraper to use database credentials'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-source',
            action='store_true',
            help='Create a new InputSource for FXLeaders with current env credentials',
        )

    def handle(self, *args, **options):
        if options['create_source']:
            self.create_fxleaders_source()
        else:
            self.update_scraper_integration()

    def create_fxleaders_source(self):
        """Create InputSource from current environment variables"""
        username = os.environ.get('FXLEADERS_USERNAME')
        password = os.environ.get('FXLEADERS_PASSWORD')
        login_url = os.environ.get('FXLEADERS_LOGIN_URL')
        signals_url = os.environ.get('FXLEADERS_SIGNALS_URL')

        if not all([username, password, login_url, signals_url]):
            self.stdout.write(
                self.style.ERROR('Missing FXLeaders environment variables')
            )
            return

        # Check if source already exists
        existing_source = InputSource.objects.filter(
            name='FXLeaders Production',
            source_type='trading_signals'
        ).first()

        if existing_source:
            self.stdout.write(
                self.style.WARNING('FXLeaders source already exists. Updating credentials...')
            )
            source = existing_source
        else:
            source = InputSource()
            source.name = 'FXLeaders Production'
            source.source_type = 'trading_signals'
            source.method = 'scraping'

        # Set URLs and credentials
        source.endpoint_url = signals_url
        source.set_credentials({
            'username': username,
            'password': password,
            'login_url': login_url,
            'signals_url': signals_url
        })
        source.set_config({
            'scrape_interval': '300',  # 5 minutes
            'max_signals_per_scrape': '50',
            'enable_delta_scraping': True,
            'chrome_headless': True
        })
        source.is_active = True
        source.save()

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created/updated FXLeaders InputSource (ID: {source.id})')
        )

    def update_scraper_integration(self):
        """Update scraper to use database credentials"""
        self.stdout.write("Updating FXLeaders scraper integration...")
        
        # Check if FXLeaders InputSource exists
        fxleaders_sources = InputSource.objects.filter(
            source_type='trading_signals',
            method='scraping',
            is_active=True
        ).filter(
            name__icontains='fxleaders'
        )

        if not fxleaders_sources.exists():
            self.stdout.write(
                self.style.WARNING('No active FXLeaders InputSource found. Run with --create-source first.')
            )
            return

        source = fxleaders_sources.first()
        credentials = source.get_credentials()
        
        self.stdout.write(f"Found FXLeaders source: {source.name} (ID: {source.id})")
        self.stdout.write(f"Credentials available: {list(credentials.keys())}")
        
        # Test the credentials
        if all(key in credentials for key in ['username', 'password', 'login_url']):
            self.stdout.write(
                self.style.SUCCESS('✅ FXLeaders scraper can now use database credentials')
            )
            
            # Test connection
            self.stdout.write("Testing connection...")
            scraper = FXLeadersScraper()
            test_result = scraper.test_login(
                credentials['username'], 
                credentials['password']
            )
            
            if test_result['success']:
                self.stdout.write(
                    self.style.SUCCESS('✅ Connection test successful')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'❌ Connection test failed: {test_result.get("error")}')
                )
        else:
            self.stdout.write(
                self.style.ERROR('❌ Missing required credentials in database')
            )
