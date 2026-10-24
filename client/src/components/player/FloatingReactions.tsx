import React from 'react';
import { useRoomStore } from '../../store/useRoomStore.js';
import { getSocket } from '../../lib/socket.js';
import { CLIENT_EVENTS } from '@watchtogether/shared';
import { Sparkles, Heart, Flame, Laugh, ThumbsUp, PartyPopper, Rocket } from 'lucide-react';

const EMOJIS = ['❤️', '😂', '🔥', '👏', '🎉', '🚀'];

export const FloatingReactionsOverlay: React.FC = () => {
  const { reactions } = useRoomStore();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {reactions.map((r, i) => {
        // Pseudo-random horizontal spread based on timestamp/id
        const leftPercent = 15 + ((r.timestamp * (i + 1)) % 70);
        return (
          <div
            key={r.id}
            className="absolute bottom-6 flex flex-col items-center animate-float-fade"
            style={{ left: `${leftPercent}%` }}
          >
            <span className="text-4xl filter drop-shadow-lg select-none transform hover:scale-125 transition-transform">
              {r.emoji}
            </span>
            <span className="text-[10px] font-semibold text-text-primary bg-background/70 px-2 py-0.5 rounded-full mt-1 backdrop-blur-md border border-blossom/20 shadow-sm">
              {r.userName}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const QuickReactionBar: React.FC<{ roomId: string }> = ({ roomId }) => {
  const socket = getSocket();

  const handleSendReaction = (emoji: string) => {
    socket.emit(CLIENT_EVENTS.SEND_REACTION, { roomId, emoji });
  };

  const handleEveryoneReact = () => {
    // Send 3 rapid festive reactions
    ['🎉', '🔥', '❤️'].forEach((emoji, idx) => {
      setTimeout(() => {
        socket.emit(CLIENT_EVENTS.SEND_REACTION, { roomId, emoji });
      }, idx * 150);
    });
  };

  return (
    <div className="flex items-center gap-1.5 bg-surface/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-blossom/20 shadow-lg">
      <span className="text-xs font-medium text-text-secondary mr-1 hidden sm:inline flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-blossom" />
        React:
      </span>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleSendReaction(emoji)}
          className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 active:scale-95 transition-all duration-150 rounded-full hover:bg-white/10"
          title={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
      <div className="w-[1px] h-4 bg-border mx-1 hidden sm:block" />
      <button
        onClick={handleEveryoneReact}
        className="hidden sm:flex items-center gap-1 text-xs font-semibold text-blossom hover:text-blossom-light bg-blossom/10 hover:bg-blossom/20 px-2.5 py-1 rounded-full transition-colors border border-blossom/25 shadow-sm"
        title="Trigger celebration wave"
      >
        <span>Burst</span>
      </button>
    </div>
  );
};
