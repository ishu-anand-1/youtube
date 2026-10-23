import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  roomCode: string;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  roomCode,
  onClose,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const inviteUrl = `${window.location.origin}/join?code=${roomCode}`;

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WatchTogether Party',
          text: `Join my WatchTogether YouTube party! Room code: ${roomCode}`,
          url: inviteUrl,
        });
      } catch {
        // Fallback to copy
        copyToClipboard(inviteUrl, 'link');
      }
    } else {
      copyToClipboard(inviteUrl, 'link');
    }
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
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Invite Friends</h3>
            <p className="text-xs text-slate-400">
              Share the code or link to watch together in real time
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Room Code Box */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Room Code
            </label>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-muted border border-white/10">
              <span className="font-mono text-2xl font-black tracking-widest text-accent">
                {roomCode}
              </span>
              <button
                onClick={() => copyToClipboard(roomCode, 'code')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-slate-700 text-xs font-medium text-white transition-all"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Link Box */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Direct Invite Link
            </label>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-muted border border-white/10">
              <span className="text-xs font-mono text-slate-300 truncate max-w-[240px]">
                {inviteUrl}
              </span>
              <button
                onClick={() => copyToClipboard(inviteUrl, 'link')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-slate-700 text-xs font-medium text-white transition-all ml-2 flex-shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share Button */}
          <div className="pt-2">
            <button
              onClick={handleNativeShare}
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Invite</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
