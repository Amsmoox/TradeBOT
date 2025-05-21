# TradeBot Project Structure

This document outlines the structure of the TradeBot project, detailing the purpose of each file and directory.

## Overview

TradeBot is a Django-based application designed to scrape forex trading signals from websites like FX Leaders and expose them through an API that can be connected to a Telegram bot. The system automatically sends scraped signals to users via Telegram.

## Project Structure

```
TradeBOT/
├── .env                    # Environment variables for Django settings
├── .gitignore              # Git ignore file
├── frontend/               # Frontend application (not implemented yet)
├── requirements.txt        # Python dependencies
└── backend/                # Django backend application
    ├── manage.py           # Django CLI for project management
    ├── logs/               # Application logs directory
    ├── setup/              # Main Django project configuration
    │   ├── __init__.py     # Python package marker
    │   ├── asgi.py         # ASGI configuration for async servers
    │   ├── settings.py     # Django project settings
    │   ├── urls.py         # Main URL routing configuration
    │   └── wsgi.py         # WSGI configuration for web servers
    ├── scrapers/           # Django app for scraping forex signals
    │   ├── __init__.py     # Python package marker
    │   ├── admin.py        # Django admin site configuration
    │   ├── api.py          # REST API viewsets and logic
    │   ├── apps.py         # Django app configuration
    │   ├── models.py       # Database models for scraped data
    │   ├── serializers.py  # DRF serializers for API data
    │   ├── tests.py        # Testing module
    │   ├── urls.py         # URL routing for the scrapers app
    │   ├── views.py        # Django views (mostly empty, API uses api.py)
    │   ├── migrations/     # Database migrations
    │   ├── services/       # Service modules for business logic
    │   │   ├── __init__.py  # Python package marker
    │   │   ├── base_scraper.py  # Base scraper class with core functionality
    │   │   └── fxleaders_scraper.py  # FX Leaders specific scraper implementation
    │   └── management/     # Custom Django management commands
    │       ├── __init__.py
    │       └── commands/   # Custom management commands directory
    │           ├── __init__.py
    │           └── scrape_fxleaders.py  # Command to scrape FX Leaders website
    └── messaging/          # Django app for sending signals to messaging platforms
        ├── __init__.py     # Python package marker
        ├── admin.py        # Django admin site configuration
        ├── apps.py         # Django app configuration
        ├── models.py       # Database models (minimal, using scrapers models)
        ├── serializers.py  # Serializers for signal messages
        ├── tests.py        # Testing module
        ├── urls.py         # URL routing for messaging endpoints
        ├── views.py        # Views for message delivery endpoints
        ├── README.md       # Documentation for the messaging app
        ├── migrations/     # Database migrations
        └── services/       # Messaging service modules
            └── telegram_bot.py  # Telegram bot messaging service
```

## Key Components

### Backend Configuration

- **setup/settings.py**: Contains Django settings including database configuration, installed apps, middleware, and REST framework settings.
- **setup/urls.py**: Main URL router that includes the scrapers app URLs.

### Scrapers App

- **models.py**: Defines the `ScrapedData` model that stores forex signals with fields like instrument, action, entry price, etc.
- **admin.py**: Configures the Django admin interface for managing scraped data.
- **api.py**: Implements the REST API viewsets using Django REST Framework.
  - `ForexSignalViewSet`: Provides endpoints for listing forex signals and special actions like `latest` and `by_instrument`.
- **serializers.py**: Defines how model data is converted to JSON for the API.
- **urls.py**: Maps API URLs to viewsets.

### Messaging App

- **views.py**: Contains view functions for messaging endpoints:
  - `send_telegram_alert`: Handles manual alert sending to Telegram
  - `fetch_and_send_signals`: Fetches the latest forex signals from the database and sends them to Telegram
- **services/telegram_bot.py**: Implementation of the Telegram bot service for sending messages:
  - Handles authentication with the Telegram API
  - Formats and sends messages to configured chat IDs
  - Handles error reporting and logging
