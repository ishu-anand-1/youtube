import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Sparkles, Menu, X, Flower2, Users } from 'lucide-react';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (!isHome) return;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-blossom/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-blossom to-lavender flex items-center justify-center text-background shadow-blossom-sm group-hover:scale-105 group-hover:shadow-blossom-md transition-all duration-300">
            <Play className="w-4 h-4 fill-current ml-0.5" />
            <Flower2 className="w-3 h-3 text-white absolute -top-1 -right-1 drop-shadow animate-pulse-subtle" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-text-primary">
            Watch<span className="bg-gradient-to-r from-blossom via-lavender to-blossom-light bg-clip-text text-transparent">Together</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-text-secondary">
          <a
            href="/#features"
            onClick={(e) => {
              if (isHome) {
                e.preventDefault();
                scrollToSection('features');
              }
            }}
            className="hover:text-blossom transition-colors cursor-pointer"
          >
            Features
          </a>
          <a
            href="/#how-it-works"
            onClick={(e) => {
              if (isHome) {
                e.preventDefault();
                scrollToSection('how-it-works');
              }
            }}
            className="hover:text-blossom transition-colors cursor-pointer"
          >
            How It Works
          </a>
          <a
            href="/#about"
            onClick={(e) => {
              if (isHome) {
                e.preventDefault();
                scrollToSection('about');
              }
            }}
            className="hover:text-blossom transition-colors cursor-pointer"
          >
            About
          </a>
        </nav>

        {/* Action Buttons (Desktop) */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            to="/join"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80 border border-transparent hover:border-blossom/15 transition-all"
          >
            Join Room
          </Link>
          <Link
            to="/create"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blossom hover:bg-blossom-hover text-background font-bold text-xs shadow-blossom-sm hover:shadow-blossom-md transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Room</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            to="/create"
            className="px-3 py-1.5 rounded-lg bg-blossom text-background font-bold text-xs shadow-sm"
          >
            Create
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-text-secondary hover:text-white hover:bg-surface-elevated transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden glass-panel-elevated border-b border-blossom/15 px-4 pt-2 pb-5 space-y-3 animate-fade-in">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-text-secondary pt-2">
            <a
              href="/#features"
              onClick={(e) => {
                if (isHome) {
                  e.preventDefault();
                  scrollToSection('features');
                } else {
                  setMobileMenuOpen(false);
                }
              }}
              className="px-3 py-2 rounded-lg hover:bg-surface hover:text-blossom transition-colors"
            >
              Features
            </a>
            <a
              href="/#how-it-works"
              onClick={(e) => {
                if (isHome) {
                  e.preventDefault();
                  scrollToSection('how-it-works');
                } else {
                  setMobileMenuOpen(false);
                }
              }}
              className="px-3 py-2 rounded-lg hover:bg-surface hover:text-blossom transition-colors"
            >
              How It Works
            </a>
            <a
              href="/#about"
              onClick={(e) => {
                if (isHome) {
                  e.preventDefault();
                  scrollToSection('about');
                } else {
                  setMobileMenuOpen(false);
                }
              }}
              className="px-3 py-2 rounded-lg hover:bg-surface hover:text-blossom transition-colors"
            >
              About
            </a>
          </nav>
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            <Link
              to="/join"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl text-xs font-semibold text-text-primary bg-surface border border-blossom/20"
            >
              Join a Room
            </Link>
            <Link
              to="/create"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl text-xs font-bold text-background bg-blossom shadow-blossom-sm"
            >
              Create Room
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
