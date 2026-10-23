import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 font-medium">
          <span>WatchTogether Platform</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-current inline" /> for shared moments
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Real-time WebSocket Sync</span>
          <span>•</span>
          <span>Role-Based Access</span>
          <span>•</span>
          <span>YouTube IFrame API</span>
        </div>
      </div>
    </footer>
  );
};
