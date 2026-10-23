import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/common/Header.js';
import { Footer } from '../components/common/Footer.js';
import { roomApi } from '../lib/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useRoomStore } from '../store/useRoomStore.js';
import { Sparkles, Users, Tv, Loader2, AlertCircle } from 'lucide-react';
import { extractYouTubeVideoId, isValidYouTubeUrl } from '@watchtogether/shared';

interface CreateJoinPageProps {
  initialTab?: 'create' | 'join';
}

export const CreateJoinPage: React.FC<CreateJoinPageProps> = ({ initialTab = 'create' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'create' | 'join'>(initialTab);

  const { setSession, user } = useAuthStore();
  const { setRoom } = useRoomStore();

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createVideoUrl, setCreateVideoUrl] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState(user?.displayName || '');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join form state
  const [joinCode, setJoinCode] = useState(searchParams.get('code')?.toUpperCase() || '');
  const [joinDisplayName, setJoinDisplayName] = useState(user?.displayName || '');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setTab('join');
      setJoinCode(codeParam.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    if (user?.displayName) {
      if (!createDisplayName) setCreateDisplayName(user.displayName);
      if (!joinDisplayName) setJoinDisplayName(user.displayName);
    }
  }, [user]);

  // Handle Create Room
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const displayName = createDisplayName.trim();
    if (displayName.length < 2) {
      setCreateError('Please enter a display name (at least 2 characters)');
      return;
    }

    if (createVideoUrl.trim() && !isValidYouTubeUrl(createVideoUrl.trim())) {
      setCreateError('Please enter a valid YouTube video URL or ID');
      return;
    }

    setIsCreating(true);
    try {
      const res = await roomApi.createRoom({
        name: createName.trim() || undefined,
        videoUrl: createVideoUrl.trim() || undefined,
        displayName,
      });

      setSession(res.session);
      setRoom(res.room, 'HOST');
      navigate(`/room/${res.room.id}`);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Join Room
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    const code = joinCode.trim().toUpperCase();
    const displayName = joinDisplayName.trim();

    if (code.length !== 6) {
      setJoinError('Room code must be exactly 6 alphanumeric characters');
      return;
    }

    if (displayName.length < 2) {
      setJoinError('Please enter a display name (at least 2 characters)');
      return;
    }

    setIsJoining(true);
    try {
      const res = await roomApi.joinRoom({
        roomCode: code,
        displayName,
      });

      setSession(res.session);
      setRoom(res.room, res.participant.role);
      navigate(`/room/${res.room.id}`);
    } catch (err: any) {
      setJoinError(err.message || 'Could not join room. Check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 py-12 relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-accent/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Card Container */}
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
            {/* Tab Switches */}
            <div className="flex rounded-2xl bg-surface-muted p-1 mb-6 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setTab('create');
                  setCreateError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  tab === 'create'
                    ? 'bg-accent text-white shadow-md shadow-accent/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Party</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('join');
                  setJoinError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  tab === 'join'
                    ? 'bg-accent text-white shadow-md shadow-accent/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Join with Code</span>
              </button>
            </div>

            {/* CREATE FORM */}
            {tab === 'create' && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Create a Watch Party</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    You'll be the Host with full playback and room management controls.
                  </p>
                </div>

                {createError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Your Name / Nickname *
                  </label>
                  <input
                    type="text"
                    required
                    value={createDisplayName}
                    onChange={(e) => setCreateDisplayName(e.target.value)}
                    placeholder="e.g. Alice"
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl bg-surface-muted border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Party Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Friday Anime Night"
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl bg-surface-muted border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Initial YouTube URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={createVideoUrl}
                    onChange={(e) => setCreateVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 rounded-xl bg-surface-muted border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Leave blank to start with a chill Lofi stream!
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-xl shadow-accent/25 hover:shadow-accent/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Room...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Start Watch Party</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* JOIN FORM */}
            {tab === 'join' && (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Join a Watch Party</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter the 6-character room code provided by your friend.
                  </p>
                </div>

                {joinError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{joinError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Room Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="e.g. 4Q688N"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-surface-muted border border-white/10 text-accent font-mono text-xl font-bold tracking-widest text-center uppercase placeholder-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Your Name / Nickname *
                  </label>
                  <input
                    type="text"
                    required
                    value={joinDisplayName}
                    onChange={(e) => setJoinDisplayName(e.target.value)}
                    placeholder="e.g. Bob"
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl bg-surface-muted border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isJoining || joinCode.length !== 6}
                  className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-xl shadow-accent/25 hover:shadow-accent/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Join Watch Party</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
