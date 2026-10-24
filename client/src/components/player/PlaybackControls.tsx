import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Tv, 
  Send, 
  ShieldCheck, 
  Crown, 
  User 
} from 'lucide-react';
import { formatTime } from '../../lib/utils.js';
import { RoomRole } from '@watchtogether/shared';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  role: RoomRole;
  controlMode?: 'HOST_ONLY' | 'ALL';
  onPlay: () => void;
  onPause: () => void;
  onSeek: (position: number) => void;
  onChangeVideoClick: () => void;
  onRequestAction: (action: 'PLAY' | 'PAUSE' | 'CHANGE_VIDEO') => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  role,
  controlMode = 'HOST_ONLY',
  onPlay,
  onPause,
  onSeek,
  onChangeVideoClick,
  onRequestAction,
}) => {
  const canControl = role === 'HOST' || role === 'MODERATOR' || controlMode === 'ALL';

  // Global hotkeys for playback when not focused on an input/textarea
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (canControl) {
          if (isPlaying) onPause();
          else onPlay();
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (canControl) handleStep(10);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (canControl) handleStep(-10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, canControl, currentTime, duration]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControl) return;
    const newPos = parseFloat(e.target.value);
    onSeek(newPos);
  };

  const handleStep = (seconds: number) => {
    if (!canControl) return;
    const newPos = Math.max(0, Math.min(duration || 0, currentTime + seconds));
    onSeek(newPos);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 mt-3 flex flex-col gap-3 border border-blossom/15 shadow-sm">
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-text-secondary min-w-12 text-right">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={1}
          value={currentTime}
          onChange={handleSliderChange}
          disabled={!canControl}
          aria-label="Video playback progress"
          className={`w-full h-1.5 rounded-lg appearance-none bg-surface-elevated accent-blossom transition-all ${
            canControl ? 'cursor-pointer hover:h-2.5' : 'cursor-not-allowed opacity-70'
          }`}
        />
        <span className="text-xs font-mono text-text-secondary min-w-12">
          {formatTime(duration)}
        </span>
      </div>

      {/* Control Buttons & Role Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Play/Pause & Step actions */}
        <div className="flex items-center gap-2">
          {canControl ? (
            <>
              <button
                onClick={isPlaying ? onPause : onPlay}
                className="p-3 rounded-xl bg-blossom text-background hover:bg-blossom-hover transition-all duration-200 shadow-blossom-sm hover:scale-105 active:scale-95 flex items-center justify-center font-bold"
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => handleStep(-10)}
                className="p-2.5 rounded-xl bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all border border-border"
                title="Rewind 10 seconds"
                aria-label="Rewind 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleStep(10)}
                className="p-2.5 rounded-xl bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all border border-border"
                title="Forward 10 seconds"
                aria-label="Forward 10 seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={onChangeVideoClick}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface hover:bg-surface-elevated text-text-primary text-xs font-medium border border-border hover:border-blossom/20 transition-all ml-2"
              >
                <Tv className="w-4 h-4 text-blossom" />
                <span>Change Video</span>
              </button>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-secondary flex items-center gap-1.5 mr-2">
                <User className="w-3.5 h-3.5 text-text-muted" />
                Participant Mode
              </span>

              <button
                onClick={() => onRequestAction('PLAY')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated text-xs font-medium text-text-secondary hover:text-text-primary border border-border transition-all"
              >
                <Send className="w-3 h-3 text-blossom" />
                Request Play
              </button>

              <button
                onClick={() => onRequestAction('PAUSE')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated text-xs font-medium text-text-secondary hover:text-text-primary border border-border transition-all"
              >
                <Send className="w-3 h-3 text-blossom" />
                Request Pause
              </button>

              <button
                onClick={onChangeVideoClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated text-xs font-medium text-text-secondary hover:text-text-primary border border-border transition-all"
              >
                <Tv className="w-3 h-3 text-blossom" />
                Suggest Video
              </button>
            </div>
          )}
        </div>

        {/* Current Role Badge */}
        <div className="flex items-center gap-2">
          {controlMode === 'ALL' && (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Open Control Mode
            </span>
          )}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              role === 'HOST'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : role === 'MODERATOR'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'bg-surface-elevated text-text-secondary border border-border'
            }`}
          >
            {role === 'HOST' && <Crown className="w-3 h-3 text-amber-400" />}
            {role === 'MODERATOR' && <ShieldCheck className="w-3 h-3 text-cyan-400" />}
            {role === 'PARTICIPANT' && <User className="w-3 h-3 text-text-muted" />}
            <span>{role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
