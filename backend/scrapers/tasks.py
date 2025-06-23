"""
Celery tasks for intelligent forex signal scraping with automatic scheduling.
"""
import logging
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django_celery_beat.models import PeriodicTask, IntervalSchedule
import json
import os

# Load environment variables first
from dotenv import load_dotenv
load_dotenv()

# Import our models and services
from .models import ScrapedData, ScrapingWatermark
from .services.fxleaders_scraper import FXLeadersScraper

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, name='scrapers.tasks.intelligent_delta_scrape_task')
def intelligent_delta_scrape_task(self):
    """
    Main periodic task for intelligent delta-scraping of FX Leaders signals.
    This runs automatically and adjusts its own interval based on activity.
    """
    # Handle both Celery execution and manual execution
    task_id = 'manual'
    if hasattr(self, 'request') and self.request and hasattr(self.request, 'id') and self.request.id:
        task_id = self.request.id[:8]
    
    print(f"\n🚀 [Task {task_id}] ========== STARTING INTELLIGENT DELTA-SCRAPE ==========")
    print(f"🕒 [Task {task_id}] Timestamp: {timezone.now()}")
    print(f"🔧 [Task {task_id}] Python PID: {os.getpid()}")
    print(f"📍 [Task {task_id}] Worker info: {self.request.hostname if hasattr(self, 'request') and self.request else 'Unknown'}")
    
    try:
        # Initialize scraper and run delta-scrape
        print(f"🔧 [Task {task_id}] Initializing FXLeaders scraper...")
        scraper = FXLeadersScraper()
        print(f"🔧 [Task {task_id}] Scraper initialized successfully")
        
        print(f"🌐 [Task {task_id}] Starting delta-scrape of FX Leaders...")
        print(f"🔧 [Task {task_id}] Target URL: {scraper.signals_url}")
        result = scraper.delta_scrape_forex_signals()
        print(f"🔧 [Task {task_id}] Delta-scrape method completed, processing results...")
        
        # Log results
        if result['success']:
            print(f"✅ [Task {task_id}] Delta-scrape completed successfully!")
            print(f"   📊 New signals: {result.get('new_signals', 0)}")
            print(f"   🔄 Duplicates skipped: {result.get('duplicates_skipped', 0)}")
            print(f"   📝 Message: {result.get('message', 'No message')}")
            
            # Auto-adjust task interval based on activity
            print(f"⚙️  [Task {task_id}] Adjusting scraping interval based on activity...")
            adjust_scraping_interval(result.get('new_signals', 0))
            
            # Send new signals to Telegram if any
            if result.get('new_signals', 0) > 0:
                print(f"📨 [Task {task_id}] Sending {result['new_signals']} signals to Telegram...")
                try:
                    telegram_result = send_new_signals_to_telegram(result['new_signals'])
                    result['telegram_sent'] = telegram_result
                    print(f"📨 [Task {task_id}] Telegram result: {telegram_result}")
                except Exception as e:
                    print(f"⚠️  [Task {task_id}] Telegram sending failed: {str(e)}")
                    result['telegram_error'] = str(e)
            else:
                print(f"📨 [Task {task_id}] No new signals to send to Telegram")
        else:
            print(f"❌ [Task {task_id}] Delta-scrape failed: {result.get('error', 'Unknown error')}")
        
        print(f"🏁 [Task {task_id}] ========== TASK COMPLETED ==========\n")
        return result
        
    except Exception as e:
        error_msg = f"Task failed: {str(e)}"
        print(f"❌ [Task {task_id}] {error_msg}")
        print(f"🔍 [Task {task_id}] Exception details: {repr(e)}")
        print(f"🔍 [Task {task_id}] Exception type: {type(e).__name__}")
        
        # Retry with exponential backoff only if we have request context
        if hasattr(self, 'request') and self.request and self.request.retries < self.max_retries:
            countdown = 2 ** self.request.retries * 60  # 1min, 2min, 4min
            print(f"🔄 [Task {task_id}] Retrying in {countdown} seconds...")
            raise self.retry(countdown=countdown, exc=e)
        
        print(f"🏁 [Task {task_id}] ========== TASK FAILED ==========\n")
        return {
            'success': False,
            'error': error_msg,
            'retries_exhausted': True
        }

