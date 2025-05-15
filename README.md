# TradeBot Project Structure

This document outlines the structure of the TradeBot project, detailing the purpose of each file and directory.

## Overview

TradeBot is a Django-based application designed to scrape forex trading signals from websites like FX Leaders and expose them through an API that can be connected to a Telegram bot.

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
    └── scrapers/           # Django app for scraping forex signals
        ├── __init__.py     # Python package marker
        ├── admin.py        # Django admin site configuration
        ├── api.py          # REST API viewsets and logic
        ├── apps.py         # Django app configuration
        ├── models.py       # Database models for scraped data
        ├── serializers.py  # DRF serializers for API data
        ├── tests.py        # Testing module
        ├── urls.py         # URL routing for the scrapers app
        ├── views.py        # Django views (mostly empty, API uses api.py)
        ├── migrations/     # Database migrations
        ├── services/       # Service modules for business logic
        │   ├── __init__.py  # Python package marker
        │   ├── base_scraper.py  # Base scraper class with core functionality
        │   └── fxleaders_scraper.py  # FX Leaders specific scraper implementation
        └── management/     # Custom Django management commands
            ├── __init__.py
            └── commands/   # Custom management commands directory
                ├── __init__.py
                └── scrape_fxleaders.py  # Command to scrape FX Leaders website
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

## Scraping Workflow

1. The `scrape_fxleaders.py` command initializes the `FXLeadersScraper` class
2. The scraper authenticates to FX Leaders using Selenium
3. It navigates to the signals page and waits for dynamic content to load
4. The scraper extracts signal data including instrument name, action, prices, and status
5. Extracted data is formatted for easy reading
6. If not in print-only mode, signals are saved to the database using the `ScrapedData` model
7. The API can then serve these signals to external clients (like a Telegram bot)

## Usage

The backend is designed to:
1. Scrape forex trading signals using the custom management command
2. Store the signals in the database
3. Expose the data through the REST API
4. Allow a Telegram bot to connect to the API endpoints to deliver signals to users

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

## Development

The project uses:
- Django for the backend
- Django REST Framework for the API
- PostgreSQL as the database (configured in settings.py)
- Selenium and BeautifulSoup for web scraping
- Custom management commands for scheduled tasks