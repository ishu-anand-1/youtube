import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage.js';
import { CreateJoinPage } from '../pages/CreateJoinPage.js';

describe('Frontend Pages & Components', () => {
  it('renders LandingPage with strong headline and CTAs', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Your favorite videos\./i)).toBeDefined();
    expect(screen.getByText(/Everyone together\./i)).toBeDefined();
    expect(screen.getByText(/Create a Watch Party/i)).toBeDefined();
    expect(screen.getByText(/Join with Room Code/i)).toBeDefined();
  });

  it('renders CreateJoinPage with Create and Join tabs', () => {
    render(
      <BrowserRouter>
        <CreateJoinPage initialTab="create" />
      </BrowserRouter>
    );

    expect(screen.getAllByText(/Create Party/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Join with Code/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/e\.g\. Alice/i)).toBeDefined();
  });
});
