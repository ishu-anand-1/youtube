import React from 'react';
import { Heart, Flower2, Sparkles, Shield, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-blossom/10 py-10 text-xs text-text-secondary bg-surface/40 backdrop-blur-md relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-border">
          {/* Logo & Vision */}
          <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
            <div className="flex items-center gap-2">
              <Flower2 className="w-4 h-4 text-blossom animate-pulse-subtle" />
              <span className="font-extrabold text-sm text-text-primary">
                Watch<span className="text-blossom">Together</span>
              </span>
            </div>
            <p className="text-[11px] text-text-muted max-w-sm">
              Moonlit synchronized YouTube watch parties. Enjoy movies, music, and streams in real time with anyone, anywhere.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
            <Link to="/create" className="hover:text-blossom transition-colors">
              Create Room
            </Link>
            <Link to="/join" className="hover:text-blossom transition-colors">
              Join Room
            </Link>
            <a href="/#features" className="hover:text-blossom transition-colors">
              Features
            </a>
            <a href="/#how-it-works" className="hover:text-blossom transition-colors">
              How It Works
            </a>
          </div>
        </div>

        {/* Bottom Credits & Tech Badges */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-blossom fill-current inline animate-pulse-subtle" />
            <span>for shared cinema moments under moonlit blossoms</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400" /> WebSocket Sync
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-lavender" /> Role Permissions
            </span>
            <span>•</span>
            <span>YouTube IFrame API</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
