"""
Celery configuration for TradeBot project.
This file configures Celery for automatic task discovery and periodic scheduling.
"""
import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'setup.settings')

# Create the Celery app
app = Celery('tradebot')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all Django apps
app.autodiscover_tasks()

# Configure periodic tasks
@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """
    Setup periodic tasks automatically when Celery starts
    """
    print("🔄 Setting up periodic tasks...")
    
    # Import here to avoid circular imports
    from scrapers.tasks import intelligent_delta_scrape_task
    
    # Note: We don't call setup_periodic_scraping.delay() here anymore
    # because it causes registration issues. The periodic tasks should
    # already be created in the database via Django management commands
    # or during the first proper Django app startup.
    
    print("✅ Periodic tasks setup complete!")

@app.task(bind=True)
def debug_task(self):
    """Debug task to test Celery is working"""
    print(f'Request: {self.request!r}')
    return 'Celery is working!'

# Configure Celery Beat schedule (fallback if database scheduler fails)
app.conf.beat_schedule = {
    'delta-scrape-fxleaders': {
        'task': 'scrapers.tasks.intelligent_delta_scrape_task',
        'schedule': 120.0,  # Every 120 seconds (2 minutes)
        'options': {
            'queue': 'scraping',
            'routing_key': 'scraping',
        }
    },
    'cleanup-old-signals': {
        'task': 'scrapers.tasks.cleanup_old_signals_task',
        'schedule': 3600.0,  # Every hour
        'options': {
            'queue': 'scraping',
            'routing_key': 'scraping',
        }
    },
}

# Set default queue
app.conf.task_default_queue = 'default'
app.conf.task_default_exchange = 'default'
app.conf.task_default_routing_key = 'default'

print("🚀 Celery configuration loaded successfully!") 