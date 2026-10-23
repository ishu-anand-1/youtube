import React from 'react';
import { Share2, Users, LogOut, Radio, Crown } from 'lucide-react';
import { ConnectionStatus } from '../../store/useRoomStore.js';
import { RoomRole } from '@watchtogether/shared';

interface RoomToolbarProps {
  roomName: string;
  roomCode: string;
  participantCount: number;
  connectionStatus: ConnectionStatus;
  currentRole: RoomRole;
  onOpenInvite: () => void;
  onLeaveRoom: () => void;
}

export const RoomToolbar: React.FC<RoomToolbarProps> = ({
  roomName,
  roomCode,
  participantCount,
  connectionStatus,
  currentRole,
  onOpenInvite,
  onLeaveRoom,
}) => {
  return (
    <header className="glass-panel px-4 py-3 flex items-center justify-between gap-4 border-b border-white/5">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-3 min-w-0">
        <a href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-accent/20 group-hover:scale-105 transition-all">
            W
          </div>
          <span className="font-extrabold text-base tracking-tight text-white hidden sm:inline">
            Watch<span className="text-accent">Together</span>
          </span>
        </a>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">
              {roomName}
            </h1>
            <span className="font-mono text-xs font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-md border border-accent/30 hidden xs:inline">
              {roomCode}
            </span>
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Live Status indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-muted border border-white/5 text-[11px] font-medium text-slate-300">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : connectionStatus === 'reconnecting'
                ? 'bg-amber-500 animate-spin'
                : 'bg-rose-500'
            }`}
          />
          <span className="hidden sm:inline">
            {connectionStatus === 'connected'
              ? 'Synced Live'
              : connectionStatus === 'reconnecting'
              ? 'Reconnecting...'
              : 'Disconnected'}
          </span>
        </div>

        {/* Participant Count */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-muted border border-white/5 text-xs text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{participantCount}</span>
        </div>

        {/* Invite Button */}
        <button
          onClick={onOpenInvite}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent text-xs font-semibold border border-accent/30 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Invite</span>
        </button>

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-muted hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-medium border border-white/5 hover:border-rose-500/30 transition-all"
          title="Leave Watch Party"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Leave</span>
        </button>
      </div>
    </header>
  );
};
