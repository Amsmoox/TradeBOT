import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { EconomicCalendar } from "@/components/dashboard/economic-calendar-enhanced";
import { MarketUpdates } from "@/components/dashboard/market-updates";
import { TradingSignalsEnhanced as TradingSignals } from "@/components/dashboard/trading-signals-enhanced";
import { SchedulingControls } from "@/components/dashboard/scheduling-controls";
import { ContentCreatorModal } from "@/components/dashboard/content-creator-modal";
import { RecentPosts } from "@/components/dashboard/recent-posts";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { useState } from "react";

export default function Dashboard() {
  const [isContentCreatorOpen, setIsContentCreatorOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onSettings={() => console.log('Settings clicked')}
          onCreateContent={() => setIsContentCreatorOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <EconomicCalendar />
            <MarketUpdates />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <RecentPosts />
            <ActivityChart />
          </div>
          
          <TradingSignals />
          <SchedulingControls />
        </main>
      </div>

      <ContentCreatorModal 
        isOpen={isContentCreatorOpen}
        onClose={() => setIsContentCreatorOpen(false)}
      />
    </div>
  );
}
