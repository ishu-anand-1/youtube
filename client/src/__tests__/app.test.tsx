import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage.js';
import { CreateJoinPage } from '../pages/CreateJoinPage.js';

describe('Frontend Pages & Components', () => {
  it('renders LandingPage with Moonlit Petals headline and CTAs', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Watch Together\./i)).toBeDefined();
    expect(screen.getByText(/Even When You're Apart\./i)).toBeDefined();
    expect(screen.getAllByText(/Create Room/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Join a Room/i)).toBeDefined();
    expect(screen.getByText(/Synced playback · Live chat · Private rooms/i)).toBeDefined();
    expect(screen.getByText(/Watch in Sync/i)).toBeDefined();
    expect(screen.getAllByText(/Chat in Real Time/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Invite Friends/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Private Rooms/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders CreateJoinPage with Create and Join tabs', () => {
    render(
      <BrowserRouter>
        <CreateJoinPage initialTab="create" />
      </BrowserRouter>
    );

    expect(screen.getAllByText(/Create Room/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Join with Code/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/e\.g\. Alice/i)).toBeDefined();
  });
});
