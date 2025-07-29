import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Save, X, BarChart3, Link, Clock, TrendingUp, Zap, FileText, Target, MessageCircle, Twitter, Hash, Phone, Key, Shield, Eye, EyeOff, CheckCircle, AlertCircle, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiClient, type InputSource as ApiInputSource, type OutputDestination as ApiOutputDestination, type CreateInputSourceRequest, type CreateOutputDestinationRequest } from '@/lib/api';

// Types for better type safety (mapped from API types)
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

// Map API types to local types
const mapApiInputSource = (api: ApiInputSource): InputSource => ({
  id: api.id,
  name: api.name,
  type: api.source_type === 'economic_calendar' ? 'Economic Calendar' :
        api.source_type === 'trading_signals' ? 'Trading Signals' : 'Market News',
  method: api.method === 'api' ? 'API' : 'Scraping',
  endpoint: api.endpoint_url,
  status: api.is_active,
  config: api.config
});

const mapApiOutputDestination = (api: ApiOutputDestination): OutputDestination => ({
  id: api.id,
  platform: api.platform.charAt(0).toUpperCase() + api.platform.slice(1) as OutputDestination['platform'],
  label: api.label,
  accountId: api.account_id,
  token: '', // Don't expose token in UI
  status: api.is_active,
  config: api.config
});

// Initial data with individual API keys/tokens per account
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

