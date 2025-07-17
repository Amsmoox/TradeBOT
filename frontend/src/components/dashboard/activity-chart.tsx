import { BarChart3, TrendingUp } from "lucide-react";

const activityData = [
  { day: "Mon", posts: 12, engagement: 85 },
  { day: "Tue", posts: 15, engagement: 92 },
  { day: "Wed", posts: 8, engagement: 78 },
  { day: "Thu", posts: 18, engagement: 95 },
  { day: "Fri", posts: 22, engagement: 88 },
  { day: "Sat", posts: 6, engagement: 65 },
  { day: "Sun", posts: 4, engagement: 55 }
];

export function ActivityChart() {
  const maxPosts = Math.max(...activityData.map(d => d.posts));
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Platform Activity</h3>
              <p className="text-sm text-slate-600">Posts over time</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">+12% this week</span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {activityData.map((day, index) => (
            <div key={day.day} className="flex items-center space-x-4">
              <div className="w-8 text-sm font-medium text-slate-600">{day.day}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${(day.posts / maxPosts) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">{day.posts}</span>
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-medium text-slate-900">{day.engagement}%</span>
                    <div className="text-xs text-slate-500">engagement</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-slate-600">Posts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-slate-600">Engagement</span>
            </div>
          </div>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View detailed analytics →
          </button>
        </div>
      </div>
    </div>
  );
}
