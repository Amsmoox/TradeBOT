import { Clock, TrendingUp } from "lucide-react";

const recentPosts = [
  {
    module: "Economic Calendar",
    platform: "Telegram",
    content: "📊 Non-Farm Payrolls: 216K vs 180K exp...",
    time: "2 hours ago",
    status: "success",
    engagement: "24 👀"
  },
  {
    module: "Trading Signals", 
    platform: "Twitter",
    content: "🎯 EUR/USD SELL at 1.0850...",
    time: "45 minutes ago",
    status: "success",
    engagement: "12 ❤️"
  },
  {
    module: "Market Updates",
    platform: "Discord",
    content: "🔥 S&P 500 breaks resistance at 4,850...",
    time: "1 hour ago", 
    status: "success",
    engagement: "8 💬"
  }
];

export function RecentPosts() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Recent Posts</h3>
            <p className="text-sm text-slate-600">Last posts per module</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {recentPosts.map((post, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full mt-2 ${
                post.status === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900">
                    {post.module} → {post.platform}
                  </span>
                  <span className="text-xs text-slate-500">{post.time}</span>
                </div>
                <p className="text-sm text-slate-600 truncate">{post.content}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{post.engagement}</span>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    post.status === 'success' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {post.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
