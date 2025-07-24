import { Zap, Settings, Eye, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

// Mock trading signals - ready for backend integration  
const mockSignals = [
  {
    id: 1,
    symbol: 'EUR/USD',
    direction: 'SELL',
    entry: 1.0850,
    stopLoss: 1.0900,
    takeProfit: 1.0780,
    current: 1.0865,
    probability: 85,
    riskReward: '1:2.5',
    status: 'Active',
    source: 'FXLeaders',
    timeframe: '4H',
    analysis: 'Bearish divergence + resistance confluence',
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    symbol: 'GBP/USD',
    direction: 'BUY',
    entry: 1.2450,
    stopLoss: 1.2400,
    takeProfit: 1.2520,
    current: 1.2445,
    probability: 78,
    riskReward: '1:1.8',
    status: 'Pending',
    source: 'TradingView',
    timeframe: '1H',
    analysis: 'Bullish breakout above key level',
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 3,
    symbol: 'USD/JPY',
    direction: 'BUY',
    entry: 150.20,
    stopLoss: 149.50,
    takeProfit: 151.00,
    current: 150.15,
    probability: 72,
    riskReward: '1:1.5',
    status: 'Executed',
    source: 'DailyFX',
    timeframe: '30M',
    analysis: 'Support bounce + trend continuation',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

export function TradingSignalsEnhanced() {
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filter signals based on criteria
  const filteredSignals = mockSignals.filter(signal => {
    const sourceMatch = selectedSource === "ALL" || signal.source === selectedSource;
    const statusMatch = selectedStatus === "ALL" || signal.status === selectedStatus;
    return sourceMatch && statusMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Executed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const calculatePnL = (signal: any) => {
    if (signal.status !== 'Active') return null;
    const diff = signal.direction === 'BUY' 
      ? signal.current - signal.entry
      : signal.entry - signal.current;
    const pips = Math.round(diff * 10000);
    return pips;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-8">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Trading Signals</h3>
              <p className="text-sm text-slate-600">Auto-sourced from multiple providers</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'text-green-600' : 'text-slate-600'}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configure Sources
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">Filters:</span>
          </div>
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sources</SelectItem>
              <SelectItem value="FXLeaders">FXLeaders</SelectItem>
              <SelectItem value="TradingView">TradingView</SelectItem>
              <SelectItem value="DailyFX">DailyFX</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Executed">Executed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="p-6">
        {filteredSignals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSignals.map((signal) => {
              const pnl = calculatePnL(signal);
              return (
                <div key={signal.id} className="p-5 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-slate-900">{signal.symbol}</span>
                      <Badge className={getDirectionColor(signal.direction)}>
                        {signal.direction}
                      </Badge>
                    </div>
                    <Badge className={getStatusColor(signal.status)}>
                      {signal.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500">Entry:</span>
                        <div className="font-semibold text-slate-900">{signal.entry}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Current:</span>
                        <div className="font-semibold text-slate-900">{signal.current}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500">Stop Loss:</span>
                        <div className="font-medium text-red-600">{signal.stopLoss}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Take Profit:</span>
                        <div className="font-medium text-green-600">{signal.takeProfit}</div>
                      </div>
                    </div>

                    {pnl !== null && (
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="text-slate-500">Unrealized P&L:</span>
                        <span className={`font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl} pips
                        </span>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Probability:</span>
                        <span className="font-medium text-purple-600">{signal.probability}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">R/R:</span>
                        <span className="font-medium text-slate-900">{signal.riskReward}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Timeframe:</span>
                        <span className="font-medium text-slate-900">{signal.timeframe}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="text-xs text-slate-500 mb-1">Analysis:</div>
                      <div className="text-xs text-slate-600 italic">{signal.analysis}</div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-500">Source: {signal.source}</span>
                        <span className="text-xs text-slate-500">{formatTime(signal.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No signals match your filter criteria</p>
            <p className="text-sm text-slate-500">Adjust filters or check back later for new signals</p>
          </div>
        )}
        
        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-600">Live scraping: {autoRefresh ? 'Active' : 'Paused'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-slate-600">GPT enhancement: Enabled</span>
            </div>
            <span className="text-slate-600">Updates every 30 seconds</span>
          </div>
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View Signal History
          </Button>
        </div>
      </div>
    </div>
  );
}
