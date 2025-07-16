import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Edit, Trash2, Check, X, ExternalLink, Database, Users, Clock, TestTube, Activity } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface DataSource {
  id: string;
  name: string;
  type: 'economic' | 'market' | 'trading';
  url: string;
  scrapingConfig: any;
  dataFormat: any;
  status: 'active' | 'inactive' | 'error';
  lastUpdated: Date | null;
  createdAt: Date;
}

interface PlatformAccount {
  id: string;
  platform: 'telegram' | 'twitter' | 'discord' | 'website';
  accountName: string;
  displayName: string;
  credentials: any;
  status: 'active' | 'inactive' | 'error';
  rateLimits: any;
  lastUsed: Date | null;
  createdAt: Date;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('data-sources');
  const [editingDataSource, setEditingDataSource] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [showDataSourceForm, setShowDataSourceForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [connectionTesting, setConnectionTesting] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Data sources queries
  const { data: dataSources = [], isLoading: loadingSources } = useQuery({
    queryKey: ['/api/data-sources'],
    queryFn: () => apiRequest('/api/data-sources')
  });

  const { data: platformAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['/api/platform-accounts'],
    queryFn: () => apiRequest('/api/platform-accounts')
  });

  // Mutations
  const createDataSourceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/data-sources', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
      setShowDataSourceForm(false);
    }
  });

  const updateDataSourceMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/data-sources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
      setEditingDataSource(null);
    }
  });

  const deleteDataSourceMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/data-sources/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
    }
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/platform-accounts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-accounts'] });
      setShowAccountForm(false);
    }
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/platform-accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-accounts'] });
      setEditingAccount(null);
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/platform-accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-accounts'] });
    }
  });

  const testConnection = async (sourceId: string) => {
    setConnectionTesting(sourceId);
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setConnectionTesting(null);
  };

  const DataSourceForm = ({ source, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState({
      id: source?.id || `source_${Date.now()}`,
      name: source?.name || '',
      type: source?.type || 'economic',
      url: source?.url || '',
      scrapingConfig: source?.scrapingConfig || {
        method: 'scraping',
        headers: {},
        selectors: {
          container: '',
          title: '',
          time: '',
          impact: '',
          currency: ''
        },
        rate_limit: 60,
        retry_attempts: 3
      },
      dataFormat: source?.dataFormat || {
        fields: [],
        timestamp_field: 'time',
        update_frequency: 'hourly'
      },
      status: source?.status || 'active'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{source ? 'Edit Data Source' : 'Add Data Source'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Source Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ForexFactory Economic Calendar"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economic">Economic Calendar</SelectItem>
                    <SelectItem value="market">Market News</SelectItem>
                    <SelectItem value="trading">Trading Signals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="url">Source URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://www.forexfactory.com/calendar"
                required
              />
            </div>

            <div>
              <Label htmlFor="method">Scraping Method</Label>
              <Select 
                value={formData.scrapingConfig.method} 
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  scrapingConfig: { ...formData.scrapingConfig, method: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scraping">Web Scraping</SelectItem>
                  <SelectItem value="api">REST API</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scrapingConfig.method === 'scraping' && (
              <div className="space-y-3">
                <Label>CSS Selectors</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Container selector"
                    value={formData.scrapingConfig.selectors.container}
                    onChange={(e) => setFormData({
                      ...formData,
                      scrapingConfig: {
                        ...formData.scrapingConfig,
                        selectors: { ...formData.scrapingConfig.selectors, container: e.target.value }
                      }
                    })}
                  />
                  <Input
                    placeholder="Title selector"
                    value={formData.scrapingConfig.selectors.title}
                    onChange={(e) => setFormData({
                      ...formData,
                      scrapingConfig: {
                        ...formData.scrapingConfig,
                        selectors: { ...formData.scrapingConfig.selectors, title: e.target.value }
                      }
                    })}
                  />
                  <Input
                    placeholder="Time selector"
                    value={formData.scrapingConfig.selectors.time}
                    onChange={(e) => setFormData({
                      ...formData,
                      scrapingConfig: {
                        ...formData.scrapingConfig,
                        selectors: { ...formData.scrapingConfig.selectors, time: e.target.value }
                      }
                    })}
                  />
                  <Input
                    placeholder="Impact selector"
                    value={formData.scrapingConfig.selectors.impact}
                    onChange={(e) => setFormData({
                      ...formData,
                      scrapingConfig: {
                        ...formData.scrapingConfig,
                        selectors: { ...formData.scrapingConfig.selectors, impact: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {source ? 'Update' : 'Create'} Source
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  const PlatformAccountForm = ({ account, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState({
      id: account?.id || `account_${Date.now()}`,
      platform: account?.platform || 'telegram',
      accountName: account?.accountName || '',
      displayName: account?.displayName || '',
      credentials: account?.credentials || {},
      status: account?.status || 'active',
      rateLimits: account?.rateLimits || {
        posts_per_hour: 10,
        posts_per_day: 100,
        character_limit: 4096
      }
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    const renderCredentialFields = () => {
      switch (formData.platform) {
        case 'telegram':
          return (
            <>
              <div>
                <Label htmlFor="bot_token">Bot Token</Label>
                <Input
                  id="bot_token"
                  type="password"
                  value={formData.credentials.bot_token || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    credentials: { ...formData.credentials, bot_token: e.target.value }
                  })}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                />
              </div>
              <div>
                <Label htmlFor="chat_id">Chat ID</Label>
                <Input
                  id="chat_id"
                  value={formData.credentials.chat_id || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    credentials: { ...formData.credentials, chat_id: e.target.value }
                  })}
                  placeholder="-1001234567890"
                />
              </div>
            </>
          );
        case 'twitter':
          return (
            <>
              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.credentials.api_key || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    credentials: { ...formData.credentials, api_key: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="api_secret">API Secret</Label>
                <Input
                  id="api_secret"
                  type="password"
                  value={formData.credentials.api_secret || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    credentials: { ...formData.credentials, api_secret: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="access_token">Access Token</Label>
                <Input
                  id="access_token"
                  type="password"
                  value={formData.credentials.access_token || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    credentials: { ...formData.credentials, access_token: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="access_token_secret">Access Token Secret</Label>
                <Input
                  id="access_token_secret"
                  type="password"
                  value={formData.credentials.access_token_secret || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    credentials: { ...formData.credentials, access_token_secret: e.target.value }
                  })}
                />
              </div>
            </>
          );
        case 'discord':
          return (
            <div>
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <Input
                id="webhook_url"
                value={formData.credentials.webhook_url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, webhook_url: e.target.value }
                })}
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
          );
        case 'website':
          return (
            <>
              <div>
                <Label htmlFor="api_endpoint">API Endpoint</Label>
                <Input
                  id="api_endpoint"
                  value={formData.credentials.api_endpoint || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    credentials: { ...formData.credentials, api_endpoint: e.target.value }
                  })}
                  placeholder="https://yoursite.com/api/posts"
                />
              </div>
              <div>
                <Label htmlFor="auth_header">Authorization Header</Label>
                <Input
                  id="auth_header"
                  type="password"
                  value={formData.credentials.auth_header || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    credentials: { ...formData.credentials, auth_header: e.target.value }
                  })}
                  placeholder="Bearer your-api-key"
                />
              </div>
            </>
          );
        default:
          return null;
      }
    };

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{account ? 'Edit Platform Account' : 'Add Platform Account'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="discord">Discord</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="my_trading_bot"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Trading Signals Bot"
                required
              />
            </div>

            {renderCredentialFields()}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="posts_per_hour">Posts/Hour</Label>
                <Input
                  id="posts_per_hour"
                  type="number"
                  value={formData.rateLimits.posts_per_hour}
                  onChange={(e) => setFormData({
                    ...formData,
                    rateLimits: { ...formData.rateLimits, posts_per_hour: parseInt(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="posts_per_day">Posts/Day</Label>
                <Input
                  id="posts_per_day"
                  type="number"
                  value={formData.rateLimits.posts_per_day}
                  onChange={(e) => setFormData({
                    ...formData,
                    rateLimits: { ...formData.rateLimits, posts_per_day: parseInt(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="character_limit">Character Limit</Label>
                <Input
                  id="character_limit"
                  type="number"
                  value={formData.rateLimits.character_limit}
                  onChange={(e) => setFormData({
                    ...formData,
                    rateLimits: { ...formData.rateLimits, character_limit: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {account ? 'Update' : 'Create'} Account
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
                <p className="text-sm text-slate-600 mt-1">Manage data sources, platform accounts, and automation settings</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="data-sources" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Data Sources
              </TabsTrigger>
              <TabsTrigger value="platform-accounts" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Platform Accounts
              </TabsTrigger>
              <TabsTrigger value="scheduling" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Scheduling
              </TabsTrigger>
            </TabsList>

            <TabsContent value="data-sources" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Data Sources</h2>
                  <p className="text-sm text-slate-600 mt-1">Configure external data sources for content generation</p>
                </div>
                <Button onClick={() => setShowDataSourceForm(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Source
                </Button>
              </div>

              {showDataSourceForm && (
                <DataSourceForm
                  onSave={(data: any) => createDataSourceMutation.mutate(data)}
                  onCancel={() => setShowDataSourceForm(false)}
                />
              )}

              <div className="grid gap-4">
                {loadingSources ? (
                  <div className="text-center py-8">Loading data sources...</div>
                ) : dataSources.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No data sources configured</h3>
                      <p className="text-slate-600 mb-4">Add your first data source to start collecting content data</p>
                      <Button onClick={() => setShowDataSourceForm(true)}>
                        Add Data Source
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  dataSources.map((source: DataSource) => (
                    <Card key={source.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {source.name}
                              <Badge variant={source.status === 'active' ? 'default' : 'secondary'}>
                                {source.status}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-1">
                              <span className="capitalize">{source.type}</span>
                              <span>•</span>
                              <span>{source.url}</span>
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testConnection(source.id)}
                              disabled={connectionTesting === source.id}
                            >
                              {connectionTesting === source.id ? (
                                <Activity className="w-4 h-4 animate-spin" />
                              ) : (
                                <TestTube className="w-4 h-4" />
                              )}
                              Test
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingDataSource(source.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteDataSourceMutation.mutate(source.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {source.lastUpdated && (
                        <CardContent>
                          <p className="text-sm text-slate-600">
                            Last updated: {new Date(source.lastUpdated).toLocaleString()}
                          </p>
                        </CardContent>
                      )}
                      {editingDataSource === source.id && (
                        <CardContent>
                          <DataSourceForm
                            source={source}
                            onSave={(data: any) => updateDataSourceMutation.mutate({ id: source.id, ...data })}
                            onCancel={() => setEditingDataSource(null)}
                          />
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="platform-accounts" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Platform Accounts</h2>
                  <p className="text-sm text-slate-600 mt-1">Manage social media and publishing platform accounts</p>
                </div>
                <Button onClick={() => setShowAccountForm(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Account
                </Button>
              </div>

              {showAccountForm && (
                <PlatformAccountForm
                  onSave={(data: any) => createAccountMutation.mutate(data)}
                  onCancel={() => setShowAccountForm(false)}
                />
              )}

              <div className="grid gap-4">
                {loadingAccounts ? (
                  <div className="text-center py-8">Loading platform accounts...</div>
                ) : platformAccounts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No platform accounts configured</h3>
                      <p className="text-slate-600 mb-4">Add platform accounts to start publishing content</p>
                      <Button onClick={() => setShowAccountForm(true)}>
                        Add Platform Account
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  Object.entries(
                    platformAccounts.reduce((acc: any, account: PlatformAccount) => {
                      if (!acc[account.platform]) acc[account.platform] = [];
                      acc[account.platform].push(account);
                      return acc;
                    }, {})
                  ).map(([platform, accounts]: [string, any]) => (
                    <Card key={platform}>
                      <CardHeader>
                        <CardTitle className="capitalize">{platform} Accounts</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {accounts.map((account: PlatformAccount) => (
                          <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{account.displayName}</span>
                                <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                                  {account.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">{account.accountName}</p>
                              {account.lastUsed && (
                                <p className="text-xs text-slate-500">
                                  Last used: {new Date(account.lastUsed).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingAccount(account.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteAccountMutation.mutate(account.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                      {editingAccount && accounts.find((a: PlatformAccount) => a.id === editingAccount) && (
                        <CardContent>
                          <PlatformAccountForm
                            account={accounts.find((a: PlatformAccount) => a.id === editingAccount)}
                            onSave={(data: any) => updateAccountMutation.mutate({ id: editingAccount, ...data })}
                            onCancel={() => setEditingAccount(null)}
                          />
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="scheduling" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Schedule Configuration</h2>
                <p className="text-sm text-slate-600 mt-1">Configure automation schedules and posting times</p>
              </div>

              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Schedule configuration coming soon</h3>
                  <p className="text-slate-600">This section will contain global scheduling settings and automation rules</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}