- **urls.py**: Maps messaging endpoints to the appropriate views:
  - `/api/telegram/send-alert/`: Endpoint for manual alert sending
  - `/api/telegram/send-signals/`: Endpoint to trigger sending the latest signals

### Scraper Services

- **services/base_scraper.py**: Abstract base class that provides core functionality for all scrapers:
  - HTTP session management with `requests` library
  - Basic page fetching with error handling
  - Method to save scraped data to the database
  - Logging capabilities

- **services/fxleaders_scraper.py**: Specialized scraper for FX Leaders forex signals:
  - Extends `BaseScraper` with site-specific functionality
  - Implements Selenium-based authentication to access premium content
  - Uses optimized methods to extract forex signals from HTML
  - Handles dynamic page content with wait conditions
  - Formats extracted data for storage and display
  - Contains error handling and fallback mechanisms

### Management Commands

- **management/commands/scrape_fxleaders.py**: Django management command that can be run via `python manage.py scrape_fxleaders`:
  - Provides a CLI interface to the FX Leaders scraper
  - Takes optional flags like `--print-only` to display without saving
  - Includes `--debug` mode for detailed troubleshooting
  - Offers `--timing` flag to measure performance
  - Handles the workflow of scraping, displaying, and saving signals
  - Provides colored console output for better readability
  - Contains comprehensive error handling

### API Endpoints

The API provides the following endpoints:

- `GET /api/forex-signals/`: List all forex signals
- `GET /api/forex-signals/<id>/`: Get details of a specific signal
- `GET /api/forex-signals/latest/`: Get the 5 most recent signals
- `GET /api/forex-signals/by_instrument/?name=<instrument>`: Filter signals by instrument name (e.g., EURUSD)

### Messaging Endpoints

- `POST /api/telegram/send-alert/`: Send a manual alert to the Telegram channel
- `GET /api/telegram/send-signals/`: Fetch the latest forex signals and send them to the Telegram channel

## Complete Workflow

1. The `scrape_fxleaders.py` command scrapes forex signals from FX Leaders website
2. Scraped signals are stored in the database using the `ScrapedData` model
3. The REST API exposes these signals through its endpoints
4. The messaging app fetches the latest signals directly from the database
5. Signals are formatted with Telegram-compatible HTML markup
6. The TelegramBot service sends these signals to the configured Telegram channel/group
7. Users receive real-time forex signals with entry prices, stop-loss, and take-profit levels

## Usage

### Running the Scraper

```bash
# Basic usage
python manage.py scrape_fxleaders

# Print signals without saving to database
python manage.py scrape_fxleaders --print-only

# Show debug information
python manage.py scrape_fxleaders --debug

# Measure performance
python manage.py scrape_fxleaders --timing
```

### Sending Signals to Telegram

After scraping signals, you can send them to Telegram using:

```bash
# Using curl to call the API endpoint
curl -X GET http://localhost:8000/api/telegram/send-signals/

# Or schedule it with cron for automated delivery
# Example cron entry (runs every hour)
# 0 * * * * curl -X GET http://your-server.com/api/telegram/send-signals/
```

## Required Environment Variables

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from BotFather
- `TELEGRAM_CHAT_ID`: The chat ID where signals should be sent
- `FXLEADERS_USERNAME`: Username for FX Leaders (if using premium features)
- `FXLEADERS_PASSWORD`: Password for FX Leaders (if using premium features)
- `FXLEADERS_LOGIN_URL`: Login URL for FX Leaders
- `FXLEADERS_SIGNALS_URL`: URL for the forex signals page

## Development

The project uses:
- Django for the backend
- Django REST Framework for the API
- PostgreSQL as the database (configured in settings.py)
- Selenium and BeautifulSoup for web scraping
- Telegram Bot API for signal delivery
- Custom management commands for scheduled tasks