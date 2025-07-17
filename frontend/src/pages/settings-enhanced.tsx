import { useState } from "react";
import { Settings as SettingsIcon, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// Mock data for settings - ready for backend integration
const mockInputSources = [
  {
    id: 1,
    name: "Trading Economics API",
    type: "Economic Calendar",
    method: "API",
    endpoint: "https://api.tradingeconomics.com/calendar",
    status: true,
    config: { apiKey: "***", countries: ["US", "EU"], importance: ["High", "Medium"] }
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
    config: { apiKey: "***", categories: ["forex", "stocks"] }
  }
];

const mockOutputDestinations = [
  {
    id: 1,
    platform: "Telegram",
    label: "FX News Channel",
    accountId: "@fxnews_channel",
    token: "***BOT_TOKEN***",
    status: true,
    config: { parseMode: "HTML", disablePreview: true }
  },
  {
    id: 2,
    platform: "Twitter",
    label: "Trading Account Main",
    accountId: "@tradingbot_main",
    token: "***API_KEY***",
    status: true,
    config: { hashtags: ["#forex", "#trading"], schedule: "immediate" }
  },
  {
    id: 3,
    platform: "Discord",
    label: "Trading Community",
    accountId: "trading-signals",
    token: "***WEBHOOK_URL***",
    status: true,
    config: { mentions: "@everyone", embedColor: "#0099ff" }
  },
  {
    id: 4,
    platform: "WhatsApp",
    label: "VIP Group",
    accountId: "+1234567890",
    token: "***SESSION_ID***",
    status: false,
    config: { broadcastList: true, mediaSupport: false }
  }
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("inputs");
  const [inputSources] = useState(mockInputSources);
  const [outputDestinations] = useState(mockOutputDestinations);
  const [editingInput, setEditingInput] = useState<any>(null);
  const [editingOutput, setEditingOutput] = useState<any>(null);

  const getPlatformIcon = (platform: string) => {
    const icons = {
      'Telegram': '📱',
      'Twitter': '🐦',
      'Discord': '💬',
      'WhatsApp': '📲'
    };
    return icons[platform as keyof typeof icons] || '🌐';
  };

  const getMethodBadge = (method: string) => {
    return method === 'API' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
              <p className="text-xs text-slate-500">Configure sources & outputs</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab("inputs")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "inputs" 
                  ? "bg-blue-100 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              📥 Input Sources
            </button>
            <button
              onClick={() => setActiveTab("outputs")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "outputs" 
                  ? "bg-blue-100 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              📤 Output Destinations
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "templates" 
                  ? "bg-blue-100 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              📝 Format Templates
            </button>
            <button
              onClick={() => setActiveTab("schedules")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "schedules" 
                  ? "bg-blue-100 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              ⏰ Schedules
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {activeTab === "inputs" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Input Sources</h2>
                  <p className="text-slate-600 mt-1">Configure data sources for economic calendar, signals, and news</p>
                </div>
                <Button onClick={() => setEditingInput({})}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Source
                </Button>
              </div>

              <div className="grid gap-6">
                {inputSources.map((source) => (
                  <div key={source.id} className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-slate-900">{source.name}</h3>
                          <Badge className={getMethodBadge(source.method)}>
                            {source.method}
                          </Badge>
                          <Badge variant="outline">
                            {source.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {source.status ? (
                          <ToggleRight className="w-6 h-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setEditingInput(source)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Endpoint:</span>
                        <p className="font-mono text-slate-700 break-all">{source.endpoint}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Status:</span>
                        <p className={`font-medium ${source.status ? 'text-green-600' : 'text-red-600'}`}>
                          {source.status ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-slate-50 rounded text-sm">
                      <span className="text-slate-500">Configuration:</span>
                      <pre className="mt-1 text-slate-700 font-mono text-xs">
                        {JSON.stringify(source.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "outputs" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Output Destinations</h2>
                  <p className="text-slate-600 mt-1">Configure platforms and accounts for content posting</p>
                </div>
                <Button onClick={() => setEditingOutput({})}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Destination
                </Button>
              </div>

              <div className="grid gap-6">
                {outputDestinations.map((dest) => (
                  <div key={dest.id} className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">{getPlatformIcon(dest.platform)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{dest.label}</h3>
                          <p className="text-slate-600">{dest.platform} • {dest.accountId}</p>
                        </div>
                        <Badge className={dest.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {dest.status ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3">
                        {dest.status ? (
                          <ToggleRight className="w-6 h-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setEditingOutput(dest)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Platform:</span>
                        <p className="font-medium text-slate-900">{dest.platform}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Account/Channel:</span>
                        <p className="font-mono text-slate-700">{dest.accountId}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Token/Key:</span>
                        <p className="font-mono text-slate-700">{dest.token.substring(0, 10)}...</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded text-sm">
                      <span className="text-slate-500">Platform Configuration:</span>
                      <pre className="mt-1 text-slate-700 font-mono text-xs">
                        {JSON.stringify(dest.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "templates" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Format Templates</h2>
                  <p className="text-slate-600 mt-1">Customize how content appears on each platform</p>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>
              
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <p className="text-slate-600">Template configuration coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === "schedules" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Posting Schedules</h2>
                  <p className="text-slate-600 mt-1">Configure when and how often content is posted</p>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Schedule
                </Button>
              </div>
              
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <p className="text-slate-600">Schedule configuration coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