export default function Settings() {
  // Data states
  const [inputSources, setInputSources] = useState<InputSource[]>([]);
  const [outputDestinations, setOutputDestinations] = useState<OutputDestination[]>([]);
  const [loading, setLoading] = useState({
    inputs: true,
    outputs: true,
    saving: false,
    testing: false
  });
  
  // Dialog states
  const [editingInput, setEditingInput] = useState<InputSource | null>(null);
  const [editingOutput, setEditingOutput] = useState<OutputDestination | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'input' | 'output', id: number} | null>(null);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [showOutputDialog, setShowOutputDialog] = useState(false);
  
  // Credential visibility states
  const [showCredentials, setShowCredentials] = useState({
    input: false,
    output: false
  });
  
  // Connection testing states
  const [testingConnection, setTestingConnection] = useState({
    input: false,
    output: false
  });
  
  // Load data on component mount
  useEffect(() => {
    loadInputSources();
    loadOutputDestinations();
  }, []);

  const loadInputSources = async () => {
    setLoading(prev => ({ ...prev, inputs: true }));
    try {
      const inputSources = await apiClient.getInputSources();
      setInputSources(inputSources.map(mapApiInputSource));
    } catch (error) {
      console.error('Error loading input sources:', error);
    } finally {
      setLoading(prev => ({ ...prev, inputs: false }));
    }
  };

  const loadOutputDestinations = async () => {
    setLoading(prev => ({ ...prev, outputs: true }));
    try {
      const outputDestinations = await apiClient.getOutputDestinations();
      setOutputDestinations(outputDestinations.map(mapApiOutputDestination));
    } catch (error) {
      console.error('Error loading output destinations:', error);
    } finally {
      setLoading(prev => ({ ...prev, outputs: false }));
    }
  };
  
  // Scheduling state
  const [scheduleSettings, setScheduleSettings] = useState({
    autoPost: true,
    postInterval: 30,
    quietHours: { start: "22:00", end: "06:00" },
    timezone: "UTC",
    weekendPosting: false
  });
  
  // Form states
  const [inputForm, setInputForm] = useState({
    name: '',
    type: 'Economic Calendar' as InputSource['type'],
    method: 'API' as InputSource['method'],
    endpoint: '',
    apiKey: '',
    username: '',
    password: '',
    configText: '{}'
  });
  
  const [outputForm, setOutputForm] = useState({
    platform: 'Telegram' as OutputDestination['platform'],
    label: '',
    accountId: '',
    token: '',
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    accessTokenSecret: '',
    configText: '{}'
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Telegram':
        return <MessageCircle className="w-4 h-4" />;
      case 'Twitter':
        return <Twitter className="w-4 h-4" />;
      case 'Discord':
        return <Hash className="w-4 h-4" />;
      case 'WhatsApp':
        return <Phone className="w-4 h-4" />;
      default:
        return <Link className="w-4 h-4" />;
    }
  };

  const getMethodBadge = (method: string) => {
    return method === 'API' 
      ? '!bg-emerald-700 !text-white !border-emerald-800 !border-2 shadow-md' 
      : '!bg-sky-700 !text-white !border-sky-800 !border-2 shadow-md';
  };

  // Custom Badge Component for maximum control
  const CustomBadge = ({ children, className, style }: { children: React.ReactNode, className?: string, style?: any }) => {
    return (
      <span 
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${className}`}
        style={{
          backgroundColor: '#1f2937', // Force dark background
          color: '#ffffff', // Force white text
          border: '2px solid #111827', // Force dark border
          ...style
        }}
      >
        {children}
      </span>
    );
  };

    // Helper functions for credential management
  const toggleCredentialVisibility = (type: 'input' | 'output') => {
    setShowCredentials(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const testInputConnection = async () => {
    if (!editingInput) {
      alert('Please save the input source first before testing connection');
      return;
    }
    
    setTestingConnection(prev => ({ ...prev, input: true }));
    try {
      const result = await apiClient.testInputSourceConnection(editingInput.id);
      if (result.status === 'success') {
        alert(`✅ Connection test successful!\n${result.message}`);
      } else {
        alert(`❌ Connection test failed!\n${result.message}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      alert('❌ Connection test failed! Please check your network connection.');
    } finally {
      setTestingConnection(prev => ({ ...prev, input: false }));
    }
  };

  const testOutputConnection = async () => {
    if (!editingOutput) {
      alert('Please save the output destination first before testing connection');
      return;
    }
    
    setTestingConnection(prev => ({ ...prev, output: true }));
    try {
      const result = await apiClient.testOutputDestinationConnection(editingOutput.id);
      if (result.status === 'success') {
        alert(`✅ Connection test successful!\n${result.message}`);
      } else {
        alert(`❌ Connection test failed!\n${result.message}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      alert('❌ Connection test failed! Please check your network connection.');
    } finally {
      setTestingConnection(prev => ({ ...prev, output: false }));
    }
  };

  // Input source CRUD operations
  const handleAddInput = () => {
    setInputForm({ 
      name: '', 
      type: 'Economic Calendar', 
      method: 'API', 
      endpoint: '', 
      apiKey: '',
      username: '',
      password: '',
      configText: '{}' 
    });
    setEditingInput(null);
    setShowInputDialog(true);
  };

  const handleEditInput = (source: InputSource) => {
    setInputForm({
      name: source.name,
      type: source.type,
      method: source.method,
      endpoint: source.endpoint,
      apiKey: source.config.apiKey || '',
      username: source.config.username || '',
      password: source.config.password || '',
      configText: JSON.stringify(source.config, null, 2)
    });
    setEditingInput(source);
    setShowInputDialog(true);
  };

  const handleSaveInput = async () => {
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      const config = JSON.parse(inputForm.configText);
      
      // Prepare credentials based on method
      const credentials: Record<string, string> = {};
      if (inputForm.method === 'API' && inputForm.apiKey) {
        credentials.apiKey = inputForm.apiKey;
      } else if (inputForm.method === 'Scraping' && inputForm.type === 'Trading Signals') {
        if (inputForm.username) credentials.username = inputForm.username;
        if (inputForm.password) credentials.password = inputForm.password;
      }

      let response: ApiInputSource;
      if (editingInput) {
        const updateData: Partial<ApiInputSource> = {
          name: inputForm.name,
          source_type: inputForm.type === 'Economic Calendar' ? 'economic_calendar' :
                      inputForm.type === 'Trading Signals' ? 'trading_signals' : 'market_news',
          method: inputForm.method.toLowerCase() as 'api' | 'scraping',
          endpoint_url: inputForm.endpoint,
          credentials,
          config,
          is_active: editingInput.status
        };
        response = await apiClient.updateInputSource(editingInput.id, updateData);
      } else {
        const requestData: CreateInputSourceRequest = {
          name: inputForm.name,
          source_type: inputForm.type === 'Economic Calendar' ? 'economic_calendar' :
                      inputForm.type === 'Trading Signals' ? 'trading_signals' : 'market_news',
          method: inputForm.method.toLowerCase() as 'api' | 'scraping',
          endpoint_url: inputForm.endpoint,
          credentials,
          config,
          is_active: true
        };
        response = await apiClient.createInputSource(requestData);
      }

      // Reload the list to get updated data
      await loadInputSources();
      setShowInputDialog(false);
      setEditingInput(null);
      alert('✅ Input source saved successfully!');
    } catch (error) {
      console.error('Save input source error:', error);
      if (error instanceof SyntaxError) {
        alert('❌ Invalid JSON configuration');
      } else {
        alert('❌ Failed to save input source. Please try again.');
      }
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleDeleteInput = async (id: number) => {
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      await apiClient.deleteInputSource(id);
      await loadInputSources();
      setDeleteConfirm(null);
      alert('✅ Input source deleted successfully!');
    } catch (error) {
      console.error('Delete input source error:', error);
      alert('❌ Failed to delete input source. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const toggleInputStatus = async (id: number) => {
    const source = inputSources.find(s => s.id === id);
    if (!source) return;

    try {
      const requestData = {
        is_active: !source.status
      };
      
      await apiClient.updateInputSource(id, requestData);
      await loadInputSources();
    } catch (error) {
      console.error('Toggle input status error:', error);
      alert('❌ Failed to update input source status.');
    }
  };

  // Output destination CRUD operations
  const handleAddOutput = () => {
    setOutputForm({ 
      platform: 'Telegram', 
      label: '', 
      accountId: '', 
      token: '', 
      apiKey: '',
      apiSecret: '',
      accessToken: '',
      accessTokenSecret: '',
      configText: '{}' 
    });
    setEditingOutput(null);
    setShowOutputDialog(true);
  };

  const handleEditOutput = (dest: OutputDestination) => {
    setOutputForm({
      platform: dest.platform,
      label: dest.label,
      accountId: dest.accountId,
      token: dest.token,
      apiKey: dest.config.apiKey || '',
      apiSecret: dest.config.apiSecret || '',
      accessToken: dest.config.accessToken || '',
      accessTokenSecret: dest.config.accessTokenSecret || '',
      configText: JSON.stringify(dest.config, null, 2)
    });
    setEditingOutput(dest);
    setShowOutputDialog(true);
  };

  const handleSaveOutput = async () => {
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      const config = JSON.parse(outputForm.configText);
      
      // Prepare platform-specific credentials
      const credentials: Record<string, string> = {};
      if (outputForm.token) credentials.token = outputForm.token;
      if (outputForm.apiKey) credentials.api_key = outputForm.apiKey;
      if (outputForm.apiSecret) credentials.api_secret = outputForm.apiSecret;
      if (outputForm.accessToken) credentials.access_token = outputForm.accessToken;
      if (outputForm.accessTokenSecret) credentials.access_token_secret = outputForm.accessTokenSecret;

      let response: ApiOutputDestination;
      if (editingOutput) {
        const updateData: Partial<ApiOutputDestination> = {
          platform: outputForm.platform.toLowerCase() as 'telegram' | 'twitter' | 'discord' | 'whatsapp',
          label: outputForm.label,
          account_id: outputForm.accountId,
          credentials,
          config,
          is_active: editingOutput.status
        };
        response = await apiClient.updateOutputDestination(editingOutput.id, updateData);
      } else {
        const requestData: CreateOutputDestinationRequest = {
          platform: outputForm.platform.toLowerCase() as 'telegram' | 'twitter' | 'discord' | 'whatsapp',
          label: outputForm.label,
          account_id: outputForm.accountId,
          credentials,
          config,
          is_active: true
        };
        response = await apiClient.createOutputDestination(requestData);
      }

      // Reload the list to get updated data
      await loadOutputDestinations();
      setShowOutputDialog(false);
      setEditingOutput(null);
      alert('✅ Output destination saved successfully!');
    } catch (error) {
      console.error('Save output destination error:', error);
      if (error instanceof SyntaxError) {
        alert('❌ Invalid JSON configuration');
      } else {
        alert('❌ Failed to save output destination. Please try again.');
      }
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleDeleteOutput = async (id: number) => {
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      await apiClient.deleteOutputDestination(id);
      await loadOutputDestinations();
      setDeleteConfirm(null);
      alert('✅ Output destination deleted successfully!');
    } catch (error) {
      console.error('Delete output destination error:', error);
      alert('❌ Failed to delete output destination. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const toggleOutputStatus = async (id: number) => {
    const destination = outputDestinations.find(d => d.id === id);
    if (!destination) return;

    try {
      const requestData = {
        is_active: !destination.status
      };
      
      await apiClient.updateOutputDestination(id, requestData);
      await loadOutputDestinations();
    } catch (error) {
      console.error('Toggle output status error:', error);
      alert('❌ Failed to update output destination status.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                TradeBOT Settings
              </h1>
              <p className="text-slate-600">Configure data sources, platform accounts, and scheduling</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Data Sources Section */}
          <div className="xl:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Data Sources</h2>
                    <p className="text-xs text-slate-600">Input sources & scrapers</p>
                  </div>
                </div>
                <Button 
                  onClick={handleAddInput}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {loading.inputs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-slate-600">Loading input sources...</span>
                  </div>
                ) : inputSources.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No input sources configured yet</p>
                    <p className="text-sm">Add your first data source to get started</p>
                  </div>
                ) : (
                  inputSources.map((source) => (
                  <div key={source.id} className="bg-white/50 rounded-xl border border-slate-200/50 p-4 hover:bg-white/70 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-slate-900 text-sm">{source.name}</h3>
                        <Badge 
                          className={`${getMethodBadge(source.method)} text-xs font-bold`}
                          style={{
                            backgroundColor: source.method === 'API' ? '#047857' : '#0369a1',
                            color: '#ffffff',
                            border: '2px solid ' + (source.method === 'API' ? '#064e3b' : '#0c4a6e'),
                            opacity: 1
                          }}
                        >
                          {source.method}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => toggleInputStatus(source.id)}>
                          {source.status ? (
                            <ToggleRight className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditInput(source)} className="h-6 w-6 p-0">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 h-6 w-6 p-0"
                          onClick={() => setDeleteConfirm({type: 'input', id: source.id})}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <p className="text-slate-600 truncate">{source.endpoint}</p>
                      <div className="flex items-center justify-between">
                        <Badge className="!bg-slate-900 !text-white !border-slate-950 !border-2 text-xs font-bold shadow-md">
                          {source.type}
                        </Badge>
                        <span className={`text-xs font-medium ${source.status ? 'text-emerald-600' : 'text-red-600'}`}>
                          {source.status ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>
          </div>

          {/* Platform Accounts Section */}
          <div className="xl:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Link className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Platform Accounts</h2>
                    <p className="text-xs text-slate-600">Connected social platforms</p>
                  </div>
                </div>
                <Button 
                  onClick={handleAddOutput}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {loading.outputs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-slate-600">Loading output destinations...</span>
                  </div>
                ) : outputDestinations.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">
                    <Link className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No output destinations configured yet</p>
                    <p className="text-sm">Add your first platform account to get started</p>
                  </div>
                ) : (
                  outputDestinations.map((dest) => (
                  <div key={dest.id} className="bg-white/50 rounded-xl border border-slate-200/50 p-4 hover:bg-white/70 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center text-white">
                          {getPlatformIcon(dest.platform)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">{dest.label}</h3>
                          <p className="text-xs text-slate-600">{dest.accountId}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => toggleOutputStatus(dest.id)}>
                          {dest.status ? (
                            <ToggleRight className="w-5 h-5 text-purple-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditOutput(dest)} className="h-6 w-6 p-0">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 h-6 w-6 p-0"
                          onClick={() => setDeleteConfirm({type: 'output', id: dest.id})}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <Badge className="!bg-purple-600 !text-white !border-purple-700 !border-2 text-xs font-bold shadow-md">
                        {dest.platform}
                      </Badge>
                      <Badge className={`${dest.status ? '!bg-green-600 !text-white !border-green-700' : '!bg-red-600 !text-white !border-red-700'} !border-2 text-xs font-bold shadow-md`}>
                        {dest.status ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>
          </div>

          {/* Scheduling Section */}
          <div className="xl:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Scheduling</h2>
                  <p className="text-xs text-slate-600">Auto-posting configuration</p>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Auto-posting Toggle */}
                <div className="bg-white/50 rounded-xl border border-slate-200/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="text-sm font-semibold text-slate-900">Auto-posting</label>
                      <p className="text-xs text-slate-600">Enable automated posting</p>
                    </div>
                    <button 
                      onClick={() => setScheduleSettings(prev => ({...prev, autoPost: !prev.autoPost}))}
                      className="flex items-center"
                    >
                      {scheduleSettings.autoPost ? (
                        <ToggleRight className="w-6 h-6 text-orange-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Settings */}
                <div className="bg-white/50 rounded-xl border border-slate-200/50 p-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Quick Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="postInterval" className="text-xs">Interval (min)</Label>
                      <Input
                        id="postInterval"
                        type="number"
                        value={scheduleSettings.postInterval}
                        onChange={(e) => setScheduleSettings(prev => ({...prev, postInterval: parseInt(e.target.value) || 30}))}
                        min="1"
                        max="1440"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone" className="text-xs">Timezone</Label>
                      <Select 
                        value={scheduleSettings.timezone} 
                        onValueChange={(value) => setScheduleSettings(prev => ({...prev, timezone: value}))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">New York</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Quiet Hours */}
                <div className="bg-white/50 rounded-xl border border-slate-200/50 p-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Quiet Hours</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="quietStart" className="text-xs">Start</Label>
                      <Input
                        id="quietStart"
                        type="time"
                        value={scheduleSettings.quietHours.start}
                        onChange={(e) => setScheduleSettings(prev => ({
                          ...prev, 
                          quietHours: {...prev.quietHours, start: e.target.value}
                        }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quietEnd" className="text-xs">End</Label>
                      <Input
                        id="quietEnd"
                        type="time"
                        value={scheduleSettings.quietHours.end}
                        onChange={(e) => setScheduleSettings(prev => ({
                          ...prev, 
                          quietHours: {...prev.quietHours, end: e.target.value}
                        }))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Weekend Toggle */}
                <div className="bg-white/50 rounded-xl border border-slate-200/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold text-slate-900">Weekend Posting</label>
                      <p className="text-xs text-slate-600">Post on weekends</p>
                    </div>
                    <button 
                      onClick={() => setScheduleSettings(prev => ({...prev, weekendPosting: !prev.weekendPosting}))}
                      className="flex items-center"
                    >
                      {scheduleSettings.weekendPosting ? (
                        <ToggleRight className="w-5 h-5 text-orange-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Content Schedules */}
                <div className="bg-white/50 rounded-xl border border-slate-200/50 p-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Content Schedules</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Economic</span>
                      </span>
                      <Badge className="!bg-blue-700 !text-white !border-blue-800 !border-2 text-xs font-bold shadow-md">Immediate</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center space-x-1">
                        <Zap className="w-3 h-3" />
                        <span>Signals</span>
                      </span>
                      <Badge className="!bg-green-700 !text-white !border-green-800 !border-2 text-xs font-bold shadow-md">5min</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>News</span>
                      </span>
                      <Badge className="!bg-orange-700 !text-white !border-orange-800 !border-2 text-xs font-bold shadow-md">30min</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Summary Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl border border-blue-200/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">System Status</h3>
                <p className="text-slate-600">Current configuration overview</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600">{inputSources.filter(s => s.status).length}</div>
                <div className="text-xs text-slate-600">Active Sources</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{outputDestinations.filter(d => d.status).length}</div>
                <div className="text-xs text-slate-600">Connected Platforms</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{scheduleSettings.autoPost ? 'ON' : 'OFF'}</div>
                <div className="text-xs text-slate-600">Auto-posting</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Source Dialog */}
      <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
        <DialogContent className="max-w-2xl !bg-white/95 !backdrop-blur-xl !border-slate-200/50 !shadow-2xl">
          <DialogHeader>
            <DialogTitle>{editingInput ? 'Edit Input Source' : 'Add Input Source'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Source Name</Label>
                <Input
                  id="name"
                  value={inputForm.name}
                  onChange={(e) => setInputForm(prev => ({...prev, name: e.target.value}))}
                  placeholder="e.g., Trading Economics API"
                />
              </div>
              <div>
                <Label htmlFor="type">Content Type</Label>
                <Select 
                  value={inputForm.type} 
                  onValueChange={(value) => setInputForm(prev => ({...prev, type: value as any}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Economic Calendar">Economic Calendar</SelectItem>
                    <SelectItem value="Trading Signals">Trading Signals</SelectItem>
                    <SelectItem value="Market News">Market News</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="method">Method</Label>
                <Select 
                  value={inputForm.method} 
                  onValueChange={(value) => setInputForm(prev => ({...prev, method: value as any}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="API">API</SelectItem>
                    <SelectItem value="Scraping">Scraping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="endpoint">Endpoint URL</Label>
                <Input
                  id="endpoint"
                  value={inputForm.endpoint}
                  onChange={(e) => setInputForm(prev => ({...prev, endpoint: e.target.value}))}
                  placeholder="https://api.example.com/data"
                />
              </div>
            </div>

            {inputForm.method === 'API' && (
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={inputForm.apiKey}
                  onChange={(e) => setInputForm(prev => ({...prev, apiKey: e.target.value}))}
                  placeholder="Your API key"
                />
              </div>
            )}

            {inputForm.method === 'Scraping' && inputForm.type === 'Trading Signals' && (
              <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-blue-50/50 to-slate-50/30 border-blue-200/30 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium">FXLeaders Login Credentials</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCredentialVisibility('input')}
                    className="h-6 w-6 p-0 ml-auto"
                  >
                    {showCredentials.input ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type={showCredentials.input ? "text" : "password"}
                      value={inputForm.username}
                      onChange={(e) => setInputForm(prev => ({...prev, username: e.target.value}))}
                      placeholder="FXLeaders username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type={showCredentials.input ? "text" : "password"}
                      value={inputForm.password}
                      onChange={(e) => setInputForm(prev => ({...prev, password: e.target.value}))}
                      placeholder="FXLeaders password"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testInputConnection()}
                    disabled={testingConnection.input || !inputForm.username || !inputForm.password}
                    className="flex items-center gap-2"
                  >
                    {testingConnection.input ? (
                      <TestTube className="h-3 w-3 animate-spin" />
                    ) : (
                      <TestTube className="h-3 w-3" />
                    )}
                    Test Connection
                  </Button>
                  
                  {/* Connection status will be shown here after testing */}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="config">Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={inputForm.configText}
                onChange={(e) => setInputForm(prev => ({...prev, configText: e.target.value}))}
                placeholder='{"countries": ["US", "EU"], "importance": ["High"]}'
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowInputDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveInput} disabled={loading.saving}>
                {loading.saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {loading.saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Output Destination Dialog */}
      <Dialog open={showOutputDialog} onOpenChange={setShowOutputDialog}>
        <DialogContent className="max-w-2xl !bg-white/95 !backdrop-blur-xl !border-slate-200/50 !shadow-2xl">
          <DialogHeader>
            <DialogTitle>{editingOutput ? 'Edit Output Destination' : 'Add Output Destination'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select 
                  value={outputForm.platform} 
                  onValueChange={(value) => setOutputForm(prev => ({...prev, platform: value as any}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Telegram">Telegram</SelectItem>
                    <SelectItem value="Twitter">Twitter</SelectItem>
                    <SelectItem value="Discord">Discord</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={outputForm.label}
                  onChange={(e) => setOutputForm(prev => ({...prev, label: e.target.value}))}
                  placeholder="e.g., Main Trading Channel"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountId">Account/Channel ID</Label>
                <Input
                  id="accountId"
                  value={outputForm.accountId}
                  onChange={(e) => setOutputForm(prev => ({...prev, accountId: e.target.value}))}
                  placeholder="@channel_name or +1234567890"
                />
              </div>
              <div>
                <Label htmlFor="token">Token/API Key</Label>
                <Input
                  id="token"
                  type="password"
                  value={outputForm.token}
                  onChange={(e) => setOutputForm(prev => ({...prev, token: e.target.value}))}
                  placeholder="Bot token or API key"
                />
              </div>
            </div>

            {/* Platform-specific credential fields */}
            {(outputForm.platform === 'Twitter' || outputForm.platform === 'Discord') && (
              <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-blue-50/50 to-slate-50/30 border-blue-200/30 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium">
                    {outputForm.platform === 'Twitter' ? 'Twitter API Credentials' : 'Discord Bot Credentials'}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCredentialVisibility('output')}
                    className="h-6 w-6 p-0 ml-auto"
                  >
                    {showCredentials.output ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                
                {outputForm.platform === 'Twitter' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type={showCredentials.output ? "text" : "password"}
                        value={outputForm.apiKey}
                        onChange={(e) => setOutputForm(prev => ({...prev, apiKey: e.target.value}))}
                        placeholder="Twitter API Key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="apiSecret">API Secret</Label>
                      <Input
                        id="apiSecret"
                        type={showCredentials.output ? "text" : "password"}
                        value={outputForm.apiSecret}
                        onChange={(e) => setOutputForm(prev => ({...prev, apiSecret: e.target.value}))}
                        placeholder="Twitter API Secret"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accessToken">Access Token</Label>
                      <Input
                        id="accessToken"
                        type={showCredentials.output ? "text" : "password"}
                        value={outputForm.accessToken}
                        onChange={(e) => setOutputForm(prev => ({...prev, accessToken: e.target.value}))}
                        placeholder="Twitter Access Token"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accessTokenSecret">Access Token Secret</Label>
                      <Input
                        id="accessTokenSecret"
                        type={showCredentials.output ? "text" : "password"}
                        value={outputForm.accessTokenSecret}
                        onChange={(e) => setOutputForm(prev => ({...prev, accessTokenSecret: e.target.value}))}
                        placeholder="Twitter Access Token Secret"
                      />
                    </div>
                  </div>
                )}

                {outputForm.platform === 'Discord' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="apiKey">Application ID</Label>
                      <Input
                        id="apiKey"
                        type={showCredentials.output ? "text" : "password"}
                        value={outputForm.apiKey}
                        onChange={(e) => setOutputForm(prev => ({...prev, apiKey: e.target.value}))}
                        placeholder="Discord Application ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="apiSecret">Client Secret</Label>
                      <Input
                        id="apiSecret"
                        type={showCredentials.output ? "text" : "password"}
                        value={outputForm.apiSecret}
                        onChange={(e) => setOutputForm(prev => ({...prev, apiSecret: e.target.value}))}
                        placeholder="Discord Client Secret"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testOutputConnection()}
                    disabled={testingConnection.output || !outputForm.token}
                    className="flex items-center gap-2"
                  >
                    {testingConnection.output ? (
                      <TestTube className="h-3 w-3 animate-spin" />
                    ) : (
                      <TestTube className="h-3 w-3" />
                    )}
                    Test Connection
                  </Button>
                  
                  {/* Connection status will be shown here after testing */}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="outputConfig">Platform Configuration (JSON)</Label>
              <Textarea
                id="outputConfig"
                value={outputForm.configText}
                onChange={(e) => setOutputForm(prev => ({...prev, configText: e.target.value}))}
                placeholder='{"parseMode": "HTML", "disablePreview": true}'
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowOutputDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveOutput} disabled={loading.saving}>
                {loading.saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {loading.saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <AlertDialog open={true} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent className="!bg-white/95 !backdrop-blur-xl !border-slate-200/50 !shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the {deleteConfirm.type === 'input' ? 'input source' : 'output destination'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (deleteConfirm.type === 'input') {
                    handleDeleteInput(deleteConfirm.id);
                  } else {
                    handleDeleteOutput(deleteConfirm.id);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
