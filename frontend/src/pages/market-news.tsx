import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Settings, Plus, Eye, Edit, Zap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function MarketNews() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts } = useQuery({
    queryKey: ['/api/content-posts'],
  });

  const generateMutation = useMutation({
    mutationFn: api.generateMarketSummary,
    onSuccess: async (result) => {
      await api.createContentPost({
        type: 'market',
        title: result.title,
        content: result.content,
        originalContent: null,
        aiEnhanced: result.enhanced,
        platforms: ['telegram', 'twitter'],
        status: 'draft',
        scheduledAt: null,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/content-posts'] });
      toast({
        title: "Market summary generated",
        description: "New market update has been created and saved as draft.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const marketPosts = Array.isArray(posts) ? posts.filter((post: any) => post.type === 'market') : [];

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const SourceConfiguration = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>News Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="primary-source">Primary News Source</Label>
            <Select defaultValue="reuters">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reuters">Reuters Financial</SelectItem>
                <SelectItem value="bloomberg">Bloomberg Markets</SelectItem>
                <SelectItem value="cnbc">CNBC Markets</SelectItem>
                <SelectItem value="marketwatch">MarketWatch</SelectItem>
                <SelectItem value="yahoo">Yahoo Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="rss-feed">RSS Feed URL</Label>
            <Input 
              id="rss-feed"
              placeholder="https://feeds.reuters.com/news/markets"
              defaultValue="https://feeds.reuters.com/news/markets"
            />
          </div>
          <div>
            <Label htmlFor="api-key">News API Key (if required)</Label>
            <Input 
              id="api-key"
              type="password"
              placeholder="Enter API key for premium sources"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Market Data Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="market-data">Market Data Provider</Label>
            <Select defaultValue="yahoo">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yahoo">Yahoo Finance</SelectItem>
                <SelectItem value="alphavantage">Alpha Vantage</SelectItem>
                <SelectItem value="finnhub">Finnhub</SelectItem>
                <SelectItem value="iex">IEX Cloud</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tracked Indices</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['S&P 500', 'NASDAQ', 'Dow Jones', 'FTSE 100', 'DAX', 'Nikkei'].map((index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Switch 
                    id={`index-${index}`} 
                    defaultChecked={['S&P 500', 'NASDAQ', 'Dow Jones'].includes(index)}
                  />
                  <Label htmlFor={`index-${index}`}>{index}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ContentSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Content Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="summary-style">Summary Style</Label>
            <Select defaultValue="professional">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional & Formal</SelectItem>
                <SelectItem value="engaging">Engaging & Accessible</SelectItem>
                <SelectItem value="technical">Technical Analysis Focus</SelectItem>
                <SelectItem value="casual">Casual & Conversational</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="content-length">Content Length</Label>
            <Select defaultValue="medium">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (Twitter optimized, under 280 chars)</SelectItem>
                <SelectItem value="medium">Medium (Multi-platform, 280-500 chars)</SelectItem>
                <SelectItem value="long">Long (Detailed analysis, 500+ chars)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="include-emojis" defaultChecked />
            <Label htmlFor="include-emojis">Include emojis and visual elements</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="include-hashtags" defaultChecked />
            <Label htmlFor="include-hashtags">Include relevant hashtags</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publishing Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="morning-summary">Morning Summary</Label>
            <Input 
              id="morning-summary"
              type="time"
              defaultValue="09:00"
            />
          </div>
          <div>
            <Label htmlFor="frequency">Update Frequency</Label>
            <Select defaultValue="twice-daily">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Every hour</SelectItem>
                <SelectItem value="twice-daily">Twice daily (morning & closing)</SelectItem>
                <SelectItem value="daily">Once daily</SelectItem>
                <SelectItem value="market-hours">During market hours only</SelectItem>
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
                    defaultChecked={platform !== 'discord'} 
                  />
                  <Label htmlFor={`platform-${platform}`} className="capitalize">
                    {platform === 'twitter' ? 'X (Twitter)' : platform}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Market News</h1>
                <p className="text-sm text-slate-600 mt-1">AI-powered market summaries and news analysis</p>
              </div>
            </div>
            <Button 
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              {generateMutation.isPending ? 'Generating...' : 'Generate Summary'}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="sources">Data Sources</TabsTrigger>
              <TabsTrigger value="settings">Publishing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Latest Market Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-emerald-100 text-emerald-800">AI Generated</Badge>
                        <span className="text-sm text-slate-600">2 hours ago</span>
                      </div>
                      <p className="text-slate-700 mb-3">
                        Markets opened higher today with tech stocks leading gains. The S&P 500 climbed 1.2% while the Nasdaq surged 1.8%. Key drivers include strong earnings from major tech companies and positive economic data.
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-600">Posted to:</span>
                          <div className="flex space-x-1">
                            <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
                            <div className="w-5 h-5 bg-black rounded-full"></div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Market Indices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: 'S&P 500', value: '4,567.89', change: '+1.2%', color: 'text-green-600' },
                        { name: 'NASDAQ', value: '14,234.56', change: '+1.8%', color: 'text-green-600' },
                        { name: 'Dow Jones', value: '34,890.12', change: '+0.8%', color: 'text-green-600' },
                        { name: 'FTSE 100', value: '7,456.78', change: '-0.3%', color: 'text-red-600' }
                      ].map((index) => (
                        <div key={index.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-900">{index.name}</span>
                          <div className="text-right">
                            <div className="font-medium text-slate-900">{index.value}</div>
                            <div className={`text-sm ${index.color}`}>{index.change}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Generation Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">24</div>
                      <div className="text-sm text-slate-600">Summaries This Week</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">96%</div>
                      <div className="text-sm text-slate-600">AI Enhancement Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">3.2k</div>
                      <div className="text-sm text-slate-600">Total Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">8</div>
                      <div className="text-sm text-slate-600">Active Sources</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Generated Market Content</h3>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Custom Post
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  {marketPosts.length > 0 ? (
                    <div className="space-y-4">
                      {marketPosts.map((post: any) => (
                        <div key={post.id} className="p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge className={
                                post.status === 'posted' ? 'bg-green-100 text-green-800' :
                                post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {post.status}
                              </Badge>
                              {post.aiEnhanced && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                  AI Enhanced
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="font-medium text-slate-900 mb-2">{post.title}</h4>
                          <p className="text-slate-700 text-sm">{post.content}</p>
                          <div className="mt-3 text-xs text-slate-500">
                            Created: {new Date(post.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 mb-2">No market summaries yet</p>
                      <p className="text-sm text-slate-500">Generate your first AI-powered market summary</p>
                      <Button 
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        className="mt-4"
                      >
                        Generate Now
                      </Button>
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
    </div>
  );
}