import React from 'react';
import { Outlet } from 'react-router-dom';
import MoonlitPetals from './MoonlitPetals.js';
import { ErrorBoundary } from './ErrorBoundary.js';

export const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full bg-background text-text-primary overflow-x-hidden selection:bg-blossom/30 selection:text-white">
      {/* Global persistent Moonlit Petals Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <MoonlitPetals
          background="#08070D"
          blossomColor="#E9A7D4"
          speed={30}
          petals={95}
          wind={18}
          scale={95}
          direction="left"
          glow={35}
          hover={25}
          interactiveWindowPointer={true}
        />
        {/* Subtle dark plum vignette & contrast overlay for clean legibility */}
        <div className="absolute inset-0 bg-background/50 pointer-events-none" />
      </div>

      {/* Main interactive application content wrapped in ErrorBoundary */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  );
};
