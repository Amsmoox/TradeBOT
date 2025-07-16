import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Mock data for development
const mockData: Record<string, any> = {
  '/api/data-sources': [
    {
      id: 'source_1',
      name: 'ForexFactory Economic Calendar',
      type: 'economic',
      url: 'https://www.forexfactory.com/calendar',
      status: 'active',
      lastUpdated: new Date('2025-01-15T10:30:00Z'),
      scrapingConfig: {
        method: 'scraping',
        rate_limit: 60,
        retry_attempts: 3
      }
    },
    {
      id: 'source_2',
      name: 'Reuters Market News',
      type: 'market',
      url: 'https://feeds.reuters.com/news/markets',
      status: 'active',
      lastUpdated: new Date('2025-01-15T11:15:00Z'),
      scrapingConfig: {
        method: 'api',
        rate_limit: 100,
        retry_attempts: 2
      }
    },
    {
      id: 'source_3',
      name: 'FXLeaders Trading Signals',
      type: 'trading',
      url: 'https://www.fxleaders.com/live-forex-signals',
      status: 'active',
      lastUpdated: new Date('2025-01-15T11:45:00Z'),
      scrapingConfig: {
        method: 'scraping',
        rate_limit: 30,
        retry_attempts: 3
      }
    }
  ],
  '/api/platform-accounts': [
    {
      id: 'account_1',
      platform: 'telegram',
      accountName: '@trading_signals_bot',
      displayName: 'Trading Signals Channel',
      status: 'active',
      rateLimits: {
        posts_per_hour: 10,
        posts_per_day: 100,
        character_limit: 4096
      },
      lastUsed: new Date('2025-01-15T09:30:00Z'),
      credentials: { bot_token: '***', chat_id: '-1001234567890' }
    },
    {
      id: 'account_2',
      platform: 'twitter',
      accountName: '@forex_analysis',
      displayName: 'Forex Analysis Twitter',
      status: 'active',
      rateLimits: {
        posts_per_hour: 5,
        posts_per_day: 50,
        character_limit: 280
      },
      lastUsed: new Date('2025-01-15T08:15:00Z'),
      credentials: { api_key: '***', api_secret: '***' }
    },
    {
      id: 'account_3',
      platform: 'discord',
      accountName: 'Trading Community',
      displayName: 'Discord Trading Server',
      status: 'active',
      rateLimits: {
        posts_per_hour: 20,
        posts_per_day: 200,
        character_limit: 2000
      },
      lastUsed: new Date('2025-01-15T10:00:00Z'),
      credentials: { webhook_url: 'https://discord.com/api/webhooks/***' }
    }
  ],
  '/api/posting-rules': [
    {
      id: 'rule_1',
      moduleType: 'economic',
      name: 'High Impact USD Events',
      triggerConditions: {
        impact_levels: ['HIGH'],
        currencies: ['USD'],
        time_conditions: {
          advance_notice: 30,
          result_delay: 15
        }
      },
      targetAccounts: [
        {
          platform_account_id: 'account_1',
          content_format: {
            template_type: 'preview',
            format_style: 'detailed',
            include_elements: {
              emojis: true,
              hashtags: true,
              charts: false,
              links: true
            }
          },
          enabled: true
        }
      ],
      enabled: true
    }
  ],
  '/api/economic-events/today': [
    {
      id: 1,
      title: 'Non-Farm Payrolls',
      country: 'United States',
      impact: 'HIGH',
      currency: 'USD',
      expected: '250K',
      previous: '227K',
      actual: '275K',
      time: new Date('2025-01-15T13:30:00Z'),
      processed: true
    },
    {
      id: 2,
      title: 'ECB Interest Rate Decision',
      country: 'European Union',
      impact: 'HIGH',
      currency: 'EUR',
      expected: '4.25%',
      previous: '4.00%',
      actual: null,
      time: new Date('2025-01-15T16:00:00Z'),
      processed: false
    },
    {
      id: 3,
      title: 'UK GDP Growth Rate',
      country: 'United Kingdom',
      impact: 'MEDIUM',
      currency: 'GBP',
      expected: '0.2%',
      previous: '0.1%',
      actual: '0.3%',
      time: new Date('2025-01-15T09:30:00Z'),
      processed: true
    }
  ],
  '/api/economic-config': {
    enabled: true,
    sourceConfig: {
      selected_sources: ['source_1'],
      scraping_schedule: {
        frequency: 'every_5_minutes',
        active_hours: { start: '08:00', end: '18:00', timezone: 'UTC' }
      }
    },
    treatmentConfig: {
      filters: {
        currencies: ['USD', 'EUR'],
        impact_levels: ['HIGH'],
        countries: ['US', 'EU'],
        event_types: [],
        time_range: {
          hours_ahead: 2,
          hours_after: 1
        }
      },
      content_generation: {
        ai_enhancement: true,
        include_analysis: true,
        add_market_context: true
      }
    }
  },
  '/api/content-posts': [
    {
      id: 1,
      type: 'economic',
      title: 'USD Non-Farm Payrolls Release',
      content: '🚨 NFP Alert: US Non-Farm Payrolls came in at 275K vs 250K expected! Strong job growth continues to support USD strength. #USD #NFP #Economics',
      originalContent: 'Non-Farm Payrolls: 275K vs 250K expected',
      aiEnhanced: true,
      platforms: ['telegram', 'twitter'],
      status: 'posted',
      scheduledAt: null,
      createdAt: new Date('2025-01-15T13:35:00Z'),
      postedAt: new Date('2025-01-15T13:36:00Z')
    },
    {
      id: 2,
      type: 'market',
      title: 'EUR/USD Technical Analysis',
      content: '📊 EUR/USD showing bearish momentum below 1.0450 resistance. Watch for break below 1.0400 support for continuation. #EURUSD #TechnicalAnalysis',
      originalContent: 'EUR/USD technical setup bearish',
      aiEnhanced: true,
      platforms: ['telegram'],
      status: 'scheduled',
      scheduledAt: new Date('2025-01-15T15:00:00Z'),
      createdAt: new Date('2025-01-15T12:30:00Z')
    },
    {
      id: 3,
      type: 'signal',
      title: 'GBP/USD Buy Signal',
      content: '🎯 GBP/USD Buy Signal\n📈 Entry: 1.2450\n🎯 TP: 1.2520\n🛡️ SL: 1.2400\nRisk/Reward: 1:1.4',
      originalContent: 'GBP/USD buy setup identified',
      aiEnhanced: false,
      platforms: ['telegram', 'discord'],
      status: 'draft',
      scheduledAt: null,
      createdAt: new Date('2025-01-15T11:20:00Z')
    }
  ],
  '/api/platform-configs': [
    {
      platform: 'telegram',
      config: {
        name: 'Telegram',
        enabled: true,
        credentials: { bot_token: '***', chat_id: '***' },
        rateLimits: { posts_per_hour: 10, character_limit: 4096 }
      }
    },
    {
      platform: 'twitter',
      config: {
        name: 'Twitter/X',
        enabled: true,
        credentials: { api_key: '***', api_secret: '***' },
        rateLimits: { posts_per_hour: 5, character_limit: 280 }
      }
    }
  ],
  '/api/stats': {
    posts_today: 15,
    engagement_rate: 8.5,
    active_sources: 3,
    pending_posts: 7
  }
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: RequestInit
): Promise<any> {
  // For development, return mock data
  if (url.startsWith('/api/')) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    
    // Handle different HTTP methods
    const method = options?.method || 'GET';
    
    if (method === 'GET') {
      // Handle query parameters for filtered requests
      const baseUrl = url.split('?')[0];
      if (mockData[baseUrl]) {
        return mockData[baseUrl];
      }
      if (mockData[url]) {
        return mockData[url];
      }
    }
    
    if (method === 'POST' || method === 'PUT') {
      // Simulate successful mutation
      return { success: true, message: 'Operation completed successfully' };
    }
    
    if (method === 'DELETE') {
      // Simulate successful deletion
      return { success: true, message: 'Item deleted successfully' };
    }
    
    // Default response for unhandled endpoints
    return { message: 'Mock endpoint response' };
  }

  // For non-API requests, use actual fetch
  const res = await fetch(url, {
    headers: options?.body ? { "Content-Type": "application/json" } : {},
    credentials: "include",
    ...options,
  });

  await throwIfResNotOk(res);
  return res;
}

// Legacy function for backward compatibility
export async function apiRequest_old(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Use mock data for API endpoints
    if (url.startsWith('/api/')) {
      return apiRequest(url);
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
