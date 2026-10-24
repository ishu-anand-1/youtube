import React, { useState } from 'react';
import { QueueItem, RoomRole } from '@watchtogether/shared';
import { ListPlus, Play, Trash2, Video, Sparkles, Film } from 'lucide-react';
import { roomApi } from '../../lib/api.js';
import { toast } from 'sonner';

interface QueuePanelProps {
  roomId: string;
  queue: QueueItem[];
  role: RoomRole;
  currentVideoId?: string;
  onPlayItem?: (videoId: string) => void;
}

export const QueuePanel: React.FC<QueuePanelProps> = ({
  roomId,
  queue,
  role,
  currentVideoId,
}) => {
  const [videoInput, setVideoInput] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = role === 'HOST' || role === 'MODERATOR';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoInput.trim()) return;

    try {
      setIsSubmitting(true);
      await roomApi.addToQueue(roomId, videoInput.trim(), videoTitle.trim() || undefined);
      toast.success('Video added to party queue!');
      setVideoInput('');
      setVideoTitle('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add video to queue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await roomApi.removeFromQueue(roomId, itemId);
      toast.success('Removed from queue');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove from queue');
    }
  };

  const handlePlayNext = async () => {
    try {
      await roomApi.playNextInQueue(roomId);
      toast.success('Playing next video in queue');
    } catch (err: any) {
      toast.error(err.message || 'Failed to play next video');
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface/40 backdrop-blur-md">
      {/* Header & Quick Action */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Film className="w-4 h-4 text-blossom" />
            Watch Queue ({queue.length})
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">Shared party playlist</p>
        </div>
        {canManage && queue.length > 0 && (
          <button
            onClick={handlePlayNext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blossom/20 hover:bg-blossom/30 text-blossom text-xs font-semibold border border-blossom/30 transition-all hover:scale-105 active:scale-95"
            title="Play the next queued video now"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Play Next
          </button>
        )}
      </div>

      {/* Add Video Form */}
      <form onSubmit={handleAdd} className="p-4 border-b border-border bg-surface/50 flex flex-col gap-2.5">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste YouTube URL or ID..."
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-surface rounded-xl border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blossom"
          />
          <button
            type="submit"
            disabled={isSubmitting || !videoInput.trim()}
            className="px-3 py-2 rounded-xl bg-blossom hover:bg-blossom-hover disabled:opacity-50 text-background text-xs font-bold transition-all flex items-center gap-1.5 shadow-blossom-sm"
          >
            <ListPlus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
        <input
          type="text"
          placeholder="Optional custom title..."
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-surface/70 rounded-lg border border-border text-text-secondary placeholder:text-text-muted focus:outline-none focus:border-blossom/60"
        />
      </form>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-text-muted p-6">
            <Video className="w-10 h-10 text-text-muted/60 mb-2" />
            <p className="text-sm font-medium text-text-secondary">Queue is empty</p>
            <p className="text-xs text-text-muted mt-1 max-w-[200px]">
              Paste any YouTube video link above to queue it up for everyone!
            </p>
          </div>
        ) : (
          queue.map((item, index) => {
            const isCurrent = currentVideoId === item.videoId;
            const thumbUrl = `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;

            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-blossom/15 border-blossom/40 shadow-blossom-sm'
                    : 'bg-surface/70 hover:bg-surface border-border'
                }`}
              >
                {/* Number / Index */}
                <span className="text-xs font-mono text-text-muted min-w-4 text-center">
                  {index + 1}
                </span>

                {/* Thumbnail */}
                <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-black/60 shrink-0">
                  <img
                    src={thumbUrl}
                    alt={item.videoTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {isCurrent && (
                    <div className="absolute inset-0 bg-blossom/40 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">
                    {item.videoTitle || `Video ${item.videoId}`}
                  </p>
                  <p className="text-[11px] text-text-secondary truncate">
                    Added by <span className="text-blossom font-medium">{item.addedByName}</span>
                  </p>
                </div>

                {/* Action Buttons */}
                {canManage && (
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
