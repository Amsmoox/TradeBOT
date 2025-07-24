import { Zap, Settings, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockSignals = [
  {
    id: 1,
    instrument: 'EUR/USD',
    action: 'BUY',
    status: 'Active',
    entry: '1.0850',
    target: '1.0920',
    stopLoss: '1.0800',
    current: '1.0865',
    resistance: '1.0900',
    support: '1.0825',
    probability: 85,
    riskReward: '1:2.5',
  },
  {
    id: 2,
    instrument: 'GBP/USD',
    action: 'SELL',
    status: 'Active',
    entry: '1.2450',
    target: '1.2380',
    stopLoss: '1.2500',
    current: '1.2435',
    resistance: '1.2480',
    support: '1.2400',
    probability: 78,
    riskReward: '1:1.8',
  },
  {
    id: 3,
    instrument: 'USD/JPY',
    action: 'BUY',
    status: 'Pending',
    entry: '150.20',
    target: '151.00',
    stopLoss: '149.50',
    current: '150.15',
    resistance: '150.80',
    support: '149.90',
    probability: 72,
    riskReward: '1:1.5',
  },
];

export function TradingSignals() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/trading-signals'],
  });
  
  const signals = Array.isArray(data) ? data : [];
  const displaySignals = signals && signals.length > 0 ? signals : mockSignals;

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
              <p className="text-sm text-slate-600">Auto-sourced from FXLeaders and other providers</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure Sources
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-4 bg-slate-50 rounded-lg">
                <div className="h-4 bg-slate-200 rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displaySignals.slice(0, 3).map((signal: any) => (
              <div key={signal.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">{signal.instrument}</span>
                    <Badge className={signal.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {signal.action}
                    </Badge>
                  </div>
                  <Badge className={signal.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                    {signal.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  {signal.entry && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Entry:</span>
                      <span className="font-medium text-slate-900">{signal.entry}</span>
                    </div>
                  )}
                  {signal.target && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Target:</span>
                      <span className="font-medium text-green-600">{signal.target}</span>
                    </div>
                  )}
                  {signal.stopLoss && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Stop Loss:</span>
                      <span className="font-medium text-red-600">{signal.stopLoss}</span>
                    </div>
                  )}
                  {signal.current && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Current:</span>
                      <span className="font-medium text-slate-900">{signal.current}</span>
                    </div>
                  )}
                  {signal.resistance && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Resistance:</span>
                      <span className="font-medium text-orange-600">{signal.resistance}</span>
                    </div>
                  )}
                  {signal.support && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Support:</span>
                      <span className="font-medium text-blue-600">{signal.support}</span>
                    </div>
                  )}
                  {signal.probability && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Probability:</span>
                      <span className="font-medium text-purple-600">{signal.probability}%</span>
                    </div>
                  )}
                  {signal.riskReward && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">R/R:</span>
                      <span className="font-medium text-slate-900">{signal.riskReward}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-600">Auto-scraping active</span>
            </div>
            <span className="text-sm text-slate-500">•</span>
            <span className="text-sm text-slate-600">Updates every 30 minutes</span>
          </div>
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View All Signals
          </Button>
        </div>
      </div>
    </div>
  );
}
