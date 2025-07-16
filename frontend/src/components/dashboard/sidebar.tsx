import { Calendar, Settings, BarChart3, Zap, Home, FileText, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

export function Sidebar() {
  const [location] = useLocation();
  const { data: platformConfigs } = useQuery({
    queryKey: ['/api/platform-configs'],
  });

  const getPlatformStatus = (platform: string) => {
    const config = Array.isArray(platformConfigs) ? platformConfigs.find((p: any) => p.platform === platform) : null;
    return {
      status: config?.status || 'inactive',
      enabled: config?.enabled || false,
      name: config?.config?.name || platform,
      handle: config?.config?.handle || '',
    };
  };

  const isActive = (path: string) => location === path;

  return (
    <div className="w-64 bg-white shadow-sm border-r border-slate-200 flex flex-col">
      {/* Logo Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Content_Bot</h1>
            <p className="text-xs text-slate-500">Multi-Platform Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/" className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
          isActive('/') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        } transition-colors`}>
          <Home className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        
        <div className="pt-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-3">Content Modules</p>
          <Link href="/economic-calendar" className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
            isActive('/economic-calendar') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          } transition-colors`}>
            <Calendar className="w-5 h-5" />
            <span>Economic Calendar</span>
          </Link>
          <Link href="/market-news" className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
            isActive('/market-news') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          } transition-colors`}>
            <TrendingUp className="w-5 h-5" />
            <span>Market News</span>
          </Link>
          <Link href="/trading-signals" className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
            isActive('/trading-signals') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          } transition-colors`}>
            <Zap className="w-5 h-5" />
            <span>Trading Signals</span>
          </Link>
        </div>

        <div className="pt-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-3">Management</p>
          <Link href="/content" className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
            isActive('/content') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          } transition-colors`}>
            <FileText className="w-5 h-5" />
            <span>Content Posts</span>
          </Link>
          <Link href="/settings" className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
            isActive('/settings') ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          } transition-colors`}>
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* Platform Status */}
      <div className="p-4 border-t border-slate-200">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Platform Status</h3>
        <div className="space-y-2">
          {['telegram', 'twitter', 'discord', 'websites'].map((platform) => {
            const platformInfo = getPlatformStatus(platform);
            const statusColor = platformInfo.status === 'active' ? 'bg-green-500' : 
                               platformInfo.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500';
            const statusText = platformInfo.status === 'active' ? 'Active' : 
                              platformInfo.status === 'pending' ? 'Pending' : 'Inactive';
            const statusTextColor = platformInfo.status === 'active' ? 'text-green-600' : 
                                   platformInfo.status === 'pending' ? 'text-yellow-600' : 'text-red-600';

            return (
              <div key={platform} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 ${statusColor} rounded-full`}></div>
                  <span className="text-sm text-slate-600">
                    {platformInfo.name}
                  </span>
                </div>
                <span className={`text-xs font-medium ${statusTextColor}`}>
                  {statusText}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
