import { useState } from 'react';
import { Calendar, Settings, Play, Pause, Filter, Eye, Target, Send, Plus, Edit, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

  const { data: economicEvents = [] } = useQuery({
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
      <Card className="mt-4">
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
                                                      <Badge key={index} className="!bg-emerald-600 !text-white !border-emerald-700 !border-2 shadow-md">
                                  {tag}
                                </Badge>
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

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Economic Calendar</h1>
                <p className="text-sm text-slate-600 mt-1">Automate economic news posting with AI-powered content generation</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={economicConfig?.enabled ? 'default' : 'secondary'}>
                {economicConfig?.enabled ? 'Active' : 'Inactive'}
              </Badge>
              <Button onClick={saveConfiguration} disabled={saveConfigMutation.isPending}>
                {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeLayer} onValueChange={setActiveLayer} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sources" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Sources
              </TabsTrigger>
              <TabsTrigger value="treatment" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Treatment
              </TabsTrigger>
              <TabsTrigger value="posting" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Posting
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sources" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Data Sources</h2>
                <p className="text-sm text-slate-600 mb-4">Select and configure economic calendar data sources</p>
              </div>

              <Card>
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
                            <Badge className="!bg-slate-600 !text-white !border-slate-700 !border-2 shadow-md">{source.type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
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
                <Card>
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

                <Card>
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
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
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
                              <Badge className="!bg-blue-600 !text-white !border-blue-700 !border-2 shadow-md">{event.currency}</Badge>
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
                <Button onClick={() => setShowRuleForm(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Rule
                </Button>
              </div>

              {showRuleForm && (
                <PostingRuleForm
                  onSave={(rule: any) => createPostingRuleMutation.mutate(rule)}
                  onCancel={() => setShowRuleForm(false)}
                />
              )}

              <div className="grid gap-4">
                {postingRules.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No posting rules configured</h3>
                      <p className="text-slate-600 mb-4">Create posting rules to automate content distribution</p>
                      <Button onClick={() => setShowRuleForm(true)}>
                        Create First Rule
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  postingRules.map((rule: PostingRule) => (
                    <Card key={rule.id}>
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