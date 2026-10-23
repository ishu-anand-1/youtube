import React from 'react';
import { RoomParticipant, RoomRole } from '@watchtogether/shared';
import { Crown, ShieldCheck, ShieldAlert, UserMinus, Shield } from 'lucide-react';
import { getInitials } from '../../lib/utils.js';

interface ParticipantListProps {
  participants: RoomParticipant[];
  currentUserId?: string;
  currentUserRole: RoomRole;
  onAssignRole: (userId: string, newRole: RoomRole) => void;
  onRemoveParticipant: (userId: string) => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  currentUserId,
  currentUserRole,
  onAssignRole,
  onRemoveParticipant,
}) => {
  const isHost = currentUserRole === 'HOST';

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          In this Watch Party ({participants.length})
        </h4>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {participants.map((p) => {
          const isSelf = p.userId === currentUserId;
          const isTargetHost = p.role === 'HOST';
          const isTargetMod = p.role === 'MODERATOR';

          return (
            <div
              key={p.userId}
              className="flex items-center justify-between p-2.5 rounded-xl bg-surface-muted/60 border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar with status dot */}
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent/30 to-violet-500/30 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                    {getInitials(p.displayName)}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${
                      p.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}
                    title={p.isOnline ? 'Online' : 'Offline'}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate">
                      {p.displayName}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                        You
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-0.5">
                    {p.role === 'HOST' && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                        <Crown className="w-3 h-3" /> Host
                      </span>
                    )}
                    {p.role === 'MODERATOR' && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400">
                        <ShieldCheck className="w-3 h-3" /> Moderator
                      </span>
                    )}
                    {p.role === 'PARTICIPANT' && (
                      <span className="text-[11px] text-slate-400">Participant</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Host management actions */}
              {isHost && !isSelf && !isTargetHost && (
                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {isTargetMod ? (
                    <button
                      onClick={() => onAssignRole(p.userId, 'PARTICIPANT')}
                      title="Demote to Participant"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onAssignRole(p.userId, 'MODERATOR')}
                      title="Promote to Moderator"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onRemoveParticipant(p.userId)}
                    title="Remove from Room"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
