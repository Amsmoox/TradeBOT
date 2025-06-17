import os
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from scrapers.tasks import setup_periodic_scraping, intelligent_delta_scrape_task, get_scraping_status


class Command(BaseCommand):
    help = 'Initialize and start automatic forex signal scraping'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-task',
            action='store_true',
            help='Run a test scraping task immediately'
        )
        parser.add_argument(
            '--status',
            action='store_true',
            help='Show current scraping status'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("🚀 Initializing Automatic FX Leaders Scraping System"))
        
        if options.get('status'):
            self._show_status()
            return
            
        if options.get('test_task'):
            self._run_test_task()
            return
            
        self._setup_automatic_scraping()
    
    def _show_status(self):
        """Show current scraping status"""
        self.stdout.write("📊 Getting scraping status...")
        
        try:
            status = get_scraping_status()
            
            self.stdout.write("\n" + "="*50)
            self.stdout.write("📊 SCRAPING SYSTEM STATUS")
            self.stdout.write("="*50)
            
            # Watermark info
            watermark = status.get('watermark', {})
            self.stdout.write(f"🔍 Watermark Status:")
            self.stdout.write(f"   • Exists: {watermark.get('exists', False)}")
            if watermark.get('last_timestamp'):
                self.stdout.write(f"   • Last Run: {watermark['last_timestamp']}")
            self.stdout.write(f"   • Interval: {watermark.get('interval', 'N/A')} seconds")
            self.stdout.write(f"   • No-change streak: {watermark.get('consecutive_no_changes', 0)}")
            
            # Activity info
            activity = status.get('activity', {})
            self.stdout.write(f"\n📈 Activity:")
            self.stdout.write(f"   • Signals (24h): {activity.get('signals_last_24h', 0)}")
            self.stdout.write(f"   • Total signals: {activity.get('total_signals', 0)}")
            
            # Periodic task info
            task = status.get('periodic_task', {})
            self.stdout.write(f"\n🔄 Periodic Task:")
            self.stdout.write(f"   • Exists: {task.get('exists', False)}")
            self.stdout.write(f"   • Enabled: {task.get('enabled', False)}")
            self.stdout.write(f"   • Interval: {task.get('interval_seconds', 'N/A')} seconds")
            if task.get('last_run_at'):
                self.stdout.write(f"   • Last Run: {task['last_run_at']}")
            
            self.stdout.write("="*50)
            
        except Exception as e:
            self.stderr.write(f"❌ Error getting status: {str(e)}")
    
    def _run_test_task(self):
        """Run a test scraping task"""
        self.stdout.write("🧪 Running test scraping task...")
        
        try:
            # Check if Celery is available
            try:
                from celery import current_app
                celery_available = True
                self.stdout.write("✅ Celery is available")
            except ImportError:
                celery_available = False
                self.stdout.write("⚠️  Celery not available - running synchronously")
            
            if celery_available:
                # Run async
                task = intelligent_delta_scrape_task.delay()
                self.stdout.write(f"🔄 Task queued with ID: {task.id}")
                self.stdout.write("💡 Check Celery worker logs for task execution")
            else:
                # Run sync
                from scrapers.services.fxleaders_scraper import FXLeadersScraper
                scraper = FXLeadersScraper()
                result = scraper.delta_scrape_forex_signals()
                
                if result['success']:
                    self.stdout.write(f"✅ Test completed: {result.get('new_signals', 0)} new signals")
                else:
                    self.stderr.write(f"❌ Test failed: {result.get('error', 'Unknown error')}")
                    
        except Exception as e:
            self.stderr.write(f"❌ Test task failed: {str(e)}")
    
    def _setup_automatic_scraping(self):
        """Setup automatic scraping system"""
        self.stdout.write("\n📅 Setting up periodic tasks...")
        
        try:
            # Setup periodic scraping
            result = setup_periodic_scraping()
            
            if result.get('success'):
                self.stdout.write(f"✅ Periodic tasks configured successfully!")
                self.stdout.write(f"   • Task: {result.get('scraping_task_created')}")
                self.stdout.write(f"   • Interval: {result.get('interval_seconds')} seconds")
            else:
                self.stderr.write(f"❌ Failed to setup periodic tasks: {result.get('error')}")
                return
                
        except Exception as e:
            self.stderr.write(f"❌ Error setting up periodic tasks: {str(e)}")
            return
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write("🎉 AUTOMATIC SCRAPING SYSTEM READY!")
        self.stdout.write("="*60)
        self.stdout.write("📝 Next steps:")
        self.stdout.write("   1. Start Redis server: redis-server")
        self.stdout.write("   2. Start Celery worker: celery -A setup worker --loglevel=info")
        self.stdout.write("   3. Start Celery beat: celery -A setup beat --loglevel=info")
        self.stdout.write("   4. Start Django server: python manage.py runserver")
        self.stdout.write("\n💡 Tips:")
        self.stdout.write("   • Check status: python manage.py start_auto_scraping --status")
        self.stdout.write("   • Test task: python manage.py start_auto_scraping --test-task")
        self.stdout.write("   • Monitor: Check /admin for django-celery-beat periodic tasks")
        self.stdout.write("="*60) 