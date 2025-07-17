import { createContext, useContext, useState, ReactNode } from 'react';

// Types
interface InputSource {
  id: number;
  name: string;
  type: "Economic Calendar" | "Trading Signals" | "Market News";
  method: "API" | "Scraping";
  endpoint: string;
  status: boolean;
  config: any;
}

interface OutputDestination {
  id: number;
  platform: "Telegram" | "Twitter" | "Discord" | "WhatsApp";
  label: string;
  accountId: string;
  token: string;
  status: boolean;
  config: any;
}

interface SettingsContextType {
  inputSources: InputSource[];
  outputDestinations: OutputDestination[];
  getActiveInputSources: (type?: InputSource['type']) => InputSource[];
  getActiveOutputDestinations: (platform?: OutputDestination['platform']) => OutputDestination[];
  updateInputSources: (sources: InputSource[]) => void;
  updateOutputDestinations: (destinations: OutputDestination[]) => void;
}

// Initial data - same as in settings page
const initialInputSources: InputSource[] = [
  {
    id: 1,
    name: "Trading Economics API",
    type: "Economic Calendar",
    method: "API",
    endpoint: "https://api.tradingeconomics.com/calendar",
    status: true,
    config: { apiKey: "TE_API_KEY_123", countries: ["US", "EU"], importance: ["High", "Medium"] }
  },
  {
    id: 2,
    name: "FXLeaders Scraper",
    type: "Trading Signals",
    method: "Scraping",
    endpoint: "https://www.fxleaders.com/live-trading-signals",
    status: true,
    config: { interval: "30s", instruments: ["EUR/USD", "GBP/USD", "USD/JPY"] }
  },
  {
    id: 3,
    name: "Reuters News Feed",
    type: "Market News",
    method: "API",
    endpoint: "https://api.reuters.com/news",
    status: false,
    config: { apiKey: "REUTERS_API_456", categories: ["forex", "stocks"] }
  }
];

const initialOutputDestinations: OutputDestination[] = [
  {
    id: 1,
    platform: "Telegram",
    label: "FX News Channel",
    accountId: "@fxnews_channel",
    token: "1234567890:AAEhBOwweELEechPqS-GzQn8g_9eNBqKEys",
    status: true,
    config: { parseMode: "HTML", disablePreview: true }
  },
  {
    id: 2,
    platform: "Twitter",
    label: "Trading Account Main",
    accountId: "@tradingbot_main",
    token: "AAAAAAAAAAAAAAAAAAAAAL%2FXHQEAAAAA",
    status: true,
    config: { hashtags: ["#forex", "#trading"], schedule: "immediate" }
  },
  {
    id: 3,
    platform: "Discord",
    label: "Trading Community",
    accountId: "trading-signals",
    token: "https://discord.com/api/webhooks/123456789/abcdefghijk",
    status: true,
    config: { mentions: "@everyone", embedColor: "#0099ff" }
  },
  {
    id: 4,
    platform: "WhatsApp",
    label: "VIP Group",
    accountId: "+1234567890",
    token: "SESSION_STRING_BASE64_ENCODED",
    status: false,
    config: { broadcastList: true, mediaSupport: false }
  }
];

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [inputSources, setInputSources] = useState<InputSource[]>(initialInputSources);
  const [outputDestinations, setOutputDestinations] = useState<OutputDestination[]>(initialOutputDestinations);

  const getActiveInputSources = (type?: InputSource['type']) => {
    const activeSources = inputSources.filter(source => source.status);
    return type ? activeSources.filter(source => source.type === type) : activeSources;
  };

  const getActiveOutputDestinations = (platform?: OutputDestination['platform']) => {
    const activeDestinations = outputDestinations.filter(dest => dest.status);
    return platform ? activeDestinations.filter(dest => dest.platform === platform) : activeDestinations;
  };

  const updateInputSources = (sources: InputSource[]) => {
    setInputSources(sources);
  };

  const updateOutputDestinations = (destinations: OutputDestination[]) => {
    setOutputDestinations(destinations);
  };

  return (
    <SettingsContext.Provider value={{
      inputSources,
      outputDestinations,
      getActiveInputSources,
      getActiveOutputDestinations,
      updateInputSources,
      updateOutputDestinations
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Export types for use in components
export type { InputSource, OutputDestination };
