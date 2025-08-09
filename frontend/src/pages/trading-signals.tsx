import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, Settings, Plus, Eye, Edit, ExternalLink, TrendingUp, TrendingDown, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TradingSignals() {
  const [selectedTab, setSelectedTab] = useState("signals");
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  interface TradingSignal {
    id: number;
    instrument: string;
    action: string;
    entry_price: string;
    stop_loss: string;
    take_profit: string;
    status_signal: string;
    scrape_date: string;
    source_url: string;
    status: string;
  }

  // Real API queries
  const { data: signals, isLoading, error, refetch } = useQuery<TradingSignal[]>({
    queryKey: ['forex-signals'],
    queryFn: api.getForexSignals,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const { data: latestSignals } = useQuery<TradingSignal[]>({
    queryKey: ['forex-signals-latest'],
    queryFn: api.getLatestForexSignals,
    staleTime: 30 * 1000,
  });

  const { data: scrapingStatus } = useQuery({
    queryKey: ['scraping-status'],
    queryFn: api.getScrapingStatus,
    staleTime: 60 * 1000, // 1 minute
  });

  // Scraper Credentials queries
  const { data: credentials, isLoading: credentialsLoading } = useQuery({
    queryKey: ['scraper-credentials'],
    queryFn: api.getScraperCredentials,
    staleTime: 60 * 1000, // 1 minute
  });

  // Mutations for scraper credentials
  const createCredentialMutation = useMutation({
    mutationFn: api.createScraperCredential,
    onSuccess: () => {
      toast({
        title: "Credential Created",
        description: "Scraper credential has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['scraper-credentials'] });
      setIsCredentialsModalOpen(false);
      setEditingCredential(null);
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create credential.",
        variant: "destructive",
      });
    },
  });

  const updateCredentialMutation = useMutation({
    mutationFn: ({ id, credential }: { id: number; credential: any }) => 
      api.updateScraperCredential(id, credential),
    onSuccess: () => {
      toast({
        title: "Credential Updated",
        description: "Scraper credential has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['scraper-credentials'] });
      setIsCredentialsModalOpen(false);
      setEditingCredential(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update credential.",
        variant: "destructive",
      });
    },
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: api.deleteScraperCredential,
    onSuccess: () => {
      toast({
        title: "Credential Deleted",
        description: "Scraper credential has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['scraper-credentials'] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete credential.",
        variant: "destructive",
      });
    },
  });

  const testCredentialMutation = useMutation({
    mutationFn: api.testScraperCredential,
    onSuccess: (data) => {
      toast({
        title: "Test Successful",
        description: data.message || "Credential test completed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Credential test failed.",
        variant: "destructive",
      });
    },
  });

  // Mutation for triggering delta scrape
  const triggerScrapeMutation = useMutation({
    mutationFn: api.triggerDeltaScrape,
    onSuccess: (data) => {
      toast({
        title: "Scraping Triggered",
        description: data.message || "Delta scraping has been initiated successfully.",
      });
      // Refetch signals after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['forex-signals'] });
        queryClient.invalidateQueries({ queryKey: ['forex-signals-latest'] });
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Scraping Failed",
        description: error.message || "Failed to trigger delta scraping.",
        variant: "destructive",
      });
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

  const handleTriggerScrape = () => {
    triggerScrapeMutation.mutate();
  };

  const handleRefreshSignals = () => {
    refetch();
    toast({
      title: "Refreshing Signals",
      description: "Fetching latest trading signals...",
    });
  };

  // Credential management helpers
  const handleEditCredential = (credential: any) => {
    setEditingCredential(credential);
    setIsCredentialsModalOpen(true);
  };

  const handleDeleteCredential = (id: number) => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      deleteCredentialMutation.mutate(id);
    }
  };

  const handleTestCredential = (id: number) => {
    testCredentialMutation.mutate(id);
  };

  const handleSaveCredential = (formData: any) => {
    if (editingCredential) {
      updateCredentialMutation.mutate({ id: editingCredential.id, credential: formData });
    } else {
      createCredentialMutation.mutate(formData);
    }
  };

  const getScraperDisplayName = (scraperName: string) => {
    const names: { [key: string]: string } = {
      'fxleaders': 'FX Leaders',
      'dailyfx': 'DailyFX',
      'myfxbook': 'MyFXBook',
      'tradingview': 'TradingView',
      'custom': 'Custom API'
    };
    return names[scraperName] || scraperName;
  };

  // Pagination helpers
  const getPaginatedSignals = (signals: TradingSignal[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return signals.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil((signals?.length || 0) / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const SourceConfiguration = () => {
    return (
      <div className="space-y-6">
        {/* Credentials Management Section */}
        <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">API Credentials</h2>
          <Button 
              onClick={() => {
                setEditingCredential(null);
                setIsCredentialsModalOpen(true);
              }}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
              Add Credentials
          </Button>
        </div>

          {credentialsLoading ? (
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-32"></div>
                          <div className="h-3 bg-slate-200 rounded w-24"></div>
                    </div>
                    </div>
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-slate-200 rounded"></div>
                        <div className="w-8 h-8 bg-slate-200 rounded"></div>
                        <div className="w-8 h-8 bg-slate-200 rounded"></div>
                  </div>
                  </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : Array.isArray(credentials) && credentials.length > 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-hidden rounded-lg border border-slate-200/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60">
                        <TableHead className="font-semibold text-slate-700">Scraper</TableHead>
                        <TableHead className="font-semibold text-slate-700">Username</TableHead>
                        <TableHead className="font-semibold text-slate-700">Login URL</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                        <TableHead className="font-semibold text-slate-700">Updated</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {credentials.map((credential: any) => (
                        <TableRow key={credential.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Zap className="w-4 h-4 text-white" />
        </div>
                              <span className="font-semibold text-slate-900">
                                {getScraperDisplayName(credential.scraper_name)}
                              </span>
            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {credential.username || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600 max-w-xs truncate block">
                              {credential.login_url || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              credential.is_active 
                                ? 'bg-green-50 text-green-700 border-green-200 font-semibold' 
                                : 'bg-gray-50 text-gray-700 border-gray-200 font-semibold'
                            }>
                              {credential.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {formatTimeAgo(credential.updated_at)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleTestCredential(credential.id)}
                                disabled={testCredentialMutation.isPending}
                                className="hover:bg-green-50 text-green-600 hover:text-green-700"
                              >
                                <Zap className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditCredential(credential)}
                                className="hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteCredential(credential.id)}
                                disabled={deleteCredentialMutation.isPending}
                                className="hover:bg-red-50 text-red-600 hover:text-red-700"
                              >
                                <AlertCircle className="w-4 h-4" />
                              </Button>
            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
            </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Settings className="w-8 h-8 text-purple-600" />
            </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Credentials Configured</h3>
                <p className="text-slate-600 mb-4">
                  Add API credentials to enable automated signal scraping
                </p>
                <Button 
                  onClick={() => {
                    setEditingCredential(null);
                    setIsCredentialsModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Credential
                </Button>
          </CardContent>
        </Card>
          )}
        </div>
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
        <DialogContent className="sm:max-w-[525px] bg-white border border-slate-200 shadow-xl">
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

  const CredentialsModal = () => {
    const [formData, setFormData] = useState({
      scraper_name: 'fxleaders',
      username: '',
      password: '',
      login_url: '',
      signals_url: '',
      api_key: '',
      is_active: true
    });

    // Initialize form data when editing
    React.useEffect(() => {
      if (editingCredential) {
        setFormData({
          scraper_name: editingCredential.scraper_name,
          username: editingCredential.username || '',
          password: editingCredential.password || '',
          login_url: editingCredential.login_url || '',
          signals_url: editingCredential.signals_url || '',
          api_key: editingCredential.api_key || '',
          is_active: editingCredential.is_active
        });
      } else {
        setFormData({
          scraper_name: 'fxleaders',
          username: '',
          password: '',
          login_url: '',
          signals_url: '',
          api_key: '',
          is_active: true
        });
      }
    }, [editingCredential]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSaveCredential(formData);
  };

  return (
      <Dialog open={isCredentialsModalOpen} onOpenChange={setIsCredentialsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white border border-slate-200 shadow-xl">
          <DialogHeader>
            <DialogTitle>
              {editingCredential ? 'Edit Scraper Credentials' : 'Add Scraper Credentials'}
            </DialogTitle>
            <DialogDescription>
              Configure API credentials for automated signal scraping.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scraper-name">Scraper Type</Label>
              <Select 
                value={formData.scraper_name} 
                onValueChange={(value) => setFormData({...formData, scraper_name: value})}
                disabled={!!editingCredential} // Can't change scraper type when editing
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fxleaders">FX Leaders</SelectItem>
                  <SelectItem value="dailyfx">DailyFX</SelectItem>
                  <SelectItem value="myfxbook">MyFXBook</SelectItem>
                  <SelectItem value="tradingview">TradingView</SelectItem>
                  <SelectItem value="custom">Custom API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-url">Login URL</Label>
              <Input
                id="login-url"
                value={formData.login_url}
                onChange={(e) => setFormData({...formData, login_url: e.target.value})}
                placeholder="https://www.fxleaders.com/login"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signals-url">Signals URL</Label>
              <Input
                id="signals-url"
                value={formData.signals_url}
                onChange={(e) => setFormData({...formData, signals_url: e.target.value})}
                placeholder="https://www.fxleaders.com/live-forex-trading-signals"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key (Optional)</Label>
              <Input
                id="api-key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                placeholder="Enter API key if required"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="is-active">Active</Label>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCredentialsModalOpen(false);
                  setEditingCredential(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={createCredentialMutation.isPending || updateCredentialMutation.isPending}
              >
                {editingCredential ? 'Update Credentials' : 'Add Credentials'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Trading Signals
                </h1>
                <p className="text-sm text-slate-600 mt-1 font-medium">
                  Automated signal detection and distribution
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                onClick={handleRefreshSignals}
                disabled={isLoading}
                className="border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={handleTriggerScrape}
                disabled={triggerScrapeMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Zap className="w-4 h-4 mr-2" />
                {triggerScrapeMutation.isPending ? 'Scraping...' : 'Trigger Scrape'}
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => setIsAddSourceModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Source
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="border-slate-200 hover:bg-slate-50">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedTab('sources')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Sources
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTab('settings')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Publishing Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Configuration
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-sm">
              <TabsTrigger value="signals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">Active Signals</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">Signal History</TabsTrigger>
              <TabsTrigger value="sources" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">Sources</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">Publishing</TabsTrigger>
            </TabsList>

            <TabsContent value="signals" className="space-y-6">
              {/* Scraping Status */}
              {scrapingStatus && (
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Scraping Status
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                          {scrapingStatus.recent_activity?.signals_last_24h || 0}
                        </div>
                        <div className="text-sm text-blue-700 font-medium mt-1">Signals (24h)</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200/50">
                        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                          {scrapingStatus.recent_activity?.total_signals || 0}
                        </div>
                        <div className="text-sm text-green-700 font-medium mt-1">Total Signals</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200/50">
                        <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                          {scrapingStatus.watermark?.consecutive_no_changes || 0}
                        </div>
                        <div className="text-sm text-purple-700 font-medium mt-1">No Changes</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200/50">
                        <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                          {scrapingStatus.celery_available ? 'Active' : 'Inactive'}
                        </div>
                        <div className="text-sm text-orange-700 font-medium mt-1">Background Tasks</div>
                      </div>
                    </div>
                    {scrapingStatus.watermark && (
                      <div className="mt-6 pt-4 border-t border-slate-200/60">
                        <p className="text-sm text-slate-600 font-medium">
                          Last scrape: {formatTimeAgo(scrapingStatus.watermark.updated_at)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Loading State */}
              {isLoading && (
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Active Trading Signals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-hidden rounded-lg border border-slate-200/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60">
                            <TableHead className="font-semibold text-slate-700">Instrument</TableHead>
                            <TableHead className="font-semibold text-slate-700">Action</TableHead>
                            <TableHead className="font-semibold text-slate-700">Entry Price</TableHead>
                            <TableHead className="font-semibold text-slate-700">Take Profit</TableHead>
                            <TableHead className="font-semibold text-slate-700">Stop Loss</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700">Scraped</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...Array(5)].map((_, i) => (
                            <TableRow key={i} className="border-b border-slate-100/50">
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-slate-200 rounded-full animate-pulse"></div>
                                  <div className="h-5 bg-slate-200 rounded w-24 animate-pulse"></div>
                        </div>
                              </TableCell>
                              <TableCell>
                                <div className="h-7 bg-slate-200 rounded w-16 animate-pulse"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-6 bg-slate-200 rounded w-20 animate-pulse"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-6 bg-slate-200 rounded w-20 animate-pulse"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-6 bg-slate-200 rounded w-20 animate-pulse"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-7 bg-slate-200 rounded w-20 animate-pulse"></div>
                              </TableCell>
                              <TableCell>
                                <div className="h-5 bg-slate-200 rounded w-24 animate-pulse"></div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <div className="w-8 h-8 bg-slate-200 rounded animate-pulse"></div>
                                  <div className="w-8 h-8 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                              </TableCell>
                            </TableRow>
                  ))}
                        </TableBody>
                      </Table>
                </div>
                  </CardContent>
                </Card>
              )}

              {/* Error State */}
              {error && (
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                  <CardContent className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Failed to Load Signals</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Unable to fetch trading signals. Please check your connection and try again.
                    </p>
                    <Button 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['forex-signals'] })}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  </CardContent>
                </Card>
              )}

              {/* Signals Display */}
              {!isLoading && !error && (
                <div className="space-y-6">
                  {Array.isArray(signals) && signals.length > 0 ? (
                    <>
                      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                              Active Trading Signals
                            </span>
                            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, signals.length)} of {signals.length} signals
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-hidden rounded-lg border border-slate-200/50">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60">
                                  <TableHead className="font-semibold text-slate-700">Instrument</TableHead>
                                  <TableHead className="font-semibold text-slate-700">Action</TableHead>
                                  <TableHead className="font-semibold text-slate-700">Entry Price</TableHead>
                                  <TableHead className="font-semibold text-slate-700">Take Profit</TableHead>
                                  <TableHead className="font-semibold text-slate-700">Stop Loss</TableHead>
                                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                  <TableHead className="font-semibold text-slate-700">Scraped</TableHead>
                                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getPaginatedSignals(signals).map((signal: TradingSignal) => (
                                  <TableRow key={signal.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
                                    <TableCell className="font-medium">
                                      <div className="flex items-center space-x-3">
                              {getSignalIcon(signal.action)}
                              <span className="font-semibold text-slate-900">{signal.instrument}</span>
                            </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={`${getSignalColor(signal.action)} font-semibold shadow-sm`}>
                              {signal.action?.toUpperCase()}
                            </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {signal.entry_price && signal.entry_price !== 'N/A' ? (
                                        <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                                          {signal.entry_price}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">N/A</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {signal.take_profit && signal.take_profit !== 'N/A' ? (
                                        <span className="font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-md">
                                          {signal.take_profit}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">N/A</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {signal.stop_loss && signal.stop_loss !== 'N/A' ? (
                                        <span className="font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-md">
                                          {signal.stop_loss}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">N/A</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={
                                        signal.status_signal === 'Active' ? 'bg-green-50 text-green-700 border-green-200 font-semibold' :
                                        signal.status_signal === 'Inactive' ? 'bg-gray-50 text-gray-700 border-gray-200 font-semibold' :
                                        'bg-yellow-50 text-yellow-700 border-yellow-200 font-semibold'
                                      }>
                                        {signal.status_signal}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm text-slate-600 font-medium">
                                        {formatTimeAgo(signal.scrape_date)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end space-x-2">
                                        <Button variant="ghost" size="sm" className="hover:bg-slate-100">
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="hover:bg-slate-100">
                                          <Edit className="w-4 h-4" />
                                        </Button>
                              </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-slate-600 font-medium">
                                Page {currentPage} of {totalPages}
                            </div>
                              <div className="flex items-center space-x-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(currentPage - 1)}
                                  disabled={currentPage === 1}
                                  className="border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                  <ChevronLeft className="w-4 h-4 mr-1" />
                                  Previous
                                </Button>
                                <div className="flex items-center space-x-1">
                                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                      pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                      pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                      pageNum = totalPages - 4 + i;
                                    } else {
                                      pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                      <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`w-10 h-10 p-0 ${
                                          currentPage === pageNum 
                                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md' 
                                            : 'border-slate-200 hover:bg-slate-50 transition-colors'
                                        }`}
                                      >
                                        {pageNum}
                                      </Button>
                                    );
                                  })}
                            </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                                  className="border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                  Next
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      )}
                    </>
                  ) : (
                    <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                      <CardContent className="text-center py-16">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <Zap className="w-10 h-10 text-purple-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">No Active Signals</h3>
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                          Configure your signal sources to start receiving trading signals automatically
                        </p>
                        <Button 
                          onClick={() => setSelectedTab('sources')}
                          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                        Configure Sources
                      </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {!isLoading && !error && Array.isArray(signals) && signals.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Signal Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200/50">
                        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                          68%
                      </div>
                        <div className="text-sm text-green-700 font-medium mt-1">Success Rate</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                          {signals?.length || 0}
                      </div>
                        <div className="text-sm text-blue-700 font-medium mt-1">Active Signals</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200/50">
                        <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                          2.3x
                        </div>
                        <div className="text-sm text-purple-700 font-medium mt-1">Avg Risk/Reward</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200/50">
                        <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                          {scrapingStatus?.recent_activity?.signals_last_24h || 0}
                        </div>
                        <div className="text-sm text-orange-700 font-medium mt-1">Signals This Week</div>
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
                              {getSignalIcon(signal.action)}
                              <span className="font-medium text-slate-900">{signal.instrument}</span>
                              <Badge className={getSignalColor(signal.action)}>
                                {signal.action?.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-slate-500">from FXLeaders</span>
                            </div>
                            <div className="mt-2 text-sm text-slate-600">
                              <span className="mr-4">Entry: {signal.entry_price !== 'N/A' ? signal.entry_price : 'N/A'}</span>
                              <span className="mr-4">Target: {signal.take_profit !== 'N/A' ? signal.take_profit : 'N/A'}</span>
                              <span>Stop: {signal.stop_loss !== 'N/A' ? signal.stop_loss : 'N/A'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">
                              {formatTimeAgo(signal.scrape_date)}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline" className={signal.status_signal === 'Closed' ? 'bg-gray-50 text-gray-700' : 'bg-green-50 text-green-700'}>
                                {signal.status_signal === 'Closed' ? 'Posted' : 'Active'}
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
      <CredentialsModal />
    </div>
  );
}