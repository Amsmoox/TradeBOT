// Authentication interfaces
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// API client for TradeBOT backend credential management with JWT authentication
class ApiClient {
  private baseURL = 'http://127.0.0.1:8000';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.loadTokensFromStorage();
  }

  private saveTokensToStorage(tokens: AuthTokens) {
    this.accessToken = tokens.access;
    this.refreshToken = tokens.refresh;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await fetch(`${this.baseURL}/api/auth/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const tokens = await response.json();
    this.saveTokensToStorage(tokens);
    return tokens;
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: this.refreshToken }),
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.accessToken = data.access;
    localStorage.setItem('access_token', data.access);
    return data.access;
  }

  logout() {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Helper method for making authenticated requests
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Prepare headers with authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth header if we have a token
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get a 401 and have a refresh token, try to refresh
    if (response.status === 401 && this.refreshToken) {
      try {
        await this.refreshAccessToken();
        // Retry the request with the new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (refreshError) {
        // Refresh failed, clear tokens and throw error
        this.clearTokens();
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Input Sources (Scrapers) endpoints
  async getInputSources(): Promise<InputSource[]> {
    return this.request<InputSource[]>('/api/input-sources/');
  }

  async createInputSource(data: CreateInputSourceRequest): Promise<InputSource> {
    return this.request<InputSource>('/api/input-sources/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInputSource(id: number, data: Partial<InputSource>): Promise<InputSource> {
    return this.request<InputSource>(`/api/input-sources/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteInputSource(id: number): Promise<void> {
    return this.request<void>(`/api/input-sources/${id}/`, {
      method: 'DELETE',
    });
  }

  async testInputSourceConnection(id: number): Promise<ConnectionTestResult> {
    return this.request<ConnectionTestResult>(`/api/input-sources/${id}/test_connection/`, {
      method: 'POST',
    });
  }

  // Output Destinations (Messaging) endpoints
  async getOutputDestinations(): Promise<OutputDestination[]> {
    return this.request<OutputDestination[]>('/api/messaging/output-destinations/');
  }

  async createOutputDestination(data: CreateOutputDestinationRequest): Promise<OutputDestination> {
    return this.request<OutputDestination>('/api/messaging/output-destinations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOutputDestination(id: number, data: Partial<OutputDestination>): Promise<OutputDestination> {
    return this.request<OutputDestination>(`/api/messaging/output-destinations/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteOutputDestination(id: number): Promise<void> {
    return this.request<void>(`/api/messaging/output-destinations/${id}/`, {
      method: 'DELETE',
    });
  }

  async testOutputDestinationConnection(id: number): Promise<ConnectionTestResult> {
    return this.request<ConnectionTestResult>(`/api/messaging/output-destinations/${id}/test_connection/`, {
      method: 'POST',
    });
  }
}

// Type definitions
export interface InputSource {
  id: number;
  name: string;
  source_type: 'economic_calendar' | 'trading_signals' | 'market_news';
  method: 'api' | 'scraping';
  endpoint_url: string;
  credentials: Record<string, string>;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OutputDestination {
  id: number;
  platform: 'telegram' | 'twitter' | 'discord' | 'whatsapp';
  label: string;
  account_id: string;
  credentials: Record<string, string>;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConnectionTestResult {
  status: 'success' | 'failed' | 'not_supported';
  message: string;
  details?: Record<string, any>;
}

export interface CreateInputSourceRequest {
  name: string;
  source_type: 'economic_calendar' | 'trading_signals' | 'market_news';
  method: 'api' | 'scraping';
  endpoint_url: string;
  credentials: Record<string, string>;
  config?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdateInputSourceRequest extends Partial<CreateInputSourceRequest> {}

export interface CreateOutputDestinationRequest {
  platform: 'telegram' | 'twitter' | 'discord' | 'whatsapp';
  label: string;
  account_id: string;
  credentials: Record<string, string>;
  config?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdateOutputDestinationRequest extends Partial<CreateOutputDestinationRequest> {}

// Export singleton instance
export const apiClient = new ApiClient();

// Legacy content generation interface (keeping for backward compatibility)
export interface ContentGenerationRequest {
  type: 'economic' | 'market' | 'signal' | 'custom';
  data?: any;
  tone?: 'professional' | 'casual' | 'engaging';
  platforms?: string[];
  maxLength?: number;
}

export interface ContentGenerationResponse {
  content: string;
  title: string;
  enhanced: boolean;
}

export const api = {
  // Content generation
  generateContent: async (request: ContentGenerationRequest): Promise<ContentGenerationResponse> => {
    // Mock response based on request type
    const mockResponses = {
      economic: {
        content: "🚨 High Impact Economic Event Alert! 📊 US Non-Farm Payrolls released with strong data showing 275K jobs added vs 250K expected. This indicates robust economic growth and may influence Fed policy decisions. #NFP #USD #Economics",
        title: "US Non-Farm Payrolls Beat Expectations",
        enhanced: true
      },
      market: {
        content: "📈 Market Update: EUR/USD showing bearish momentum as ECB maintains dovish stance. Key resistance at 1.0450 holding firm. Watch for break below 1.0400 for further downside. #EURUSD #MarketAnalysis",
        title: "EUR/USD Technical Analysis Update",
        enhanced: true
      },
      signal: {
        content: "🎯 Trading Signal Alert!\n📈 GBP/USD BUY\n💰 Entry: 1.2450\n🎯 Target: 1.2520\n🛡️ Stop: 1.2400\nR/R: 1:1.4\n\n#GBPUSD #TradingSignal",
        title: "GBP/USD Buy Signal",
        enhanced: false
      },
      custom: {
        content: "📝 Custom content generated with AI enhancement. Professional tone applied with market-relevant hashtags and emojis for maximum engagement. #Trading #Forex",
        title: "Custom Generated Content",
        enhanced: true
      }
    };
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI processing time
    return mockResponses[request.type] || mockResponses.custom;
  },

  enhanceContent: async (content: string, enhancement: 'grammar' | 'engaging' | 'emojis' | 'professional'): Promise<{ enhanced_content: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const enhancements = {
      grammar: content.replace(/\b\w/g, l => l.toUpperCase()), // Simple capitalization
      engaging: `🔥 ${content} Don't miss out! #Trading #Opportunity`,
      emojis: `📊 ${content} 💪 #Success`,
      professional: `Analysis: ${content} Please consult your financial advisor before making investment decisions.`
    };
    
    return { enhanced_content: enhancements[enhancement] || content };
  },

  generateMarketSummary: async (): Promise<ContentGenerationResponse> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      content: "📊 Daily Market Summary\n\n💵 USD strengthening on solid economic data\n📈 European markets showing mixed signals\n🛢️ Oil prices stable amid geopolitical tensions\n📉 Tech stocks under pressure\n\nKey levels to watch:\n• EUR/USD: 1.0400 support\n• GBP/USD: 1.2450 resistance\n• USD/JPY: 150.00 psychological level\n\n#MarketSummary #Trading #Forex",
      title: "Daily Market Summary - " + new Date().toLocaleDateString(),
      enhanced: true
    };
  },

  // Content posts
  createContentPost: async (post: any) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, id: Date.now(), message: 'Content post created successfully' };
  },

  updatePlatformConfig: async (platform: string, updates: any) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true, message: `${platform} configuration updated` };
  },

  updateScheduleConfig: async (type: string, updates: any) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true, message: `${type} schedule configuration updated` };
  },

  postContent: async (postId: number, platforms: string[]) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { 
      success: true, 
      message: `Content posted to ${platforms.join(', ')}`, 
      results: platforms.map(p => ({ platform: p, status: 'success', posted_at: new Date() }))
    };
  },
};
