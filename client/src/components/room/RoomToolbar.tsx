import React, { useState } from 'react';
import { Share2, Users, LogOut, Radio, Crown, Settings, Copy, Check, Lock, Activity, Flower2, Play } from 'lucide-react';
import { ConnectionStatus } from '../../store/useRoomStore.js';
import { RoomRole } from '@watchtogether/shared';

interface RoomToolbarProps {
  roomName: string;
  roomCode: string;
  participantCount: number;
  connectionStatus: ConnectionStatus;
  currentRole: RoomRole;
  pingMs?: number;
  isPrivate?: boolean;
  onOpenInvite: () => void;
  onOpenSettings: () => void;
  onLeaveRoom: () => void;
}

export const RoomToolbar: React.FC<RoomToolbarProps> = ({
  roomName,
  roomCode,
  participantCount,
  connectionStatus,
  currentRole,
  pingMs = 24,
  isPrivate = false,
  onOpenInvite,
  onOpenSettings,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <header className="glass-panel px-4 py-3 flex items-center justify-between gap-4 border-b border-blossom/10 backdrop-blur-xl relative z-30">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-3 min-w-0">
        <a href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-blossom to-lavender flex items-center justify-center text-background font-black text-sm shadow-blossom-sm group-hover:scale-105 transition-all">
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            <Flower2 className="w-2.5 h-2.5 text-white absolute -top-0.5 -right-0.5 animate-pulse-subtle" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-text-primary hidden sm:inline">
            Watch<span className="text-blossom">Together</span>
          </span>
        </a>

        <div className="h-4 w-px bg-border hidden sm:block" />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-text-primary truncate max-w-[140px] sm:max-w-xs">
              {roomName}
            </h1>
            {isPrivate && (
              <span title="Private Party">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </span>
            )}
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 font-mono text-xs font-bold text-blossom bg-blossom/15 hover:bg-blossom/25 px-2 py-0.5 rounded-md border border-blossom/30 transition-colors hidden xs:flex shadow-sm"
              title="Click to copy room code"
            >
              <span>{roomCode}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-70" />}
            </button>
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2">
        {/* Ping / Latency Indicator */}
        <div 
          className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface/80 border border-border text-[11px] font-mono text-text-secondary"
          title={`Measured network roundtrip: ${pingMs}ms`}
        >
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>{pingMs}ms</span>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-[11px] font-medium text-text-secondary">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-400 animate-pulse'
                : connectionStatus === 'reconnecting'
                ? 'bg-amber-400 animate-spin'
                : 'bg-rose-500'
            }`}
          />
          <span className="hidden sm:inline">
            {connectionStatus === 'connected'
              ? 'Synced'
              : connectionStatus === 'reconnecting'
              ? 'Reconnecting...'
              : 'Disconnected'}
          </span>
        </div>

        {/* Participant Count */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-xs text-text-secondary">
          <Users className="w-3.5 h-3.5 text-lavender" />
          <span>{participantCount}</span>
        </div>

        {/* Invite Button */}
        <button
          onClick={onOpenInvite}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blossom/20 hover:bg-blossom/30 text-blossom text-xs font-semibold border border-blossom/30 transition-all hover:scale-105 active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Invite</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all border border-border"
          title="Room Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-rose-500/20 text-text-secondary hover:text-rose-300 text-xs font-medium border border-border hover:border-rose-500/30 transition-all"
          title="Leave Watch Party"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Leave</span>
        </button>
      </div>
    </header>
  );
};
