import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, Settings, Plus, Eye, Edit, ExternalLink, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useToast } from "@/hooks/use-toast";

export default function TradingSignals() {
  const [selectedTab, setSelectedTab] = useState("signals");
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  interface TradingSignal {
    id: number;
    symbol: string;
    direction: string;
    entry_price: string;
    stop_loss: string;
    take_profit: string;
    source: string;
    confidence: number;
    status: string;
    created_at: string;
    description: string;
  }

  // Mock data for development/testing
  const mockSignals: TradingSignal[] = [
    {
      id: 1,
      symbol: "EUR/USD",
      direction: "BUY",
      entry_price: "1.0850",
      stop_loss: "1.0800",
      take_profit: "1.0920",
      source: "FXLeaders",
      confidence: 85,
      status: "ACTIVE",
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      description: "Strong bullish momentum with RSI oversold conditions"
    },
    {
      id: 2,
      symbol: "GBP/JPY",
      direction: "SELL",
      entry_price: "185.20",
      stop_loss: "186.50",
      take_profit: "183.00",
      source: "FXLeaders",
      confidence: 72,
      status: "ACTIVE",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      description: "Bearish reversal pattern confirmed, targeting support levels"
    },
    {
      id: 3,
      symbol: "XAU/USD",
      direction: "BUY",
      entry_price: "2015.50",
      stop_loss: "2005.00",
      take_profit: "2035.00",
      source: "FXLeaders",
      confidence: 90,
      status: "CLOSED",
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      description: "Gold showing strong support at key level, inflation concerns driving demand"
    }
  ];

  const { data: signals, isLoading, error } = useQuery<TradingSignal[]>({
    queryKey: ['/api/trading-signals'],
    queryFn: () => {
      // Simulate API call - in production this would be a real API call
      return new Promise<TradingSignal[]>((resolve) => {
        setTimeout(() => resolve(mockSignals), 1000);
      });
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const { data: recentSignals } = useQuery<TradingSignal[]>({
    queryKey: ['/api/trading-signals/recent'],
    queryFn: () => {
      // Return last 5 signals
      return Promise.resolve(mockSignals.slice(0, 3));
    },
  });

  const getSignalColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'BUY': return 'bg-green-100 text-green-800 border-green-200';
      case 'SELL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HOLD': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'BUY': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'SELL': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Zap className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const signalTime = new Date(date);
    const diffMinutes = Math.floor((now.getTime() - signalTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const SourceConfiguration = () => {
    const mockSources = [
      {
        id: 1,
        name: "FXLeaders Premium",
        type: "fxleaders",
        url: "https://www.fxleaders.com/live-forex-trading-signals",
        status: "active",
        lastUpdate: "2 minutes ago",
        signalsCount: 156
      },
      {
        id: 2,
        name: "DailyFX Signals",
        type: "dailyfx",
        url: "https://www.dailyfx.com/forex-signals",
        status: "inactive",
        lastUpdate: "1 hour ago",
        signalsCount: 89
      }
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Active Sources</h2>
          <Button 
            onClick={() => setIsAddSourceModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Source
          </Button>
        </div>

        <div className="grid gap-4">
          {mockSources.map((source) => (
            <Card key={source.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${source.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <h3 className="font-semibold text-slate-900">{source.name}</h3>
                      <Badge variant="outline" className="capitalize">
                        {source.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{source.url}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                      <span>Last update: {source.lastUpdate}</span>
                      <span>•</span>
                      <span>{source.signalsCount} signals total</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Switch 
                      checked={source.status === 'active'} 
                      onCheckedChange={(checked) => {
                        toast({
                          title: checked ? "Source Activated" : "Source Deactivated",
                          description: `${source.name} has been ${checked ? 'activated' : 'deactivated'}.`,
                        });
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Global Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary-source">Primary Source</Label>
              <Select defaultValue="fxleaders">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fxleaders">FXLeaders</SelectItem>
                  <SelectItem value="dailyfx">DailyFX</SelectItem>
                  <SelectItem value="myfxbook">MyFXBook</SelectItem>
                  <SelectItem value="tradingview">TradingView</SelectItem>
                  <SelectItem value="custom">Custom API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scraping-interval">Default Check Interval</Label>
              <Select defaultValue="30min">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5min">Every 5 minutes</SelectItem>
                  <SelectItem value="15min">Every 15 minutes</SelectItem>
                  <SelectItem value="30min">Every 30 minutes</SelectItem>
                  <SelectItem value="1hour">Every hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="auto-scraping" defaultChecked />
              <Label htmlFor="auto-scraping">Enable automatic signal detection</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="duplicate-filter" defaultChecked />
              <Label htmlFor="duplicate-filter">Filter duplicate signals</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const ContentSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Signal Format & Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="signal-template">Signal Template</Label>
            <Textarea 
              id="signal-template"
              rows={6}
              placeholder="⚡ NEW SIGNAL: {pair} {type}
💰 Entry: {entry}
🎯 Target: {target}
🛡️ Stop Loss: {stopLoss}
📊 Current: {current}

Technical Setup: {analysis}
Risk/Reward: {riskReward}
Source: {source}

#TradingSignal #{pair}"
              defaultValue="⚡ NEW SIGNAL: {pair} {type}
💰 Entry: {entry}
🎯 Target: {target}
🛡️ Stop Loss: {stopLoss}
📊 Current: {current}

Technical Setup: {analysis}
Risk/Reward: {riskReward}
Source: {source}

#TradingSignal #{pair}"
            />
          </div>
          <div>
            <Label htmlFor="analysis-style">Analysis Enhancement</Label>
            <Select defaultValue="basic">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No enhancement</SelectItem>
                <SelectItem value="basic">Basic technical context</SelectItem>
                <SelectItem value="detailed">Detailed analysis with AI</SelectItem>
                <SelectItem value="educational">Educational explanations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="risk-analysis" defaultChecked />
            <Label htmlFor="risk-analysis">Include risk/reward analysis</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="market-context" defaultChecked />
            <Label htmlFor="market-context">Add market context</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publishing Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="posting-mode">Posting Mode</Label>
            <Select defaultValue="immediate">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Post immediately</SelectItem>
                <SelectItem value="review">Review before posting</SelectItem>
                <SelectItem value="batch">Batch posting (hourly)</SelectItem>
                <SelectItem value="manual">Manual posting only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target Platforms</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['telegram', 'twitter', 'discord', 'websites'].map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Switch 
                    id={`platform-${platform}`} 
                    defaultChecked={platform !== 'websites'} 
                  />
                  <Label htmlFor={`platform-${platform}`} className="capitalize">
                    {platform === 'twitter' ? 'X (Twitter)' : platform}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="quality-filter">Signal Quality Filter</Label>
            <Select defaultValue="medium">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All signals</SelectItem>
                <SelectItem value="medium">Medium quality and above</SelectItem>
                <SelectItem value="high">High quality only</SelectItem>
                <SelectItem value="premium">Premium signals only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AddSignalSourceModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      type: 'fxleaders',
      url: '',
      apiKey: '',
      interval: '30min',
      enabled: true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Here you would normally make an API call to save the source
      console.log('Adding new signal source:', formData);
      
      toast({
        title: "Signal Source Added",
        description: `${formData.name} has been added successfully.`,
      });
      
      setIsAddSourceModalOpen(false);
      
      // Reset form
      setFormData({
        name: '',
        type: 'fxleaders',
        url: '',
        apiKey: '',
        interval: '30min',
        enabled: true
      });
    };

    return (
      <Dialog open={isAddSourceModalOpen} onOpenChange={setIsAddSourceModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Signal Source</DialogTitle>
            <DialogDescription>
              Configure a new trading signal source to start receiving signals automatically.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-name">Source Name</Label>
              <Input
                id="source-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., FXLeaders Premium"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-type">Source Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({...formData, type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fxleaders">FXLeaders</SelectItem>
                  <SelectItem value="dailyfx">DailyFX</SelectItem>
                  <SelectItem value="myfxbook">MyFXBook</SelectItem>
                  <SelectItem value="tradingview">TradingView</SelectItem>
                  <SelectItem value="custom">Custom API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-url-modal">Source URL</Label>
              <Input
                id="source-url-modal"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="https://www.fxleaders.com/live-forex-trading-signals"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key-modal">API Key (Optional)</Label>
              <Input
                id="api-key-modal"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                placeholder="Enter API key if required"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="check-interval">Check Interval</Label>
              <Select 
                value={formData.interval} 
                onValueChange={(value) => setFormData({...formData, interval: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5min">Every 5 minutes</SelectItem>
                  <SelectItem value="15min">Every 15 minutes</SelectItem>
                  <SelectItem value="30min">Every 30 minutes</SelectItem>
                  <SelectItem value="1hour">Every hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="enabled-modal"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({...formData, enabled: checked})}
              />
              <Label htmlFor="enabled-modal">Enable immediately</Label>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddSourceModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Add Source
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Trading Signals</h1>
                <p className="text-sm text-slate-600 mt-1">Automated signal detection and distribution</p>
              </div>
            </div>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => setIsAddSourceModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Signal Source
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="signals">Active Signals</TabsTrigger>
              <TabsTrigger value="history">Signal History</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
              <TabsTrigger value="settings">Publishing</TabsTrigger>
            </TabsList>

            <TabsContent value="signals" className="space-y-4">
              {/* Loading State */}
              {isLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="h-4 bg-slate-200 rounded w-20"></div>
                          <div className="h-5 bg-slate-200 rounded w-12"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-200 rounded"></div>
                          <div className="h-3 bg-slate-200 rounded"></div>
                          <div className="h-3 bg-slate-200 rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="col-span-3 text-center py-12">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Failed to Load Signals</h3>
                  <p className="text-slate-600 mb-4">Unable to fetch trading signals. Please check your connection and try again.</p>
                  <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/trading-signals'] })}>
                    Retry
                  </Button>
                </div>
              )}

              {/* Signals Display */}
              {!isLoading && !error && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {Array.isArray(signals) && signals.length > 0 ? (
                    signals.slice(0, 6).map((signal: TradingSignal) => (
                      <Card key={signal.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {getSignalIcon(signal.direction)}
                              <span className="font-semibold text-slate-900">{signal.symbol}</span>
                            </div>
                            <Badge className={getSignalColor(signal.direction)}>
                              {signal.direction?.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            {signal.entry_price && (
                              <div className="flex justify-between">
                                <span className="text-slate-600">Entry:</span>
                                <span className="font-medium text-slate-900">{signal.entry_price}</span>
                              </div>
                            )}
                            {signal.take_profit && (
                              <div className="flex justify-between">
                                <span className="text-slate-600">Take Profit:</span>
                                <span className="font-medium text-green-600">{signal.take_profit}</span>
                              </div>
                            )}
                            {signal.stop_loss && (
                              <div className="flex justify-between">
                                <span className="text-slate-600">Stop Loss:</span>
                                <span className="font-medium text-red-600">{signal.stop_loss}</span>
                              </div>
                            )}
                            {signal.confidence && (
                              <div className="flex justify-between">
                                <span className="text-slate-600">Confidence:</span>
                                <span className="font-medium text-blue-600">{signal.confidence}%</span>
                              </div>
                            )}
                          </div>

                          {signal.description && (
                            <div className="mt-3 pt-2 border-t border-slate-200">
                              <p className="text-xs text-slate-600">{signal.description}</p>
                            </div>
                          )}

                          <div className="mt-4 pt-3 border-t border-slate-200">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{signal.source}</span>
                              <span>{formatTimeAgo(signal.created_at)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="outline" className={signal.status === 'CLOSED' ? 'bg-gray-50 text-gray-700' : signal.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}>
                                {signal.status}
                              </Badge>
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <Zap className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No Active Signals</h3>
                      <p className="text-slate-600 mb-4">Configure your signal sources to start receiving trading signals</p>
                      <Button onClick={() => setSelectedTab('sources')}>
                        Configure Sources
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {!isLoading && !error && Array.isArray(signals) && signals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Signal Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">68%</div>
                        <div className="text-sm text-slate-600">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{signals?.length || 0}</div>
                        <div className="text-sm text-slate-600">Active Signals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">2.3x</div>
                        <div className="text-sm text-slate-600">Avg Risk/Reward</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">156</div>
                        <div className="text-sm text-slate-600">Signals This Week</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Signal History</h3>
                </div>
                <div className="p-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse p-4 bg-slate-50 rounded-lg">
                          <div className="h-4 bg-slate-200 rounded mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : Array.isArray(signals) && signals.length > 0 ? (
                    <div className="space-y-4">
                      {signals.map((signal: TradingSignal) => (
                        <div key={signal.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              {getSignalIcon(signal.direction)}
                              <span className="font-medium text-slate-900">{signal.symbol}</span>
                              <Badge className={getSignalColor(signal.direction)}>
                                {signal.direction?.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-slate-500">from {signal.source}</span>
                            </div>
                            <div className="mt-2 text-sm text-slate-600">
                              <span className="mr-4">Entry: {signal.entry_price || 'N/A'}</span>
                              <span className="mr-4">Target: {signal.take_profit || 'N/A'}</span>
                              <span>Stop: {signal.stop_loss || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">
                              {formatTimeAgo(signal.created_at)}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline" className={signal.status === 'CLOSED' ? 'bg-gray-50 text-gray-700' : 'bg-green-50 text-green-700'}>
                                {signal.status === 'CLOSED' ? 'Posted' : 'Pending'}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Zap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">No signals found</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sources" className="space-y-4">
              <SourceConfiguration />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <ContentSettings />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
      <AddSignalSourceModal />
    </div>
  );
}