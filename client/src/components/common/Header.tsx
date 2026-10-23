import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent to-violet-500 flex items-center justify-center text-white shadow-lg shadow-accent/25 group-hover:scale-105 transition-all">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">
            Watch<span className="text-accent">Together</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/join"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Join Room
          </Link>
          <Link
            to="/create"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-md shadow-accent/25 hover:shadow-accent/40 transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Party</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
