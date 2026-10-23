import React, { useState } from 'react';
import { X, Youtube, Tv } from 'lucide-react';
import { extractYouTubeVideoId, isValidYouTubeUrl, RoomRole } from '@watchtogether/shared';

interface ChangeVideoModalProps {
  isOpen: boolean;
  role: RoomRole;
  onClose: () => void;
  onSubmit: (videoId: string, title?: string) => void;
}

export const ChangeVideoModal: React.FC<ChangeVideoModalProps> = ({
  isOpen,
  role,
  onClose,
  onSubmit,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const canDirectChange = role === 'HOST' || role === 'MODERATOR';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const videoId = extractYouTubeVideoId(urlInput);
    if (!videoId || !isValidYouTubeUrl(urlInput)) {
      setError('Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...) or 11-character video ID');
      return;
    }

    onSubmit(videoId, titleInput.trim() || undefined);
    setUrlInput('');
    setTitleInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel-elevated rounded-3xl w-full max-w-md p-6 relative border border-white/10 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {canDirectChange ? 'Change YouTube Video' : 'Suggest Video Change'}
            </h3>
            <p className="text-xs text-slate-400">
              {canDirectChange
                ? 'Updates the synchronized video for everyone in the room'
                : 'Submits a request to the Host and Moderators'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              YouTube URL or Video ID
            </label>
            <input
              type="text"
              required
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 rounded-xl bg-surface-muted border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
            {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Custom Video Title (Optional)
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="e.g. My Favorite Song"
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl bg-surface-muted border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-surface-muted hover:bg-surface-hover text-slate-300 font-medium text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2"
            >
              <Tv className="w-4 h-4" />
              <span>{canDirectChange ? 'Change Video' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
