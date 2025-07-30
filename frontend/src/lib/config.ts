// Configuration for API endpoints and environment settings
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    endpoints: {
      forexSignals: '/api/forex-signals/',
      latestSignals: '/api/forex-signals/latest/',
      triggerScrape: '/api/forex-signals/trigger_delta_scrape/',
      scrapingStatus: '/api/forex-signals/scraping_status/',
      watermarkInfo: '/api/watermark-info/',
      deltaScrape: '/api/delta-scrape/',
    }
  },
  
  // App Configuration
  app: {
    name: 'TradeBOT',
    version: '1.0.0',
    refreshInterval: 60000, // 1 minute
    staleTime: 30000, // 30 seconds
  },
  
  // Development Configuration
  dev: {
    mockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    debugMode: import.meta.env.DEV,
  }
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${config.api.baseUrl}${endpoint}`;
}; 