import { Settings, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onSettings?: () => void;
  onCreateContent?: () => void;
}

export function Header({ onSettings, onCreateContent }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Trading Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Monitor markets, signals, and trading performance</p>
        </div>
        <div className="flex items-center space-x-3">
          {onCreateContent && (
            <Button onClick={onCreateContent} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          )}
          <Button onClick={onSettings} variant="outline" className="hover:bg-slate-50">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600" />
          </div>
        </div>
      </div>
    </header>
  );
}
