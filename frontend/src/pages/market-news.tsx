import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Settings, Plus, Eye, Edit, Zap, ExternalLink, Filter, Search, Globe, Calendar, Clock, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function MarketNews() {
  const [selectedTab, setSelectedTab] = useState("news");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'CAD/JPY', 'NZD/JPY', 'CHF/JPY'
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for scraped news - replace with real API calls
  const mockNewsData = [
    {
      id: 1,
      title: "EUR/USD Hits 3-Month High on ECB Policy Shift",
      content: "The Euro surged to its highest level in three months as the European Central Bank signaled a more hawkish stance on monetary policy...",
      source: "Reuters",
      symbol: "EUR/USD",
      impact: "High",
      publishedAt: "2024-01-15T10:30:00Z",
      scrapedAt: "2024-01-15T10:35:00Z",
      status: "active",
      url: "https://www.reuters.com/forex/eur-usd-ecb-policy"
    },
    {
      id: 2,
      title: "GBP/USD Volatility Expected Ahead of UK CPI Data",
      content: "Sterling traders are bracing for increased volatility as the UK prepares to release crucial inflation data that could influence Bank of England decisions...",
      source: "Bloomberg",
      symbol: "GBP/USD",
      impact: "Medium",
      publishedAt: "2024-01-15T09:15:00Z",
      scrapedAt: "2024-01-15T09:20:00Z",
      status: "active",
      url: "https://www.bloomberg.com/news/gbp-usd-cpi-data"
    },
    {
      id: 3,
      title: "USD/JPY Retreats from 150.00 Psychological Level",
      content: "The US Dollar retreated from the key 150.00 level against the Japanese Yen as traders took profits and awaited Federal Reserve commentary...",
      source: "CNBC",
      symbol: "USD/JPY",
      impact: "High",
      publishedAt: "2024-01-15T08:45:00Z",
      scrapedAt: "2024-01-15T08:50:00Z",
      status: "active",
      url: "https://www.cnbc.com/forex/usd-jpy-150-level"
    },
    {
      id: 4,
      title: "AUD/USD Gains on Strong Australian Employment Data",
      content: "The Australian Dollar strengthened against the US Dollar following better-than-expected employment figures that suggest a resilient labor market...",
      source: "MarketWatch",
      symbol: "AUD/USD",
      impact: "Medium",
      publishedAt: "2024-01-15T07:30:00Z",
      scrapedAt: "2024-01-15T07:35:00Z",
      status: "active",
      url: "https://www.marketwatch.com/forex/aud-usd-employment"
    },
    {
      id: 5,
      title: "USD/CAD Faces Pressure from Oil Price Rally",
      content: "The Canadian Dollar gained ground as oil prices surged, supporting the commodity-linked currency and putting pressure on USD/CAD...",
      source: "Yahoo Finance",
      symbol: "USD/CAD",
      impact: "Low",
      publishedAt: "2024-01-15T06:20:00Z",
      scrapedAt: "2024-01-15T06:25:00Z",
      status: "active",
      url: "https://finance.yahoo.com/forex/usd-cad-oil-rally"
    }
  ];

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

  // Filter news based on selected symbols and search term
  const filteredNews = mockNewsData.filter(news => {
    const matchesSymbol = selectedSymbols.includes(news.symbol);
    const matchesSearch = news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         news.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         news.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSymbol && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNews = filteredNews.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const SymbolSelection = () => {
    const allSymbols = [
      'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
      'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'CAD/JPY', 'NZD/JPY', 'CHF/JPY',
      'EUR/CHF', 'GBP/CHF', 'AUD/CHF', 'CAD/CHF', 'NZD/CHF', 'EUR/AUD', 'GBP/AUD',
      'USD/AUD', 'CAD/AUD', 'NZD/AUD', 'EUR/CAD', 'GBP/CAD', 'USD/CAD', 'AUD/CAD',
      'NZD/CAD', 'EUR/NZD', 'GBP/NZD', 'USD/NZD', 'AUD/NZD', 'CAD/NZD'
    ];

    const handleSymbolToggle = (symbol: string) => {
      setSelectedSymbols(prev => 
        prev.includes(symbol) 
          ? prev.filter(s => s !== symbol)
          : [...prev, symbol]
      );
    };

    const handleSelectAll = () => {
      setSelectedSymbols(allSymbols);
    };

    const handleClearAll = () => {
      setSelectedSymbols([]);
    };

    return (
      <div className="space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Symbol Selection
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  Select which currency pairs to monitor for news
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {selectedSymbols.length} of {allSymbols.length} symbols selected
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                  className="border-slate-200 hover:bg-slate-50"
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearAll}
                  className="border-slate-200 hover:bg-slate-50"
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allSymbols.map((symbol) => (
                <div
                  key={symbol}
                  className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedSymbols.includes(symbol)
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                  onClick={() => handleSymbolToggle(symbol)}
                >
                  <Switch 
                    checked={selectedSymbols.includes(symbol)}
                    onCheckedChange={() => handleSymbolToggle(symbol)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label className="font-medium text-slate-900 cursor-pointer">
                    {symbol}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const NewsTable = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search news by title, content, or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-blue-500"
              />
            </div>
            <Button 
              variant="outline"
              className="border-slate-200 hover:bg-slate-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* News Table */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Market News
            </span>
            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredNews.length)} of {filteredNews.length} news items
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-lg border border-slate-200/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60">
                  <TableHead className="font-semibold text-slate-700">Symbol</TableHead>
                  <TableHead className="font-semibold text-slate-700">Title</TableHead>
                  <TableHead className="font-semibold text-slate-700">Source</TableHead>
                  <TableHead className="font-semibold text-slate-700">Impact</TableHead>
                  <TableHead className="font-semibold text-slate-700">Published</TableHead>
                  <TableHead className="font-semibold text-slate-700">Scraped</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedNews.map((news) => (
                  <TableRow key={news.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-slate-900">{news.symbol}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <h4 className="font-medium text-slate-900 mb-1 line-clamp-2">
                          {news.title}
                        </h4>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {news.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-semibold">
                        {news.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getImpactColor(news.impact)} font-semibold shadow-sm`}>
                        {news.impact}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">
                          {formatTimeAgo(news.publishedAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">
                          {formatTimeAgo(news.scrapedAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" className="hover:bg-blue-50 text-blue-600 hover:text-blue-700">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-green-50 text-green-600 hover:text-green-700">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-purple-50 text-purple-600 hover:text-purple-700">
                          <ExternalLink className="w-4 h-4" />
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
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
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

      {/* No Results */}
      {filteredNews.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertCircle className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No News Found</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? `No news items match your search for "${searchTerm}". Try adjusting your search terms or symbol selection.`
                : "No news items found for the selected symbols. Try selecting more symbols or check back later."
              }
            </p>
            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedSymbols(['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD']);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Market News
                </h1>
                <p className="text-sm text-slate-600 mt-1 font-medium">
                  Real-time forex news monitoring and analysis
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
              <Button 
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Zap className="w-4 h-4 mr-2" />
                {generateMutation.isPending ? 'Generating...' : 'Generate Summary'}
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
                  <DropdownMenuItem onClick={() => setSelectedTab('symbols')}>
                    <Globe className="w-4 h-4 mr-2" />
                    Symbol Selection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedTab('settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    News Sources
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
            <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-sm">
              <TabsTrigger value="news" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">Market News</TabsTrigger>
              <TabsTrigger value="symbols" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">Symbol Selection</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="news" className="space-y-6">
              <NewsTable />
            </TabsContent>

            <TabsContent value="symbols" className="space-y-6">
              <SymbolSelection />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
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

                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                  <CardHeader>
                    <CardTitle>Publishing Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="frequency">Update Frequency</Label>
                      <Select defaultValue="hourly">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15min">Every 15 minutes</SelectItem>
                          <SelectItem value="30min">Every 30 minutes</SelectItem>
                          <SelectItem value="hourly">Every hour</SelectItem>
                          <SelectItem value="twice-daily">Twice daily</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-3 block">Target Platforms</Label>
                      <div className="space-y-3">
                        {[
                          { id: 'telegram', name: 'Telegram', defaultChecked: true },
                          { id: 'twitter', name: 'X (Twitter)', defaultChecked: true },
                          { id: 'discord', name: 'Discord', defaultChecked: false },
                          { id: 'websites', name: 'Websites', defaultChecked: false }
                        ].map((platform) => (
                          <div key={platform.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <Globe className="w-4 h-4 text-white" />
                              </div>
                              <Label htmlFor={`platform-${platform.id}`} className="font-medium text-slate-900 cursor-pointer">
                                {platform.name}
                              </Label>
                            </div>
                            <Switch 
                              id={`platform-${platform.id}`} 
                              defaultChecked={platform.defaultChecked}
                              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}