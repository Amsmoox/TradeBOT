import { useState } from "react";
import { Settings as SettingsIcon, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Save, X, BarChart3, Link, Clock, TrendingUp, Zap, FileText, Target, MessageCircle, Twitter, Hash, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Types for better type safety
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
  const [inputSources, setInputSources] = useState<InputSource[]>(initialInputSources);
  const [outputDestinations, setOutputDestinations] = useState<OutputDestination[]>(initialOutputDestinations);
  const [editingInput, setEditingInput] = useState<InputSource | null>(null);
  const [editingOutput, setEditingOutput] = useState<OutputDestination | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'input' | 'output', id: number} | null>(null);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [showOutputDialog, setShowOutputDialog] = useState(false);
  
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
    configText: '{}'
  });
  
  const [outputForm, setOutputForm] = useState({
    platform: 'Telegram' as OutputDestination['platform'],
    label: '',
    accountId: '',
    token: '',
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

  // Input source CRUD operations
  const handleAddInput = () => {
    setInputForm({ 
      name: '', 
      type: 'Economic Calendar', 
      method: 'API', 
      endpoint: '', 
      apiKey: '', 
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
      configText: JSON.stringify(source.config, null, 2)
    });
    setEditingInput(source);
    setShowInputDialog(true);
  };

  const handleSaveInput = () => {
    try {
      const config = JSON.parse(inputForm.configText);
      if (inputForm.apiKey) {
        config.apiKey = inputForm.apiKey;
      }

      const newSource: InputSource = {
        id: editingInput?.id || Date.now(),
        name: inputForm.name,
        type: inputForm.type,
        method: inputForm.method,
        endpoint: inputForm.endpoint,
        status: editingInput?.status ?? true,
        config
      };

      if (editingInput) {
        setInputSources(prev => prev.map(s => s.id === editingInput.id ? newSource : s));
      } else {
        setInputSources(prev => [...prev, newSource]);
      }
      
      setShowInputDialog(false);
      setEditingInput(null);
    } catch (error) {
      alert('Invalid JSON configuration');
    }
  };

  const handleDeleteInput = (id: number) => {
    setInputSources(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
  };

  const toggleInputStatus = (id: number) => {
    setInputSources(prev => prev.map(s => 
      s.id === id ? { ...s, status: !s.status } : s
    ));
  };

  // Output destination CRUD operations
  const handleAddOutput = () => {
    setOutputForm({ 
      platform: 'Telegram', 
      label: '', 
      accountId: '', 
      token: '', 
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
      configText: JSON.stringify(dest.config, null, 2)
    });
    setEditingOutput(dest);
    setShowOutputDialog(true);
  };

  const handleSaveOutput = () => {
    try {
      const config = JSON.parse(outputForm.configText);

      const newDest: OutputDestination = {
        id: editingOutput?.id || Date.now(),
        platform: outputForm.platform,
        label: outputForm.label,
        accountId: outputForm.accountId,
        token: outputForm.token,
        status: editingOutput?.status ?? true,
        config
      };

      if (editingOutput) {
        setOutputDestinations(prev => prev.map(d => d.id === editingOutput.id ? newDest : d));
      } else {
        setOutputDestinations(prev => [...prev, newDest]);
      }
      
      setShowOutputDialog(false);
      setEditingOutput(null);
    } catch (error) {
      alert('Invalid JSON configuration');
    }
  };

  const handleDeleteOutput = (id: number) => {
    setOutputDestinations(prev => prev.filter(d => d.id !== id));
    setDeleteConfirm(null);
  };

  const toggleOutputStatus = (id: number) => {
    setOutputDestinations(prev => prev.map(d => 
      d.id === id ? { ...d, status: !d.status } : d
    ));
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
                {inputSources.map((source) => (
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
                ))}
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
                {outputDestinations.map((dest) => (
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
                ))}
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
        <DialogContent className="max-w-2xl">
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
              <Button onClick={handleSaveInput}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Output Destination Dialog */}
      <Dialog open={showOutputDialog} onOpenChange={setShowOutputDialog}>
        <DialogContent className="max-w-2xl">
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
              <Button onClick={handleSaveOutput}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <AlertDialog open={true} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
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
