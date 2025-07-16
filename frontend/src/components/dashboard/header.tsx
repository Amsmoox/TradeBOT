import { Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onCreateContent: () => void;
}

export function Header({ onCreateContent }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Content Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Manage and schedule content across all platforms</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={onCreateContent} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Content
          </Button>
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600" />
          </div>
        </div>
      </div>
    </header>
  );
}
