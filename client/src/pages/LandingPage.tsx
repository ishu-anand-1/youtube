import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Users, 
  Zap, 
  ShieldCheck, 
  MessageSquare, 
  ArrowRight, 
  Lock,
  Tv, 
  CheckCircle2,
  Flower2,
  Share2,
  Play
} from 'lucide-react';
import { Header } from '../components/common/Header.js';
import { Footer } from '../components/common/Footer.js';
import RoundCarousel from '../components/common/RoundCarousel.js';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-text-primary">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
          {/* Subtle atmospheric ambient glow behind the hero copy */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-blossom/10 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[450px] h-[350px] bg-lavender/10 blur-[150px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Left Column: Headline, Description & CTAs */}
              <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
                {/* Pill Tag */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blossom/10 border border-blossom/25 text-blossom text-xs font-semibold mb-6 animate-pulse-subtle">
                  <Flower2 className="w-3.5 h-3.5" />
                  <span>Moonlit Synchronized YouTube Watch Parties</span>
                </div>

                {/* Headline: Exact required phrasing */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.1]">
                  Watch Together.{' '}
                  <span className="bg-gradient-to-r from-blossom via-lavender to-blossom-light bg-clip-text text-transparent">
                    Even When You're Apart.
                  </span>
                </h1>

                {/* Supporting Copy */}
                <p className="mt-5 text-base sm:text-lg text-text-secondary max-w-xl leading-relaxed">
                  Stream your favorite YouTube videos with friends in perfect frame synchronization. Chat in real time, share reactions, and enjoy private watch rooms with effortless host moderation.
                </p>

                {/* CTA Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <Link
                    to="/create"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blossom hover:bg-blossom-hover text-background font-extrabold text-sm sm:text-base shadow-blossom-md hover:shadow-blossom-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>Create Room</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/join"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl glass-panel hover:bg-surface-elevated text-text-primary hover:text-white font-semibold text-sm sm:text-base border border-blossom/20 hover:border-blossom/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4 text-lavender" />
                    <span>Join a Room</span>
                  </Link>
                </div>

                {/* Compact Feature Line: Exact required phrase */}
                <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-blossom/90 bg-surface/60 px-4 py-1.5 rounded-full border border-blossom/15">
                  <Sparkles className="w-3.5 h-3.5 text-blossom" />
                  <span>Synced playback · Live chat · Private rooms</span>
                </div>

                {/* Quick Trust / Feature badges */}
                <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Instant Guest Join</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Sub-second Drift Sync</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Zero Ad Interruptions</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3D Round Carousel Preview */}
              <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center justify-center relative w-full overflow-visible">
                <div className="relative w-full h-[380px] sm:h-[440px] lg:h-[480px] flex items-center justify-center">
                  <RoundCarousel
                    imageWidth={250}
                    imageHeight={310}
                    spacing={3}
                    speed={2.2}
                    direction="right"
                    tilt={-5}
                    perspective={2200}
                    cornerRadius={24}
                    innerDim={2.5}
                    drag={true}
                    sensitivity={3.5}
                    background="transparent"
                  />
                </div>

                <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-text-secondary bg-surface/70 px-3.5 py-1 rounded-full border border-blossom/15 shadow-sm">
                  <Sparkles className="w-3 h-3 text-blossom" />
                  <span>Interactive 3D Carousel — Drag horizontally to rotate</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 FEATURE CARDS SECTION */}
        <section id="features" className="py-20 border-t border-blossom/10 bg-surface/30 backdrop-blur-sm relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blossom mb-2">
                Engineered for Shared Moments
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
                Everything you need for seamless watch parties
              </h3>
              <p className="mt-3 text-sm text-text-secondary">
                Designed to make distance disappear with synchronized streams, instant communication, and thoughtful moderation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1: Watch in Sync */}
              <div className="glass-panel p-6 rounded-2xl border border-border hover:border-blossom/40 hover:shadow-blossom-sm transition-all duration-300 flex flex-col gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-blossom/15 text-blossom flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-text-primary">Watch in Sync</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Sub-second drift correction and authoritative server timestamps ensure every viewer sees the exact same frame, whether on mobile or desktop.
                </p>
              </div>

              {/* Feature 2: Chat in Real Time */}
              <div className="glass-panel p-6 rounded-2xl border border-border hover:border-lavender/40 hover:shadow-lavender-glow transition-all duration-300 flex flex-col gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-lavender/15 text-lavender flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-text-primary">Chat in Real Time</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  React live with emojis, burst confetti, reply to specific messages, and communicate naturally while enjoying your videos together.
                </p>
              </div>

              {/* Feature 3: Invite Friends */}
              <div className="glass-panel p-6 rounded-2xl border border-border hover:border-blossom/40 hover:shadow-blossom-sm transition-all duration-300 flex flex-col gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-blossom/15 text-blossom flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Share2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-text-primary">Invite Friends</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Share a simple 6-character room code or instant URL via WhatsApp, Discord, or iMessage. No mandatory app download or registration needed.
                </p>
              </div>

              {/* Feature 4: Private Rooms */}
              <div className="glass-panel p-6 rounded-2xl border border-border hover:border-lavender/40 hover:shadow-lavender-glow transition-all duration-300 flex flex-col gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-lavender/15 text-lavender flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-text-primary">Private Rooms</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Protect your party with room privacy toggles, participant permission requests, and role hierarchy for Host and Moderator control.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20 border-t border-blossom/10 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-blossom mb-2">
                Simplicity First
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
                How WatchTogether Works
              </h3>
              <p className="mt-3 text-sm text-text-secondary">
                Three effortless steps from paste to play.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center p-6 glass-panel rounded-2xl border border-border hover:border-blossom/30 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-blossom text-background font-black text-lg flex items-center justify-center mb-4 shadow-blossom-sm">
                  1
                </div>
                <h4 className="text-base font-bold text-text-primary mb-2">Create a Room</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Choose your display name, paste a YouTube link (or start with chill music), and generate your unique 6-character room code.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center p-6 glass-panel rounded-2xl border border-border hover:border-lavender/30 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-lavender text-background font-black text-lg flex items-center justify-center mb-4 shadow-lavender-glow">
                  2
                </div>
                <h4 className="text-base font-bold text-text-primary mb-2">Invite Friends</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Copy the party link with one click or send the room code. Friends join instantaneously from any modern browser.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center p-6 glass-panel rounded-2xl border border-border hover:border-blossom/30 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blossom to-lavender text-background font-black text-lg flex items-center justify-center mb-4 shadow-blossom-sm">
                  3
                </div>
                <h4 className="text-base font-bold text-text-primary mb-2">Enjoy in Sync</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Every play, pause, seek, and queue addition is synchronized with sub-second accuracy across every screen.
                </p>
              </div>
            </div>

            {/* Bottom Call to Action banner */}
            <div id="about" className="mt-20 p-8 sm:p-12 glass-panel-elevated rounded-3xl border border-blossom/20 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blossom/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -top-20 w-64 h-64 bg-lavender/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-blossom/20 border border-blossom/30 flex items-center justify-center text-blossom mb-4">
                  <Flower2 className="w-6 h-6 animate-pulse-subtle" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
                  Ready to start your watch party?
                </h3>
                <p className="mt-3 text-sm text-text-secondary max-w-lg leading-relaxed">
                  Bring friends, family, and communities together under the moonlit blossoms. No software installation, completely free.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                  <Link
                    to="/create"
                    className="px-8 py-3.5 rounded-2xl bg-blossom hover:bg-blossom-hover text-background font-bold text-sm shadow-blossom-md hover:shadow-blossom-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Create a Watch Room</span>
                  </Link>
                  <Link
                    to="/join"
                    className="px-8 py-3.5 rounded-2xl glass-panel hover:bg-surface-elevated text-text-primary font-semibold text-sm border border-blossom/20 hover:border-blossom/40 transition-all hover:scale-105"
                  >
                    <span>Join with Code</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
