import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/common/Header.js';
import { Footer } from '../components/common/Footer.js';
import { roomApi } from '../lib/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useRoomStore, RecentRoom } from '../store/useRoomStore.js';
import { Sparkles, Users, Loader2, AlertCircle, Lock, Unlock, History, ArrowRight, Flower2 } from 'lucide-react';
import { isValidYouTubeUrl } from '@watchtogether/shared';

const AVATAR_COLORS = [
  '#E9A7D4', // Blossom Pink
  '#C7A6FF', // Lavender
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
];

interface CreateJoinPageProps {
  initialTab?: 'create' | 'join';
}

export const CreateJoinPage: React.FC<CreateJoinPageProps> = ({ initialTab = 'create' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'create' | 'join'>(initialTab);

  const { setSession, user } = useAuthStore();
  const { setRoom, getRecentRooms } = useRoomStore();

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createVideoUrl, setCreateVideoUrl] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState(user?.displayName || '');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join form state
  const [joinCode, setJoinCode] = useState(searchParams.get('code')?.toUpperCase() || '');
  const [joinDisplayName, setJoinDisplayName] = useState(user?.displayName || '');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Recent Rooms
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);

  useEffect(() => {
    setRecentRooms(getRecentRooms());
  }, []);

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
        avatarColor,
        isPrivate,
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
        avatarColor,
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

  const handleSelectRecentRoom = (code: string) => {
    setTab('join');
    setJoinCode(code);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-text-primary">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 py-12 relative overflow-hidden">
        {/* Soft atmospheric ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-blossom/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10 flex flex-col gap-4">
          {/* Card Container */}
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-blossom/20 shadow-2xl backdrop-blur-xl">
            {/* Tab Switches */}
            <div className="flex rounded-2xl bg-surface p-1 mb-6 border border-border">
              <button
                type="button"
                onClick={() => {
                  setTab('create');
                  setCreateError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  tab === 'create'
                    ? 'bg-blossom text-background shadow-blossom-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Room</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('join');
                  setJoinError(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  tab === 'join'
                    ? 'bg-blossom text-background shadow-blossom-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Join with Code</span>
              </button>
            </div>

            {/* Avatar Color Selector */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                <Flower2 className="w-3.5 h-3.5 text-blossom" />
                <span>Avatar Blossom Color</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 rounded-full transition-all transform ${
                      avatarColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-surface shadow-md' : 'opacity-80 hover:opacity-100 hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* CREATE FORM */}
            {tab === 'create' && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Create a Watch Room</h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    You'll be the Host with full playback and party control.
                  </p>
                </div>

                {createError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Your Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createDisplayName}
                    onChange={(e) => setCreateDisplayName(e.target.value)}
                    placeholder="e.g. Alice"
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-blossom focus:ring-1 focus:ring-blossom transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Room Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Friday Anime Night"
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-blossom focus:ring-1 focus:ring-blossom transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Initial YouTube Video (Optional)
                  </label>
                  <input
                    type="text"
                    value={createVideoUrl}
                    onChange={(e) => setCreateVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-blossom focus:ring-1 focus:ring-blossom transition-all"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Leave blank to start with a relaxing Lofi stream!
                  </p>
                </div>

                {/* Private Room Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface/70 border border-border">
                  <div className="flex items-center gap-2">
                    {isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                    <div>
                      <div className="text-xs font-semibold text-text-primary">Private Party</div>
                      <div className="text-[11px] text-text-muted">Require exact invite link or code</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 accent-blossom rounded cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3.5 rounded-xl bg-blossom hover:bg-blossom-hover text-background font-bold text-sm shadow-blossom-sm hover:shadow-blossom-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
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
                  <h2 className="text-xl font-bold text-text-primary">Join a Watch Room</h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Enter the 6-character room code from your invitation.
                  </p>
                </div>

                {joinError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{joinError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Room Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="e.g. 4Q688N"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-blossom font-mono text-xl font-black tracking-widest text-center uppercase placeholder:text-text-muted focus:outline-none focus:border-blossom focus:ring-1 focus:ring-blossom transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Your Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={joinDisplayName}
                    onChange={(e) => setJoinDisplayName(e.target.value)}
                    placeholder="e.g. Bob"
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-blossom focus:ring-1 focus:ring-blossom transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isJoining || joinCode.length !== 6}
                  className="w-full py-3.5 rounded-xl bg-blossom hover:bg-blossom-hover text-background font-bold text-sm shadow-blossom-sm hover:shadow-blossom-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
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

          {/* Recent Rooms List */}
          {recentRooms.length > 0 && (
            <div className="glass-panel rounded-2xl p-4 border border-blossom/15 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-text-secondary">
                <History className="w-3.5 h-3.5 text-blossom" />
                <span>Recently Visited Rooms</span>
              </div>
              <div className="space-y-1.5">
                {recentRooms.map((r) => (
                  <button
                    key={r.code}
                    onClick={() => handleSelectRecentRoom(r.code)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surface/60 hover:bg-surface border border-border transition-all text-left text-xs hover:border-blossom/20 group"
                  >
                    <div>
                      <span className="font-semibold text-text-primary group-hover:text-blossom transition-colors">{r.name}</span>
                      <span className="font-mono text-blossom ml-2 text-[11px] font-bold">#{r.code}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-blossom group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
