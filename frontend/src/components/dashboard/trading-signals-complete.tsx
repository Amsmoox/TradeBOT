import { useState, useEffect } from "react";
import { Zap, Settings, Eye, Filter, RefreshCw, Brain, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/contexts/SettingsContext";

// Enhanced signal structure with all key fields from FXLeaders scraping
const mockSignals = [
  {
    id: 1,
    symbol: 'EUR/USD',
    direction: 'SELL',
    entryPrice: 1.0850,
    stopLoss: 1.0900,
    takeProfit: 1.0780,
    currentPrice: 1.0865,
    probability: 85,
    riskReward: '1:2.5',
    status: 'Active',
    source: 'FXLeaders',
    timeframe: '4H',
    analysis: 'Bearish divergence + resistance confluence',
    timestamp: new Date().toISOString(),
    pips: -15,
    // Additional FXLeaders fields
    author: 'John Trader',
    signalType: 'Premium',
    volume: 'High',
    confidence: 'High',
    marketSentiment: 'Bearish',
    technicalPattern: 'Double Top',
    fundamentalReason: 'ECB dovish comments',
    // GPT Enhancement
    aiEnriched: true,
    gptAnalysis: 'Technical analysis confirms bearish momentum with RSI divergence and key resistance rejection. Risk management suggests 1:2.5 R/R ratio optimal.',
    // Template fields
    templateApplied: 'Premium Signal Template',
    outputFormatted: true,
    publishedTo: ['Telegram', 'Discord']
  },
  {
    id: 2,
    symbol: 'GBP/USD',
    direction: 'BUY',
    entryPrice: 1.2450,
    stopLoss: 1.2400,
    takeProfit: 1.2520,
    currentPrice: 1.2445,
    probability: 78,
    riskReward: '1:1.8',
    status: 'Pending',
    source: 'FXLeaders',
    timeframe: '1H',
    analysis: 'Bullish breakout above key level',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    pips: 0,
    // Additional fields
    author: 'Sarah FX',
    signalType: 'Free',
    volume: 'Medium',
    confidence: 'Medium',
    marketSentiment: 'Bullish',
    technicalPattern: 'Ascending Triangle',
    fundamentalReason: 'UK GDP better than expected',
    // GPT Enhancement
    aiEnriched: true,
    gptAnalysis: 'Breakout setup with solid fundamentals. Entry pending break above 1.2450 with volume confirmation.',
    // Template fields
    templateApplied: 'Standard Signal Template',
    outputFormatted: true,
    publishedTo: ['Telegram']
  },
  {
    id: 3,
    symbol: 'USD/JPY',
    direction: 'BUY',
    entryPrice: 150.20,
    stopLoss: 149.50,
    takeProfit: 151.00,
    currentPrice: 150.15,
    probability: 72,
    riskReward: '1:1.5',
    status: 'Executed',
    source: 'TradingView',
    timeframe: '30M',
    analysis: 'Support bounce + trend continuation',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    pips: -5,
    // Additional fields
    author: 'TradingView Community',
    signalType: 'Community',
    volume: 'Low',
    confidence: 'Medium',
    marketSentiment: 'Neutral',
    technicalPattern: 'Support Bounce',
    fundamentalReason: 'BoJ intervention concerns',
    // GPT Enhancement
    aiEnriched: false,
    gptAnalysis: null,
    // Template fields
    templateApplied: 'Community Template',
    outputFormatted: false,
    publishedTo: []
  }
];

// Signal filtering criteria
const filterCriteria = {
  sources: ['All', 'FXLeaders', 'TradingView', 'DailyFX', 'ForexFactory'],
  statuses: ['All', 'Active', 'Pending', 'Executed', 'Closed'],
  types: ['All', 'Premium', 'Free', 'Community'],
  instruments: ['All', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF'],
  timeframes: ['All', '1M', '5M', '15M', '30M', '1H', '4H', '1D']
};

// GPT Enhancement templates
const gptPromptTemplates = {
  'Technical Analysis': 'Analyze this trading signal from a technical perspective, focusing on chart patterns, indicators, and price action.',
  'Risk Assessment': 'Evaluate the risk-reward ratio and provide risk management recommendations for this signal.',
  'Market Context': 'Provide broader market context and how this signal fits into current market conditions.',
  'Entry Strategy': 'Suggest optimal entry strategies and timing for this trading signal.'
};

export default function TradingSignalsEnhanced() {
  const { getActiveInputSources, getActiveOutputDestinations } = useSettings();
  const [signals, setSignals] = useState(mockSignals);
  const [selectedSource, setSelectedSource] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [gptEnrichment, setGptEnrichment] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("Premium Signal Template");
  const [customGptPrompt, setCustomGptPrompt] = useState("");
  
  // Get active trading signal sources and output destinations
  const activeSources = getActiveInputSources("Trading Signals");
  const activeOutputs = getActiveOutputDestinations();
  const hasActiveSources = activeSources.length > 0;

  // Advanced filtering logic
  const filteredSignals = signals.filter(signal => {
    const sourceMatch = selectedSource === "All" || signal.source === selectedSource;
    const statusMatch = selectedStatus === "All" || signal.status === selectedStatus;
    const typeMatch = selectedType === "All" || signal.signalType === selectedType;
    return sourceMatch && statusMatch && typeMatch;
  });

  // Auto-refresh simulation with scraping
  useEffect(() => {
    if (!autoRefresh || !hasActiveSources) return;
    
    const interval = setInterval(() => {        // Simulate scraping new signals from FXLeaders
        const newSignal: TradingSignal = {
          id: Date.now(),
          symbol: ['EUR/USD', 'GBP/USD', 'USD/JPY'][Math.floor(Math.random() * 3)],
          direction: Math.random() > 0.5 ? 'BUY' : 'SELL',
          entryPrice: 1.1000 + Math.random() * 0.1,
          stopLoss: 1.1000 + Math.random() * 0.05,
          takeProfit: 1.1000 + Math.random() * 0.15,
          currentPrice: 1.1000 + Math.random() * 0.1,
          probability: 70 + Math.floor(Math.random() * 20),
          riskReward: '1:' + (1.5 + Math.random()).toFixed(1),
          status: 'Active',
          source: 'FXLeaders',
          timeframe: ['1H', '4H', '1D'][Math.floor(Math.random() * 3)],
          analysis: 'Auto-scraped signal with technical confluence',
          timestamp: new Date().toISOString(),
          pips: 0,
          author: 'Auto Scraper',
          signalType: 'Premium',
          volume: 'Medium',
          confidence: 'High',
          marketSentiment: 'Bullish',
          technicalPattern: 'Bull Flag',
          fundamentalReason: 'Economic data support',
          aiEnriched: gptEnrichment,
          gptAnalysis: gptEnrichment ? 'AI analysis pending...' : undefined,
          templateApplied: selectedTemplate,
          outputFormatted: true,
          publishedTo: activeOutputs.map(output => output.platform)
        };
      
      setSignals(prev => [newSignal, ...prev.slice(0, 9)]);
    }, 45000); // Every 45 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, hasActiveSources, gptEnrichment, selectedTemplate, activeOutputs]);

  // GPT Enhancement function
  const enhanceSignalWithGPT = async (signalId: number, promptType: string) => {
    setSignals(prev => prev.map(signal => 
      signal.id === signalId 
        ? { 
            ...signal, 
            aiEnriched: true,
            gptAnalysis: `Analyzing with ${promptType}...`
          }
        : signal
    ));

    // Simulate GPT API call
    setTimeout(() => {
      const gptResponses = {
        'Technical Analysis': 'Strong technical setup with RSI divergence and key level break. Momentum favors the trade direction.',
        'Risk Assessment': 'Optimal risk-reward ratio. Suggest position sizing at 1-2% account risk with trailing stop implementation.',
        'Market Context': 'Aligns with broader market sentiment. Watch for news events that could impact volatility.',
        'Entry Strategy': 'Consider scaling in on pullbacks. Use limit orders near entry level for better fills.'
      };

      setSignals(prev => prev.map(signal => 
        signal.id === signalId 
          ? { 
              ...signal, 
              gptAnalysis: gptResponses[promptType as keyof typeof gptResponses] || 'Enhanced analysis complete.'
            }
          : signal
      ));
    }, 2000);
  };

  // Publish signal to platforms using templates
  const publishSignal = (signal: TradingSignal) => {
    // Template formatting logic
    const formatSignalForTemplate = (signal: TradingSignal, template: string) => {
      const templates = {
        'Premium Signal Template': `🚨 PREMIUM SIGNAL 🚨
💱 ${signal.symbol}
📈 Direction: ${signal.direction}
💰 Entry: ${signal.entryPrice}
🛑 SL: ${signal.stopLoss}
🎯 TP: ${signal.takeProfit}
⚡ Probability: ${signal.probability}%
📊 R/R: ${signal.riskReward}
🔍 Analysis: ${signal.analysis}${signal.gptAnalysis ? '\n🤖 AI: ' + signal.gptAnalysis : ''}`,
        
        'Standard Signal Template': `📊 ${signal.symbol} ${signal.direction}
Entry: ${signal.entryPrice}
SL: ${signal.stopLoss} | TP: ${signal.takeProfit}
Confidence: ${signal.probability}%`,
        
        'Community Template': `${signal.symbol} - ${signal.direction}
Entry: ${signal.entryPrice}
Risk/Reward: ${signal.riskReward}`
      };
      
      return templates[template as keyof typeof templates] || signal.analysis;
    };

    const formattedContent = formatSignalForTemplate(signal, signal.templateApplied);
    
    // Update signal status to show it's been published
    setSignals(prev => prev.map(s => 
      s.id === signal.id 
        ? { ...s, publishedTo: activeOutputs.map(output => output.platform) }
        : s
    ));

    // Here would be actual API calls to publish to platforms
    console.log('Publishing to platforms:', formattedContent);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Executed': return 'bg-blue-100 text-blue-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Trading Signals</h1>
            <p className="text-slate-600">Auto-scraped from multiple providers with AI enhancement</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-scraping
          </Button>
          <Button 
            variant={gptEnrichment ? "default" : "outline"} 
            size="sm"
            onClick={() => setGptEnrichment(!gptEnrichment)}
          >
            <Brain className="w-4 h-4 mr-2" />
            GPT Enhancement
          </Button>
        </div>
      </div>

      {/* Source Status Warning */}
      {!hasActiveSources && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-yellow-800 font-medium">No Active Signal Sources</p>
              <p className="text-yellow-700 text-sm">Configure signal providers in Settings to start scraping.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Advanced Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Advanced Filters:</span>
          </div>
          
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {filterCriteria.sources.map(source => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {filterCriteria.statuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {filterCriteria.types.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Output Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Premium Signal Template">Premium Template</SelectItem>
              <SelectItem value="Standard Signal Template">Standard Template</SelectItem>
              <SelectItem value="Community Template">Community Template</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Signals Grid */}
      <div className="grid gap-6">
        {filteredSignals.map((signal) => (
          <Card key={signal.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-900">{signal.symbol}</div>
                  <Badge className={getDirectionColor(signal.direction)}>
                    {signal.direction}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Entry:</span>
                    <div className="font-semibold">{signal.entryPrice}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">SL:</span>
                    <div className="font-semibold text-red-600">{signal.stopLoss}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">TP:</span>
                    <div className="font-semibold text-green-600">{signal.takeProfit}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Current:</span>
                    <div className="font-semibold">{signal.currentPrice}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(signal.status)}>
                  {signal.status}
                </Badge>
                <Badge variant="outline">{signal.signalType}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <span className="text-slate-500">Probability:</span>
                <div className="font-medium text-purple-600">{signal.probability}%</div>
              </div>
              <div>
                <span className="text-slate-500">R/R:</span>
                <div className="font-medium">{signal.riskReward}</div>
              </div>
              <div>
                <span className="text-slate-500">Timeframe:</span>
                <div className="font-medium">{signal.timeframe}</div>
              </div>
              <div>
                <span className="text-slate-500">Confidence:</span>
                <div className="font-medium">{signal.confidence}</div>
              </div>
            </div>

            {/* Original Analysis */}
            <div className="bg-slate-50 p-3 rounded mb-4">
              <div className="text-xs font-medium text-slate-700 mb-1">Original Analysis:</div>
              <div className="text-sm text-slate-600">{signal.analysis}</div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>Source: {signal.source} • {signal.author}</span>
                <span>{formatTime(signal.timestamp)}</span>
              </div>
            </div>

            {/* GPT Enhancement */}
            {signal.aiEnriched && signal.gptAnalysis && (
              <div className="bg-purple-50 p-3 rounded mb-4 border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">AI Enhanced Analysis:</span>
                </div>
                <div className="text-sm text-purple-800">{signal.gptAnalysis}</div>
              </div>
            )}

            {/* GPT Enhancement Controls */}
            {!signal.aiEnriched && (
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xs text-slate-600">Enhance with GPT:</span>
                {Object.keys(gptPromptTemplates).map(promptType => (
                  <Button
                    key={promptType}
                    variant="outline"
                    size="sm"
                    onClick={() => enhanceSignalWithGPT(signal.id, promptType)}
                  >
                    {promptType}
                  </Button>
                ))}
              </div>
            )}

            {/* Publishing Status & Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center space-x-4">
                <div className="text-xs">
                  <span className="text-slate-500">Template:</span>
                  <span className="ml-1 font-medium">{signal.templateApplied}</span>
                </div>
                {signal.publishedTo.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-slate-500">Published to:</span>
                    {signal.publishedTo.map(platform => (
                      <Badge key={platform} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {signal.publishedTo.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => publishSignal(signal)}
                    disabled={activeOutputs.length === 0}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredSignals.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No signals found</h3>
          <p className="text-slate-600">Adjust your filters or wait for new signals to be scraped.</p>
        </div>
      )}

      {/* Status Footer */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${hasActiveSources && autoRefresh ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-slate-600">
                Scraping: {hasActiveSources && autoRefresh ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${gptEnrichment ? 'bg-purple-500' : 'bg-gray-500'}`}></div>
              <span className="text-slate-600">
                GPT Enhancement: {gptEnrichment ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <span className="text-slate-600">
              Template: {selectedTemplate}
            </span>
            <span className="text-slate-600">
              Active Outputs: {activeOutputs.length}
            </span>
          </div>
          <div className="text-slate-500">
            Showing {filteredSignals.length} of {signals.length} signals
          </div>
        </div>
      </Card>
    </div>
  );
}