@shared_task(name='scrapers.tasks.setup_periodic_scraping')
def setup_periodic_scraping():
    """
    Setup or update periodic scraping tasks in the database.
    This runs once when Celery starts to ensure tasks are configured.
    """
    print("📅 Setting up periodic scraping tasks...")
    
    try:
        # Get or create interval schedule (120 seconds default)
        interval, created = IntervalSchedule.objects.get_or_create(
            every=settings.DEFAULT_SCRAPING_INTERVAL,
            period=IntervalSchedule.SECONDS
        )
        
        if created:
            print(f"📅 Created new interval schedule: every {settings.DEFAULT_SCRAPING_INTERVAL} seconds")
        
        # Get or create periodic task for delta-scraping
        task_name = "Auto FX Leaders Delta-Scrape"
        task, created = PeriodicTask.objects.get_or_create(
            name=task_name,
            defaults={
                'task': 'scrapers.tasks.intelligent_delta_scrape_task',
                'interval': interval,
                'enabled': True,
                'description': 'Automatic intelligent delta-scraping of FX Leaders signals',
                'kwargs': json.dumps({}),
                'queue': 'scraping'
            }
        )
        
        if created:
            print(f"✅ Created periodic task: {task_name}")
        else:
            print(f"🔄 Found existing periodic task: {task_name}")
            # Update interval if changed
            if task.interval != interval:
                task.interval = interval
                task.save()
                print(f"🔄 Updated task interval to {settings.DEFAULT_SCRAPING_INTERVAL} seconds")
        
        # Setup cleanup task (runs every hour)
        cleanup_interval, created = IntervalSchedule.objects.get_or_create(
            every=1,
            period=IntervalSchedule.HOURS
        )
        
        cleanup_task, created = PeriodicTask.objects.get_or_create(
            name="Cleanup Old Signals",
            defaults={
                'task': 'scrapers.tasks.cleanup_old_signals_task',
                'interval': cleanup_interval,
                'enabled': True,
                'description': 'Clean up old forex signals (older than 7 days)',
                'kwargs': json.dumps({'days_to_keep': 7}),
                'queue': 'scraping'
            }
        )
        
        if created:
            print("✅ Created cleanup task for old signals")
        
        print("📅 Periodic task setup completed successfully!")
        return {
            'success': True,
            'scraping_task_created': task_name,
            'interval_seconds': settings.DEFAULT_SCRAPING_INTERVAL
        }
        
    except Exception as e:
        error_msg = f"Failed to setup periodic tasks: {str(e)}"
        print(f"❌ {error_msg}")
        logger.error(error_msg)
        return {
            'success': False,
            'error': error_msg
        }

@shared_task(name='scrapers.tasks.cleanup_old_signals_task')
def cleanup_old_signals_task(days_to_keep=7):
    """
    Clean up old forex signals to prevent database bloat.
    Keeps signals from the last N days (default: 7 days).
    """
    print(f"🧹 Starting cleanup of signals older than {days_to_keep} days...")
    
    try:
        cutoff_date = timezone.now() - timedelta(days=days_to_keep)
        
        # Count signals to be deleted
        old_signals_count = ScrapedData.objects.filter(
            scrape_date__lt=cutoff_date
        ).count()
        
        if old_signals_count == 0:
            print("✅ No old signals to clean up")
            return {
                'success': True,
                'deleted_count': 0,
                'message': 'No old signals found'
            }
        
        # Delete old signals
        deleted_count, _ = ScrapedData.objects.filter(
            scrape_date__lt=cutoff_date
        ).delete()
        
        print(f"✅ Cleaned up {deleted_count} old signals (older than {days_to_keep} days)")
        
        return {
            'success': True,
            'deleted_count': deleted_count,
            'cutoff_date': cutoff_date.isoformat(),
            'days_kept': days_to_keep
        }
        
    except Exception as e:
        error_msg = f"Cleanup task failed: {str(e)}"
        print(f"❌ {error_msg}")
        logger.error(error_msg)
        return {
            'success': False,
            'error': error_msg,
            'deleted_count': 0
        }

