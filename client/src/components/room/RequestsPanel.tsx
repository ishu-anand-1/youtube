import React from 'react';
import { ActionRequest, RoomRole } from '@watchtogether/shared';
import { Check, X, Clock, Play, Pause, FastForward, Tv } from 'lucide-react';
import { formatTime } from '../../lib/utils.js';

interface RequestsPanelProps {
  requests: ActionRequest[];
  currentUserRole: RoomRole;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export const RequestsPanel: React.FC<RequestsPanelProps> = ({
  requests,
  currentUserRole,
  onApprove,
  onReject,
}) => {
  const canManage = currentUserRole === 'HOST' || currentUserRole === 'MODERATOR';

  const getActionBadge = (action: ActionRequest['action']) => {
    switch (action) {
      case 'PLAY':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Play className="w-2.5 h-2.5" /> Play
          </span>
        );
      case 'PAUSE':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <Pause className="w-2.5 h-2.5" /> Pause
          </span>
        );
      case 'SEEK':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            <FastForward className="w-2.5 h-2.5" /> Seek
          </span>
        );
      case 'CHANGE_VIDEO':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
            <Tv className="w-2.5 h-2.5" /> Video Change
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Playback Requests ({requests.length})
        </h4>
        <span className="text-[10px] text-slate-500">
          {canManage ? 'Host & Mod Approval Queue' : 'Your Submitted Requests'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {requests.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Clock className="w-8 h-8 stroke-1 text-slate-600 mb-2" />
            <p className="text-xs">No playback requests pending.</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {canManage
                ? 'Participant requests will appear here for your review.'
                : 'Click "Request Play/Pause/Video" under the player to ask the Host.'}
            </p>
          </div>
        ) : (
          requests.map((r) => {
            const isPending = r.status === 'PENDING';

            return (
              <div
                key={r.id}
                className="p-3 rounded-xl bg-surface-muted/70 border border-white/5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getActionBadge(r.action)}
                    <span className="text-xs font-medium text-white">{r.userName}</span>
                  </div>

                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      r.status === 'APPROVED'
                        ? 'text-emerald-400 bg-emerald-500/15'
                        : r.status === 'REJECTED'
                        ? 'text-rose-400 bg-rose-500/15'
                        : r.status === 'EXPIRED'
                        ? 'text-slate-400 bg-slate-800'
                        : 'text-amber-400 bg-amber-500/15'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                {/* Details */}
                <div className="text-[11px] text-slate-300">
                  {r.action === 'SEEK' && typeof r.payload.position === 'number' && (
                    <span>Position: {formatTime(r.payload.position)}</span>
                  )}
                  {r.action === 'CHANGE_VIDEO' && (
                    <span className="truncate block">
                      Video: {r.payload.videoTitle || r.payload.videoId}
                    </span>
                  )}
                  {(r.action === 'PLAY' || r.action === 'PAUSE') && (
                    <span>Requested at {formatTime(r.payload.position || 0)}</span>
                  )}
                </div>

                {/* Approver Actions */}
                {canManage && isPending && (
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <button
                      onClick={() => onApprove(r.id)}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 flex items-center justify-center gap-1 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => onReject(r.id)}
                      className="flex-1 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium border border-rose-500/30 flex items-center justify-center gap-1 transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
