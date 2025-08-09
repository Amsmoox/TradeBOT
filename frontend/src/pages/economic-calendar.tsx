import { useState } from 'react';
import { Calendar, Settings, Play, Pause, Filter, Eye, Target, Send, Plus, Edit, Trash2, TrendingUp, AlertCircle, Globe, Clock, ChevronLeft, ChevronRight, RefreshCw, BarChart3, Zap } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataSource {
  id: string;
  name: string;
  type: string;
  url: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdated: Date | null;
}

interface PlatformAccount {
  id: string;
  platform: string;
  accountName: string;
  displayName: string;
  status: 'active' | 'inactive' | 'error';
  rateLimits: any;
}

interface PostingRule {
  id: string;
  name: string;
  triggerConditions: any;
  targetAccounts: any[];
  enabled: boolean;
}

interface EconomicEvent {
  id: number;
  title: string;
  country: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  currency: string;
  expected: string | null;
  previous: string | null;
  actual: string | null;
  time: Date;
  processed: boolean;
}

export default function EconomicCalendar() {
  const [activeLayer, setActiveLayer] = useState('sources');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [treatmentConfig, setTreatmentConfig] = useState({
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
    },
    quality_control: {
      min_data_completeness: 80,
      require_expected_values: true,
      blacklist_keywords: []
    }
  });
  const [showRuleForm, setShowRuleForm] = useState(false);

  const queryClient = useQueryClient();

  // Mock data for demonstration
  const mockEconomicEvents = [
    {
      id: 1,
      title: "US Non-Farm Payrolls",
      country: "United States",
      impact: "HIGH" as const,
      currency: "USD",
      expected: "185K",
      previous: "173K",
      actual: null,
      time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      processed: false
    },
    {
      id: 2,
      title: "ECB Interest Rate Decision",
      country: "Eurozone",
      impact: "HIGH" as const,
      currency: "EUR",
      expected: "4.50%",
      previous: "4.50%",
      actual: null,
      time: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      processed: false
    },
    {
      id: 3,
      title: "UK CPI Inflation",
      country: "United Kingdom",
      impact: "MEDIUM" as const,
      currency: "GBP",
      expected: "4.2%",
      previous: "4.6%",
      actual: null,
      time: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      processed: false
    },
    {
      id: 4,
      title: "Bank of Japan Policy Rate",
      country: "Japan",
      impact: "HIGH" as const,
      currency: "JPY",
      expected: "-0.10%",
      previous: "-0.10%",
      actual: null,
      time: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
      processed: false
    },
    {
      id: 5,
      title: "Canadian Employment Change",
      country: "Canada",
      impact: "MEDIUM" as const,
      currency: "CAD",
      expected: "15K",
      previous: "25K",
      actual: null,
      time: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
      processed: false
    }
  ];

  // Queries
  const { data: dataSources = [] } = useQuery({
    queryKey: ['/api/data-sources'],
    queryFn: () => apiRequest('/api/data-sources')
  });

  const { data: platformAccounts = [] } = useQuery({
    queryKey: ['/api/platform-accounts'],
    queryFn: () => apiRequest('/api/platform-accounts')
  });

  const { data: postingRules = [] } = useQuery({
    queryKey: ['/api/posting-rules', 'economic'],
    queryFn: () => apiRequest('/api/posting-rules?moduleType=economic')
  });

  const { data: economicEvents = mockEconomicEvents } = useQuery({
    queryKey: ['/api/economic-events/today'],
    queryFn: () => apiRequest('/api/economic-events/today')
  });

  const { data: economicConfig } = useQuery({
    queryKey: ['/api/economic-config'],
    queryFn: () => apiRequest('/api/economic-config')
  });

  // Mutations
  const saveConfigMutation = useMutation({
    mutationFn: (config: any) => {
      if (economicConfig) {
        return apiRequest('/api/economic-config', { method: 'PUT', body: JSON.stringify(config) });
      } else {
        return apiRequest('/api/economic-config', { method: 'POST', body: JSON.stringify(config) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/economic-config'] });
    }
  });

  const createPostingRuleMutation = useMutation({
    mutationFn: (rule: any) => apiRequest('/api/posting-rules', { method: 'POST', body: JSON.stringify(rule) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posting-rules', 'economic'] });
      setShowRuleForm(false);
    }
  });

  const deletePostingRuleMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/posting-rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posting-rules', 'economic'] });
    }
  });

  const saveConfiguration = () => {
    const config = {
      sourceConfig: {
        selected_sources: selectedSources,
        scraping_schedule: {
          frequency: 'every_5_minutes',
          active_hours: { start: '08:00', end: '18:00', timezone: 'UTC' }
        }
      },
      treatmentConfig,
      postingConfig: {
        posting_rules: postingRules.map((rule: PostingRule) => rule.id)
      },
      enabled: true
    };
    saveConfigMutation.mutate(config);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatEventTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const PostingRuleForm = ({ onSave, onCancel }: any) => {
    const [ruleData, setRuleData] = useState({
      id: `rule_${Date.now()}`,
      moduleType: 'economic',
      name: '',
      triggerConditions: {
        impact_levels: ['HIGH'],
        currencies: ['USD', 'EUR'],
        time_conditions: {
          advance_notice: 30,
          result_delay: 15
        }
      },
      targetAccounts: [] as any[],
      enabled: true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(ruleData);
    };

    return (
      <Card className="mt-4 bg-white border border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle>Create Posting Rule</CardTitle>
          <CardDescription>Define when and where to post economic calendar content</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="ruleName">Rule Name</Label>
              <Input
                id="ruleName"
                value={ruleData.name}
                onChange={(e) => setRuleData({ ...ruleData, name: e.target.value })}
                placeholder="High Impact USD Events"
                required
              />
            </div>

            <div>
              <Label>Impact Levels</Label>
              <div className="flex gap-2 mt-2">
                {['HIGH', 'MEDIUM', 'LOW'].map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={level}
                      checked={ruleData.triggerConditions.impact_levels.includes(level)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRuleData({
                            ...ruleData,
                            triggerConditions: {
                              ...ruleData.triggerConditions,
                              impact_levels: [...ruleData.triggerConditions.impact_levels, level]
                            }
                          });
                        } else {
                          setRuleData({
                            ...ruleData,
                            triggerConditions: {
                              ...ruleData.triggerConditions,
                              impact_levels: ruleData.triggerConditions.impact_levels.filter((l: string) => l !== level)
                            }
                          });
                        }
                      }}
                    />
                    <Label htmlFor={level}>{level}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Currencies</Label>
              <div className="flex gap-2 mt-2">
                {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'].map((currency) => (
                  <div key={currency} className="flex items-center space-x-2">
                    <Checkbox
                      id={currency}
                      checked={ruleData.triggerConditions.currencies.includes(currency)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRuleData({
                            ...ruleData,
                            triggerConditions: {
                              ...ruleData.triggerConditions,
                              currencies: [...ruleData.triggerConditions.currencies, currency]
                            }
                          });
                        } else {
                          setRuleData({
                            ...ruleData,
                            triggerConditions: {
                              ...ruleData.triggerConditions,
                              currencies: ruleData.triggerConditions.currencies.filter((c: string) => c !== currency)
                            }
                          });
                        }
                      }}
                    />
                    <Label htmlFor={currency}>{currency}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="advance_notice">Advance Notice (minutes)</Label>
                <Input
                  id="advance_notice"
                  type="number"
                  value={ruleData.triggerConditions.time_conditions.advance_notice}
                  onChange={(e) => setRuleData({
                    ...ruleData,
                    triggerConditions: {
                      ...ruleData.triggerConditions,
                      time_conditions: {
                        ...ruleData.triggerConditions.time_conditions,
                        advance_notice: parseInt(e.target.value)
                      }
                    }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="result_delay">Result Delay (minutes)</Label>
                <Input
                  id="result_delay"
                  type="number"
                  value={ruleData.triggerConditions.time_conditions.result_delay}
                  onChange={(e) => setRuleData({
                    ...ruleData,
                    triggerConditions: {
                      ...ruleData.triggerConditions,
                      time_conditions: {
                        ...ruleData.triggerConditions.time_conditions,
                        result_delay: parseInt(e.target.value)
                      }
                    }
                  })}
                />
              </div>
            </div>

            <div>
              <Label>Target Accounts</Label>
              <div className="mt-2 space-y-2">
                {platformAccounts.map((account: PlatformAccount) => (
                  <div key={account.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={account.id}
                      checked={ruleData.targetAccounts.some((ta: any) => ta.platform_account_id === account.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRuleData({
                            ...ruleData,
                            targetAccounts: [...ruleData.targetAccounts, {
                              platform_account_id: account.id,
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
                              schedule_config: {
                                timing: 'immediate'
                              },
                              enabled: true
                            }]
                          });
                        } else {
                          setRuleData({
                            ...ruleData,
                            targetAccounts: ruleData.targetAccounts.filter((ta: any) => ta.platform_account_id !== account.id)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={account.id} className="flex items-center gap-2">
                      <Badge variant="outline">{account.platform}</Badge>
                      {account.displayName}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                Create Rule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  const economicSources = dataSources.filter((source: DataSource) => source.type === 'economic');
  const filteredEvents = economicEvents.filter((event: EconomicEvent) => {
    const matchesCurrency = treatmentConfig.filters.currencies.includes(event.currency);
    const matchesImpact = treatmentConfig.filters.impact_levels.includes(event.impact);
    return matchesCurrency && matchesImpact;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Economic Calendar
                </h1>
                <p className="text-sm text-slate-600 mt-1 font-medium">
                  Automated economic news posting with AI-powered content generation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                className="border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Badge variant={economicConfig?.enabled ? 'default' : 'secondary'} className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                {economicConfig?.enabled ? 'Active' : 'Inactive'}
              </Badge>
              <Button 
                onClick={saveConfiguration} 
                disabled={saveConfigMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Zap className="w-4 h-4 mr-2" />
                {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Tabs value={activeLayer} onValueChange={setActiveLayer} className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-sm">
              <TabsTrigger value="sources" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                <Settings className="w-4 h-4 mr-2" />
                Sources
              </TabsTrigger>
              <TabsTrigger value="treatment" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                <Filter className="w-4 h-4 mr-2" />
                Treatment
              </TabsTrigger>
              <TabsTrigger value="posting" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                <Send className="w-4 h-4 mr-2" />
                Posting
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sources" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Data Sources</h2>
                <p className="text-sm text-slate-600 mb-4">Select and configure economic calendar data sources</p>
              </div>

              <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                <CardHeader>
                  <CardTitle>Available Sources</CardTitle>
                  <CardDescription>Choose from configured economic calendar sources</CardDescription>
                </CardHeader>
                <CardContent>
                  {economicSources.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No economic sources configured</h3>
                      <p className="text-slate-600 mb-4">Configure economic calendar sources in Settings to begin data collection</p>
                      <Button variant="outline">
                        Go to Settings
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {economicSources.map((source: DataSource) => (
                        <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedSources.includes(source.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSources([...selectedSources, source.id]);
                                } else {
                                  setSelectedSources(selectedSources.filter(id => id !== source.id));
                                }
                              }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{source.name}</h4>
                                <Badge variant={source.status === 'active' ? 'default' : 'secondary'}>
                                  {source.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">{source.url}</p>
                              {source.lastUpdated && (
                                <p className="text-xs text-slate-500">
                                  Last updated: {new Date(source.lastUpdated).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{source.type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                <CardHeader>
                  <CardTitle>Source Health</CardTitle>
                  <CardDescription>Monitor data source performance and reliability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{economicSources.filter((s: any) => s.status === 'active').length}</div>
                      <div className="text-sm text-slate-600">Active Sources</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{economicEvents.length}</div>
                      <div className="text-sm text-slate-600">Today's Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{filteredEvents.length}</div>
                      <div className="text-sm text-slate-600">Matching Filter</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="treatment" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Data Treatment</h2>
                <p className="text-sm text-slate-600 mb-4">Configure filtering, processing, and content generation settings</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                  <CardHeader>
                    <CardTitle>Content Filters</CardTitle>
                    <CardDescription>Define which economic events to process</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Impact Levels</Label>
                      <div className="flex gap-2 mt-2">
                        {['HIGH', 'MEDIUM', 'LOW'].map((level) => (
                          <div key={level} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-${level}`}
                              checked={treatmentConfig.filters.impact_levels.includes(level)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTreatmentConfig({
                                    ...treatmentConfig,
                                    filters: {
                                      ...treatmentConfig.filters,
                                      impact_levels: [...treatmentConfig.filters.impact_levels, level]
                                    }
                                  });
                                } else {
                                  setTreatmentConfig({
                                    ...treatmentConfig,
                                    filters: {
                                      ...treatmentConfig.filters,
                                      impact_levels: treatmentConfig.filters.impact_levels.filter(l => l !== level)
                                    }
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`filter-${level}`}>{level}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Currencies</Label>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'NZD'].map((currency) => (
                          <div key={currency} className="flex items-center space-x-2">
                            <Checkbox
                              id={`currency-${currency}`}
                              checked={treatmentConfig.filters.currencies.includes(currency)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTreatmentConfig({
                                    ...treatmentConfig,
                                    filters: {
                                      ...treatmentConfig.filters,
                                      currencies: [...treatmentConfig.filters.currencies, currency]
                                    }
                                  });
                                } else {
                                  setTreatmentConfig({
                                    ...treatmentConfig,
                                    filters: {
                                      ...treatmentConfig.filters,
                                      currencies: treatmentConfig.filters.currencies.filter(c => c !== currency)
                                    }
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`currency-${currency}`}>{currency}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hours_ahead">Hours Ahead</Label>
                        <Input
                          id="hours_ahead"
                          type="number"
                          value={treatmentConfig.filters.time_range.hours_ahead}
                          onChange={(e) => setTreatmentConfig({
                            ...treatmentConfig,
                            filters: {
                              ...treatmentConfig.filters,
                              time_range: {
                                ...treatmentConfig.filters.time_range,
                                hours_ahead: parseInt(e.target.value)
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hours_after">Hours After</Label>
                        <Input
                          id="hours_after"
                          type="number"
                          value={treatmentConfig.filters.time_range.hours_after}
                          onChange={(e) => setTreatmentConfig({
                            ...treatmentConfig,
                            filters: {
                              ...treatmentConfig.filters,
                              time_range: {
                                ...treatmentConfig.filters.time_range,
                                hours_after: parseInt(e.target.value)
                              }
                            }
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                  <CardHeader>
                    <CardTitle>Content Generation</CardTitle>
                    <CardDescription>AI-powered content enhancement settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="ai_enhancement">AI Enhancement</Label>
                        <p className="text-sm text-slate-600">Use AI to improve content quality</p>
                      </div>
                      <Switch
                        id="ai_enhancement"
                        checked={treatmentConfig.content_generation.ai_enhancement}
                        onCheckedChange={(checked) => setTreatmentConfig({
                          ...treatmentConfig,
                          content_generation: {
                            ...treatmentConfig.content_generation,
                            ai_enhancement: checked
                          }
                        })}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-slate-200"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="include_analysis">Include Analysis</Label>
                        <p className="text-sm text-slate-600">Add market impact analysis</p>
                      </div>
                      <Switch
                        id="include_analysis"
                        checked={treatmentConfig.content_generation.include_analysis}
                        onCheckedChange={(checked) => setTreatmentConfig({
                          ...treatmentConfig,
                          content_generation: {
                            ...treatmentConfig.content_generation,
                            include_analysis: checked
                          }
                        })}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-slate-200"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="add_market_context">Market Context</Label>
                        <p className="text-sm text-slate-600">Include relevant market conditions</p>
                      </div>
                      <Switch
                        id="add_market_context"
                        checked={treatmentConfig.content_generation.add_market_context}
                        onCheckedChange={(checked) => setTreatmentConfig({
                          ...treatmentConfig,
                          content_generation: {
                            ...treatmentConfig.content_generation,
                            add_market_context: checked
                          }
                        })}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-slate-200"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                <CardHeader>
                  <CardTitle>Filtered Events Preview</CardTitle>
                  <CardDescription>Events matching your current filter settings</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No events match current filters</h3>
                      <p className="text-slate-600">Adjust your filter settings to see matching events</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredEvents.slice(0, 5).map((event: EconomicEvent) => (
                        <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={event.impact === 'HIGH' ? 'destructive' : event.impact === 'MEDIUM' ? 'default' : 'secondary'}>
                                {event.impact}
                              </Badge>
                              <Badge variant="outline">{event.currency}</Badge>
                              <span className="font-medium">{event.title}</span>
                            </div>
                            <div className="text-sm text-slate-600 mt-1">
                              {new Date(event.time).toLocaleString()} • {event.country}
                              {event.expected && <span> • Expected: {event.expected}</span>}
                              {event.actual && <span> • Actual: {event.actual}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredEvents.length > 5 && (
                        <p className="text-sm text-slate-600 text-center pt-2">
                          +{filteredEvents.length - 5} more events
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="posting" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">Posting Rules</h2>
                  <p className="text-sm text-slate-600">Configure when and where to publish economic calendar content</p>
                </div>
                <Button 
                  onClick={() => setShowRuleForm(true)} 
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </Button>
              </div>

              {/* Event Template Configuration */}
              <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                      <Edit className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Event Template
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Customize the template for economic event posts. Use placeholders like {'{title}'}, {'{currency}'}, {'{impact}'}, etc.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="event-template" className="text-sm font-medium text-slate-700 mb-2 block">
                          Template Content
                        </Label>
                        <Textarea
                          id="event-template"
                          rows={12}
                          placeholder="⚡ NEW Event: {title} - {currency}
📅 Time: {time}
🌍 Country: {country}
📊 Impact: {impact}

📈 Expected: {expected}
📉 Previous: {previous}
✅ Actual: {actual}

💡 Market Impact: {analysis}
🎯 Key Levels: {levels}

#EconomicEvent #{currency} #Forex #Trading"
                          defaultValue="⚡ NEW Event: {title} - {currency}
📅 Time: {time}
🌍 Country: {country}
📊 Impact: {impact}

📈 Expected: {expected}
📉 Previous: {previous}
✅ Actual: {actual}

💡 Market Impact: {analysis}
🎯 Key Levels: {levels}

#EconomicEvent #{currency} #Forex #Trading"
                          className="font-mono text-sm border-slate-200 focus:border-green-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="include-analysis" className="text-sm font-medium text-slate-700">
                            Include AI Analysis
                          </Label>
                          <p className="text-xs text-slate-600 mt-1">
                            Add AI-generated market impact analysis
                          </p>
                        </div>
                        <Switch
                          id="include-analysis"
                          defaultChecked
                          className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-slate-200"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-3 block">
                          Target Platforms
                        </Label>
                        <div className="space-y-3">
                          {[
                            { id: 'telegram', name: 'Telegram', icon: '📱', defaultChecked: true, description: 'Share to Telegram channels' },
                            { id: 'discord', name: 'Discord', icon: '🎮', defaultChecked: true, description: 'Post to Discord servers' },
                            { id: 'twitter', name: 'X (Twitter)', icon: '🐦', defaultChecked: true, description: 'Tweet to Twitter/X' },
                            { id: 'linkedin', name: 'LinkedIn', icon: '💼', defaultChecked: false, description: 'Share to LinkedIn' },
                            { id: 'facebook', name: 'Facebook', icon: '📘', defaultChecked: false, description: 'Post to Facebook' },
                            { id: 'instagram', name: 'Instagram', icon: '📷', defaultChecked: false, description: 'Share to Instagram Stories' },
                            { id: 'website', name: 'Website', icon: '🌐', defaultChecked: false, description: 'Publish to website/blog' },
                            { id: 'email', name: 'Email', icon: '📧', defaultChecked: false, description: 'Send email newsletters' }
                          ].map((platform) => (
                            <div key={platform.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                                  {platform.icon}
                                </div>
                                <div>
                                  <Label htmlFor={`platform-${platform.id}`} className="font-medium text-slate-900 cursor-pointer">
                                    {platform.name}
                                  </Label>
                                  <p className="text-xs text-slate-600">{platform.description}</p>
                                </div>
                              </div>
                              <Switch 
                                id={`platform-${platform.id}`} 
                                defaultChecked={platform.defaultChecked}
                                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-slate-200"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto-post" className="text-sm font-medium text-slate-700">
                            Auto-Post Events
                          </Label>
                          <p className="text-xs text-slate-600 mt-1">
                            Automatically post events when they occur
                          </p>
                        </div>
                        <Switch
                          id="auto-post"
                          defaultChecked
                          className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-slate-200"
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-3 block">
                            Available Placeholders
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { placeholder: '{title}', description: 'Event title' },
                              { placeholder: '{currency}', description: 'Currency code' },
                              { placeholder: '{country}', description: 'Country name' },
                              { placeholder: '{impact}', description: 'Impact level' },
                              { placeholder: '{time}', description: 'Event time' },
                              { placeholder: '{expected}', description: 'Expected value' },
                              { placeholder: '{previous}', description: 'Previous value' },
                              { placeholder: '{actual}', description: 'Actual value' },
                              { placeholder: '{analysis}', description: 'AI analysis' },
                              { placeholder: '{levels}', description: 'Key levels' },
                              { placeholder: '{date}', description: 'Event date' },
                              { placeholder: '{source}', description: 'Data source' }
                            ].map((item) => (
                              <div key={item.placeholder} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                                <code className="text-xs font-mono text-green-600 bg-green-50 px-1 py-0.5 rounded">
                                  {item.placeholder}
                                </code>
                                <span className="text-xs text-slate-600">{item.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-3 block">
                            Template Preview
                          </Label>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="text-sm text-slate-700 space-y-1">
                              <div>⚡ NEW Event: US Non-Farm Payrolls - USD</div>
                              <div>📅 Time: Dec 15, 2:30 PM EST</div>
                              <div>🌍 Country: United States</div>
                              <div>📊 Impact: HIGH</div>
                              <div className="mt-2">
                                <div>📈 Expected: 185K</div>
                                <div>📉 Previous: 173K</div>
                                <div>✅ Actual: 200K</div>
                              </div>
                              <div className="mt-2">
                                <div>💡 Market Impact: Strong employment data suggests...</div>
                                <div>🎯 Key Levels: 1.0850, 1.0800</div>
                              </div>
                              <div className="mt-2 text-green-600">
                                #EconomicEvent #USD #Forex #Trading
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reset to Default
                        </Button>
                        <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                      <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                        <Zap className="w-4 h-4 mr-2" />
                        Save Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {showRuleForm && (
                <PostingRuleForm
                  onSave={(rule: any) => createPostingRuleMutation.mutate(rule)}
                  onCancel={() => setShowRuleForm(false)}
                />
              )}

              <div className="grid gap-4">
                {postingRules.length === 0 ? (
                  <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                    <CardContent className="text-center py-8">
                      <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No posting rules configured</h3>
                      <p className="text-slate-600 mb-4">Create posting rules to automate content distribution</p>
                      <Button 
                        onClick={() => setShowRuleForm(true)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Create First Rule
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  postingRules.map((rule: PostingRule) => (
                    <Card key={rule.id} className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {rule.name}
                              <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                                {rule.enabled ? 'Active' : 'Disabled'}
                              </Badge>
                            </CardTitle>
                            <CardDescription>
                              {rule.triggerConditions.currencies?.join(', ')} • {rule.triggerConditions.impact_levels?.join(', ')} Impact
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deletePostingRuleMutation.mutate(rule.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <h4 className="font-medium mb-2">Target Accounts ({rule.targetAccounts?.length || 0})</h4>
                          <div className="flex gap-2 flex-wrap">
                            {rule.targetAccounts?.map((target: any, index: number) => {
                              const account = platformAccounts.find((acc: PlatformAccount) => acc.id === target.platform_account_id);
                              return account ? (
                                <Badge key={index} variant="outline">
                                  {account.platform}: {account.displayName}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}