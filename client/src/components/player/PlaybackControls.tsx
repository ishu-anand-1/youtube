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
  onPlay,
  onPause,
  onSeek,
  onChangeVideoClick,
  onRequestAction,
}) => {
  const canControl = role === 'HOST' || role === 'MODERATOR';

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
    <div className="glass-panel rounded-2xl p-4 mt-3 flex flex-col gap-3">
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-slate-400 min-w-12 text-right">
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
          className={`w-full h-1.5 rounded-lg appearance-none bg-slate-700/60 accent-accent transition-all ${
            canControl ? 'cursor-pointer hover:h-2.5' : 'cursor-not-allowed opacity-70'
          }`}
        />
        <span className="text-xs font-mono text-slate-400 min-w-12">
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
                className="p-3 rounded-xl bg-accent text-white hover:bg-accent-hover transition-all duration-200 shadow-lg shadow-accent/25 hover:scale-105 active:scale-95 flex items-center justify-center"
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => handleStep(-10)}
                className="p-2.5 rounded-xl bg-surface-muted hover:bg-surface-hover text-slate-300 hover:text-white transition-all border border-white/5"
                title="Rewind 10 seconds"
                aria-label="Rewind 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleStep(10)}
                className="p-2.5 rounded-xl bg-surface-muted hover:bg-surface-hover text-slate-300 hover:text-white transition-all border border-white/5"
                title="Forward 10 seconds"
                aria-label="Forward 10 seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={onChangeVideoClick}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-muted hover:bg-surface-hover text-slate-200 hover:text-white text-xs font-medium border border-white/5 transition-all ml-2"
              >
                <Tv className="w-4 h-4 text-accent" />
                <span>Change Video</span>
              </button>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mr-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Participant Mode
              </span>

              <button
                onClick={() => onRequestAction('PLAY')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-hover text-xs font-medium text-slate-300 hover:text-white border border-white/5 transition-all"
              >
                <Send className="w-3 h-3 text-accent" />
                Request Play
              </button>

              <button
                onClick={() => onRequestAction('PAUSE')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-hover text-xs font-medium text-slate-300 hover:text-white border border-white/5 transition-all"
              >
                <Send className="w-3 h-3 text-accent" />
                Request Pause
              </button>

              <button
                onClick={onChangeVideoClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-hover text-xs font-medium text-slate-300 hover:text-white border border-white/5 transition-all"
              >
                <Tv className="w-3 h-3 text-accent" />
                Suggest Video
              </button>
            </div>
          )}
        </div>

        {/* Current Role Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              role === 'HOST'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : role === 'MODERATOR'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {role === 'HOST' && <Crown className="w-3 h-3 text-amber-400" />}
            {role === 'MODERATOR' && <ShieldCheck className="w-3 h-3 text-cyan-400" />}
            {role === 'PARTICIPANT' && <User className="w-3 h-3 text-slate-400" />}
            <span>{role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
