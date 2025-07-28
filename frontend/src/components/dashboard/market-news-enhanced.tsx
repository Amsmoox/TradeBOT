import { useState, useEffect } from "react";
import { Newspaper, Eye, Globe, Calendar, TrendingUp, ExternalLink, RefreshCw, Settings, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

// Mock news data - ready for backend integration
const mockNewsData = [
  {
    id: 1,
    title: "Fed Chair Powell Hints at Rate Cut in March",
    summary: "Federal Reserve Chairman Jerome Powell suggested during his testimony that the central bank may consider a rate cut as early as March, citing slowing inflation and economic uncertainties.",
    source: "Reuters",
    category: "Central Banks",
    publishedAt: "2024-01-15T14:30:00Z",
    url: "https://reuters.com/markets/fed-powell-rate-cut",
    impact: "High",
    instruments: ["USD", "EUR/USD", "Gold"],
    aiGenerated: false,
    posted: true,
    platforms: ["Telegram", "Twitter"]
  },
  {
    id: 2,
    title: "EUR/USD Technical Analysis: Breaking Key Resistance",
    summary: "The EUR/USD pair has successfully broken above the 1.0950 resistance level, with momentum indicators suggesting further upside potential toward 1.1000.",
    source: "GPT-4 Analysis",
    category: "Technical Analysis",
    publishedAt: "2024-01-15T13:45:00Z",
    url: null,
    impact: "Medium",
    instruments: ["EUR/USD"],
    aiGenerated: true,
    posted: false,
    platforms: []
  },
  {
    id: 3,
    title: "ECB Meeting Minutes Reveal Dovish Sentiment",
    summary: "The European Central Bank's latest meeting minutes show growing concerns about economic growth, with several members advocating for a more accommodative stance.",
    source: "CNBC",
    category: "Central Banks",
    publishedAt: "2024-01-15T12:15:00Z",
    url: "https://cnbc.com/ecb-minutes-dovish",
    impact: "High",
    instruments: ["EUR", "EUR/USD", "EUR/GBP"],
    aiGenerated: false,
    posted: true,
    platforms: ["Discord", "WhatsApp"]
  },
  {
    id: 4,
    title: "Weekly Market Outlook: Key Events to Watch",
    summary: "This week's trading calendar includes US retail sales, UK inflation data, and several Fed officials' speeches. Market focus remains on central bank policy divergence.",
    source: "GPT-4 Analysis",
    category: "Market Outlook",
    publishedAt: "2024-01-15T09:00:00Z",
    url: null,
    impact: "Medium",
    instruments: ["USD", "GBP", "EUR"],
    aiGenerated: true,
    posted: true,
    platforms: ["Telegram"]
  }
];

const newsCategories = ["All", "Central Banks", "Economic Data", "Technical Analysis", "Market Outlook", "Earnings"];
const impactLevels = ["All", "High", "Medium", "Low"];
const newsSources = ["All", "Reuters", "CNBC", "Bloomberg", "GPT-4 Analysis", "TradingView"];

export default function MarketNewsEnhanced() {
  const [newsItems, setNewsItems] = useState(mockNewsData);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImpact, setSelectedImpact] = useState("All");
  const [selectedSource, setSelectedSource] = useState("All");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-refresh simulation
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Simulate new news item
      const newItem = {
        id: Date.now(),
        title: "Market Update: " + new Date().toLocaleTimeString(),
        summary: "Automated market analysis based on current price movements and news sentiment.",
        source: "GPT-4 Analysis",
        category: "Market Outlook",
        publishedAt: new Date().toISOString(),
        url: null,
        impact: "Medium",
        instruments: ["USD", "EUR"],
        aiGenerated: true,
        posted: false,
        platforms: []
      };
      
      setNewsItems(prev => [newItem, ...prev.slice(0, 9)]);
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredNews = newsItems.filter(item => {
    return (selectedCategory === "All" || item.category === selectedCategory) &&
           (selectedImpact === "All" || item.impact === selectedImpact) &&
           (selectedSource === "All" || item.source === selectedSource);
  });

  const generateCustomNews = async () => {
    if (!customPrompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate GPT-4 generation
    setTimeout(() => {
      const generatedItem = {
        id: Date.now(),
        title: "Custom Analysis: " + customPrompt.substring(0, 50) + "...",
        summary: `AI-generated analysis based on your prompt: "${customPrompt}". This analysis covers market implications, technical outlook, and trading considerations.`,
        source: "GPT-4 Analysis",
        category: "Custom Analysis",
        publishedAt: new Date().toISOString(),
        url: null,
        impact: "Medium",
        instruments: ["USD", "EUR", "GBP"],
        aiGenerated: true,
        posted: false,
        platforms: []
      };
      
      setNewsItems(prev => [generatedItem, ...prev]);
      setCustomPrompt("");
      setIsGenerating(false);
    }, 2000);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High": return "bg-red-100 text-red-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      'Telegram': '📱',
      'Twitter': '🐦',
      'Discord': '💬',
      'WhatsApp': '📲'
    };
    return icons[platform as keyof typeof icons] || '🌐';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Market News</h1>
            <p className="text-slate-600">Real-time news and AI-generated analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure Sources
          </Button>
        </div>
      </div>

      {/* AI Generation Panel */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-start space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Generate Custom Analysis with GPT-4
            </label>
            <Textarea
              placeholder="Ask for market analysis, technical outlook, or specific instrument insights..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>
          <Button 
            onClick={generateCustomNews}
            disabled={isGenerating || !customPrompt.trim()}
            className="mt-6"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-2" />
            )}
            Generate
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-slate-200">
        <Filter className="w-5 h-5 text-slate-500" />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {newsCategories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedImpact} onValueChange={setSelectedImpact}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Impact" />
          </SelectTrigger>
          <SelectContent>
            {impactLevels.map(impact => (
              <SelectItem key={impact} value={impact}>{impact}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSource} onValueChange={setSelectedSource}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            {newsSources.map(source => (
              <SelectItem key={source} value={source}>{source}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <span>Showing {filteredNews.length} of {newsItems.length}</span>
        </div>
      </div>

      {/* News Items */}
      <div className="space-y-4">
        {filteredNews.map((item) => (
          <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h2 className="text-lg font-semibold text-slate-900 leading-tight">
                    {item.title}
                  </h2>
                  {item.aiGenerated && (
                                        <Badge className="!bg-purple-600 !text-white !border-purple-700 !border-2 shadow-md text-xs">
                      {item.category}
                    </Badge>
                  )}
                  <Badge className={getImpactColor(item.impact)}>
                    {item.impact}
                  </Badge>
                </div>
                
                <p className="text-slate-700 mb-4 leading-relaxed">{item.summary}</p>
                
                <div className="flex items-center space-x-6 text-sm text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>{item.source}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(item.publishedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>{item.instruments.join(", ")}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-3 ml-6">
                {item.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Read More
                    </a>
                  </Button>
                )}
                
                <div className="flex items-center space-x-2">
                  {item.posted ? (
                    <Badge className="!bg-green-600 !text-white !border-green-700 !border-2 shadow-md">
                      <Eye className="w-3 h-3 mr-1" />
                      Posted
                    </Badge>
                  ) : (
                    <Badge className="!bg-gray-600 !text-white !border-gray-700 !border-2 shadow-md">
                      Pending
                    </Badge>
                  )}
                </div>
                
                {item.platforms.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {item.platforms.map(platform => (
                      <span key={platform} className="text-lg" title={platform}>
                        {getPlatformIcon(platform)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No news found</h3>
          <p className="text-slate-600">Try adjusting your filters or check back later for updates.</p>
        </div>
      )}
    </div>
  );
}
