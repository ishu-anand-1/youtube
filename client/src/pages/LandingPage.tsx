import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Users, 
  Zap, 
  ShieldCheck, 
  MessageSquare, 
  Play, 
  ArrowRight, 
  Crown, 
  Tv, 
  CheckCircle2 
} from 'lucide-react';
import { Header } from '../components/common/Header.js';
import { Footer } from '../components/common/Footer.js';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
          {/* Subtle ambient light glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-violet-600/10 blur-[140px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-6 animate-pulse-subtle">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time YouTube Synchronization Engine</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
              Your favorite videos.{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-accent to-violet-400 bg-clip-text text-transparent">
                Everyone together.
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Create synchronized watch parties in seconds. Stream YouTube videos with friends in perfect harmony, with role-based permissions, participant requests, and real-time chat.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/create"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-base shadow-xl shadow-accent/25 hover:shadow-accent/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
              >
                <span>Create a Watch Party</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/join"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel hover:bg-surface-hover text-slate-200 hover:text-white font-semibold text-base transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Join with Room Code</span>
              </Link>
            </div>

            {/* Live Watch Party Visual Preview */}
            <div className="mt-16 max-w-5xl mx-auto glass-panel-elevated rounded-3xl p-3 sm:p-4 border border-white/10 glow-card relative">
              <div className="rounded-2xl overflow-hidden bg-slate-950 aspect-video relative flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-transparent to-slate-950/90 border border-white/5">
                {/* Simulated Top Bar */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-white">Lofi Hip Hop Radio</span>
                    <span className="text-slate-400 font-mono text-[10px]">ROOM #PARTY1</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs text-amber-300">
                    <Crown className="w-3.5 h-3.5" />
                    <span className="font-medium text-[11px]">Alex is Host</span>
                  </div>
                </div>

                {/* Simulated Center Player Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/80 backdrop-blur-md text-white flex items-center justify-center shadow-2xl shadow-accent/50 group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                </div>

                {/* Simulated Bottom Controls */}
                <div className="flex items-center justify-between z-10 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-300">03:45 / 15:20</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">AL</div>
                      <div className="w-7 h-7 rounded-full bg-violet-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">BO</div>
                      <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">CH</div>
                    </div>
                    <span className="text-xs text-slate-300 ml-1">4 Watching</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="py-20 border-t border-white/5 bg-surface-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">
                Features Engineered for Perfection
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
                Everything you need for seamless watch parties
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-accent/40 transition-all flex flex-col gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Real-Time Sync</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sub-second drift correction and authoritative server timeline ensure everyone views the exact same frame.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-accent/40 transition-all flex flex-col gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Role Hierarchy</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Strict Host, Moderator, and Participant roles enforce that only authorized members execute playback actions.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-accent/40 transition-all flex flex-col gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Tv className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Request Workflow</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Participants can request play, pause, seek, or new videos with one click for Host and Moderator review.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-accent/40 transition-all flex flex-col gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Live Room Chat</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Built-in room chat with sender role badges lets you laugh, comment, and react together in real time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">
                Simplicity First
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
                How WatchTogether Works
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 glass-panel rounded-2xl border border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-accent text-white font-extrabold text-lg flex items-center justify-center mb-4 shadow-lg shadow-accent/30">
                  1
                </div>
                <h4 className="text-base font-bold text-white mb-2">Create a Room</h4>
                <p className="text-xs text-slate-400">
                  Enter your name, pick an initial YouTube video, and get your unique 6-character room code.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 glass-panel rounded-2xl border border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-violet-500 text-white font-extrabold text-lg flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
                  2
                </div>
                <h4 className="text-base font-bold text-white mb-2">Invite Friends</h4>
                <p className="text-xs text-slate-400">
                  Send the invite link or 6-digit room code to your friends on WhatsApp, Discord, or SMS.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 glass-panel rounded-2xl border border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white font-extrabold text-lg flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                  3
                </div>
                <h4 className="text-base font-bold text-white mb-2">Enjoy in Sync</h4>
                <p className="text-xs text-slate-400">
                  Sit back as playback, pauses, seeks, and chat synchronize across every device automatically.
                </p>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 text-center">
              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-xl shadow-accent/25 transition-all hover:scale-105"
              >
                <span>Start Watching Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
