#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import subprocess
import signal
import atexit
from threading import Thread
import time


def run_celery_worker():
    """Run Celery worker in background"""
    try:
        print("🚀 Starting Celery worker...")
        worker_process = subprocess.Popen([
            sys.executable, '-m', 'celery', '-A', 'setup', 'worker',
            '--loglevel=info', '--concurrency=2', '--queues=scraping,default'
        ], env=dict(os.environ, DJANGO_SETTINGS_MODULE='setup.settings'))
        return worker_process
    except Exception as e:
        print(f"❌ Failed to start Celery worker: {e}")
        return None


def run_celery_beat():
    """Run Celery beat scheduler in background"""
    try:
        print("📅 Starting Celery beat scheduler...")
        beat_process = subprocess.Popen([
            sys.executable, '-m', 'celery', '-A', 'setup', 'beat',
            '--loglevel=info', '--scheduler=django_celery_beat.schedulers:DatabaseScheduler'
        ], env=dict(os.environ, DJANGO_SETTINGS_MODULE='setup.settings'))
        return beat_process
    except Exception as e:
        print(f"❌ Failed to start Celery beat: {e}")
        return None


def cleanup_processes(*processes):
    """Clean up Celery processes on exit"""
    print("\n🛑 Shutting down Celery processes...")
    for process in processes:
        if process and process.poll() is None:
            try:
                process.terminate()
                process.wait(timeout=5)
            except:
                try:
                    process.kill()
                except:
                    pass


def start_celery_services():
    """Start Celery worker and beat services"""
    worker_process = run_celery_worker()
    time.sleep(2)  # Give worker time to start
    beat_process = run_celery_beat()
    
    # Register cleanup function
    if worker_process or beat_process:
        atexit.register(cleanup_processes, worker_process, beat_process)
        
        # Handle Ctrl+C gracefully
        def signal_handler(sig, frame):
            cleanup_processes(worker_process, beat_process)
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    return worker_process, beat_process


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'setup.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Check if we're running the development server
    if len(sys.argv) >= 2 and sys.argv[1] == 'runserver':
        print("🌟 Starting Django development server with integrated Celery...")
        
        # Start Celery services in background
        worker_process, beat_process = start_celery_services()
        
        if worker_process:
            print("✅ Celery worker started successfully")
        if beat_process:
            print("✅ Celery beat scheduler started successfully")
        
        print("🌐 Starting Django development server...")
        print("=" * 60)
        print("🎯 All services running! Your scraping tasks will run automatically.")
        print("📊 Check the logs above for scraping activity.")
        print("🛑 Press Ctrl+C to stop all services.")
        print("=" * 60)
    
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
