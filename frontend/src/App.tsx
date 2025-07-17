import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/contexts/SettingsContext";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import TestContent from "@/pages/test-content";
import EconomicCalendar from "@/pages/economic-calendar";
import MarketNews from "@/pages/market-news";
import TradingSignals from "@/pages/trading-signals";

// Simple test component for pages we haven't tested yet
function SimpleTest({ pageName }: { pageName: string }) {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">{pageName}</h1>
        <p className="text-gray-600 mt-2">This page is working! ✅</p>
        <div className="mt-4 space-x-4">
          <a href="/" className="text-blue-600 hover:underline">Dashboard</a>
          <a href="/settings" className="text-blue-600 hover:underline">Settings</a>
          <a href="/content" className="text-blue-600 hover:underline">Content</a>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/content" component={TestContent} />
      <Route path="/economic-calendar" component={EconomicCalendar} />
      <Route path="/market-news" component={MarketNews} />
      <Route path="/trading-signals" component={TradingSignals} />
      <Route component={() => (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">404</h1>
            <p className="text-gray-600">Page not found</p>
          </div>
        </div>
      )} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SettingsProvider>
          <Router />
        </SettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;