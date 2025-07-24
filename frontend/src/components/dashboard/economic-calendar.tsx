import { BarChart3, Settings, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EconomicCalendar() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/economic-events/today'],
  });

  const getImpactColor = (impact: string) => {
    switch (impact?.toUpperCase()) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-orange-100 text-orange-800';
      case 'LOW': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Economic Calendar</h3>
              <p className="text-sm text-slate-600">Daily economic events and data</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse p-4 bg-slate-50 rounded-lg">
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : Array.isArray(events) && events.length > 0 ? (
          <div className="space-y-4">
            {events.slice(0, 2).map((event: any) => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Badge className={getImpactColor(event.impact)}>
                      {event.impact?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                    <span className="font-medium text-slate-900">{event.title}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    <span className="mr-4">Expected: {event.expected || 'N/A'}</span>
                    <span className="mr-4">Previous: {event.previous || 'N/A'}</span>
                    <span className="text-blue-600 font-medium">
                      Current: {event.actual || '--'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {formatTime(event.time)}
                  </p>
                  <p className="text-xs text-slate-500">Today</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No economic events scheduled for today</p>
            <p className="text-sm text-slate-500">Events will appear here when scheduled</p>
          </div>
        )}
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-slate-600">Auto-posting enabled</span>
          </div>
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View All Events
          </Button>
        </div>
      </div>
    </div>
  );
}
