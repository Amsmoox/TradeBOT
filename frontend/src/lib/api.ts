import { apiRequest } from "./queryClient";
import { buildApiUrl } from './config';

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

  // Forex Signals API
  getForexSignals: async (): Promise<any[]> => {
    try {
      const response = await fetch(buildApiUrl('/api/forex-signals/'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching forex signals:', error);
      throw error;
    }
  },

  getLatestForexSignals: async (): Promise<any[]> => {
    try {
      const response = await fetch(buildApiUrl('/api/forex-signals/latest/'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching latest forex signals:', error);
      throw error;
    }
  },

  triggerDeltaScrape: async (): Promise<any> => {
    try {
      const response = await fetch(buildApiUrl('/api/forex-signals/trigger_delta_scrape/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ async: true }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error triggering delta scrape:', error);
      throw error;
    }
  },

  getScrapingStatus: async (): Promise<any> => {
    try {
      const response = await fetch(buildApiUrl('/api/forex-signals/scraping_status/'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching scraping status:', error);
      throw error;
    }
  },
};
