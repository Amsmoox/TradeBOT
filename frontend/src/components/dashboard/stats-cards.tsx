import { Edit, Clock, CheckCircle, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StatsData {
  todayPosts?: number;
  scheduledPosts?: number;
  activeSources?: number;
  aiGenerations?: number;
}

export function StatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/stats'],
  });
  
  const stats = data as StatsData || {};

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-2"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Today's Posts</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{stats?.todayPosts || 0}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Edit className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Scheduled</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{stats?.scheduledPosts || 0}</p>
          </div>
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Active Sources</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{stats?.activeSources || 0}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">AI Generations</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{stats?.aiGenerations || 0}</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