def adjust_scraping_interval(new_signals_count):
    """
    Dynamically adjust the scraping interval based on activity.
    More activity = shorter intervals, less activity = longer intervals.
    """
    try:
        # Get the current periodic task
        task = PeriodicTask.objects.filter(
            name="Auto FX Leaders Delta-Scrape"
        ).first()
        
        if not task:
            print("⚠️  Could not find periodic task to adjust interval")
            return
        
        current_interval = task.interval.every
        
        if new_signals_count > 0:
            # Activity detected - decrease interval (min 30 seconds)
            new_interval = max(30, current_interval - 15)
            action = "decreased"
        else:
            # No activity - increase interval (max 300 seconds = 5 minutes)
            watermark = ScrapingWatermark.objects.filter(source='fxleaders').first()
            if watermark and watermark.consecutive_no_changes > 3:
                new_interval = min(300, current_interval + 30)
                action = "increased"
            else:
                new_interval = current_interval
                action = "unchanged"
        
        if new_interval != current_interval:
            # Create or update interval schedule
            interval, created = IntervalSchedule.objects.get_or_create(
                every=new_interval,
                period=IntervalSchedule.SECONDS
            )
            
            task.interval = interval
            task.save()
            
            print(f"📈 Scraping interval {action}: {current_interval}s → {new_interval}s")
        else:
            print(f"📊 Scraping interval unchanged: {current_interval}s")
            
    except Exception as e:
        print(f"⚠️  Failed to adjust scraping interval: {str(e)}")

def send_new_signals_to_telegram(new_signals_count):
    """
    Send the latest new signals to Telegram.
    """
    try:
        # Import here to avoid circular imports
        from messaging.services.telegram_bot import TelegramBot
        
        # Get the most recent signals
        latest_signals = ScrapedData.objects.filter(
            status='success',
            is_processed=True
        ).order_by('-scrape_date')[:new_signals_count]
        
        if not latest_signals:
            return {'status': 'no_signals', 'count': 0}
        
        bot = TelegramBot()
        sent_count = 0
        
        for signal in latest_signals:
            # Format message for Telegram
            signal_emoji = "🔴" if signal.action.lower() == "sell" else "🟢"
            status_emoji = "⚡" if signal.status_signal.lower() == "active" else "⏳"
            
            msg = (
                f"{signal_emoji} {status_emoji} <b>{signal.instrument}</b>\n"
                f"<b>Action:</b> {signal.action}\n"
            )
            
            if signal.entry_price:
                msg += f"<b>Entry:</b> {signal.entry_price}\n"
            if signal.stop_loss:
                msg += f"<b>Stop Loss:</b> {signal.stop_loss}\n"
            if signal.take_profit:
                msg += f"<b>Take Profit:</b> {signal.take_profit}\n"
            if signal.status_signal:
                msg += f"<b>Status:</b> {signal.status_signal}\n"
                
            msg += f"\n<i>🕐 {signal.scrape_date.strftime('%H:%M')} | 🤖 Auto Delta-Scrape</i>"
            
            result = bot.send_message(msg)
            if result.get('success'):
                sent_count += 1
        
        return {
            'status': 'success',
            'sent_count': sent_count,
            'total_signals': len(latest_signals)
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'sent_count': 0
        }

@shared_task(name='scrapers.tasks.get_scraping_status')
def get_scraping_status():
    """
    Get current scraping status and statistics.
    Useful for monitoring and debugging.
    """
    try:
        # Get watermark info
        watermark = ScrapingWatermark.objects.filter(source='fxleaders').first()
        
        # Get recent activity
        last_24h = timezone.now() - timedelta(hours=24)
        recent_signals = ScrapedData.objects.filter(
            scrape_date__gte=last_24h
        ).count()
        
        # Get periodic task info
        task = PeriodicTask.objects.filter(
            name="Auto FX Leaders Delta-Scrape"
        ).first()
        
        status = {
            'timestamp': timezone.now().isoformat(),
            'watermark': {
                'exists': watermark is not None,
                'last_timestamp': watermark.last_timestamp.isoformat() if watermark and watermark.last_timestamp else None,
                'interval': watermark.scrape_interval if watermark else None,
                'consecutive_no_changes': watermark.consecutive_no_changes if watermark else 0,
            },
            'activity': {
                'signals_last_24h': recent_signals,
                'total_signals': ScrapedData.objects.count(),
            },
            'periodic_task': {
                'exists': task is not None,
                'enabled': task.enabled if task else False,
                'interval_seconds': task.interval.every if task else None,
                'last_run_at': task.last_run_at.isoformat() if task and task.last_run_at else None,
            }
        }
        
        print(f"📊 Scraping Status: {json.dumps(status, indent=2)}")
        return status
        
    except Exception as e:
        error_msg = f"Failed to get scraping status: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            'error': error_msg,
            'timestamp': timezone.now().isoformat()
        }

@shared_task(name='scrapers.tasks.test_task')
def test_task():
    """Simple test task to verify Celery worker is functioning"""
    print("🧪 TEST TASK EXECUTED SUCCESSFULLY!")
    return "Test task completed" 