import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, RoomRole } from '@watchtogether/shared';
import { Send, Crown, ShieldCheck } from 'lucide-react';
import { formatTime } from '../../lib/utils.js';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId?: string;
  onSendMessage: (content: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  onSendMessage,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <p className="text-xs">No chat messages yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">Say hello to everyone in the party!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isSelf = m.userId === currentUserId;
            const timeStr = new Date(m.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-xs font-semibold text-slate-300">
                    {m.userName}
                  </span>
                  {m.userRole === 'HOST' && (
                    <span title="Host">
                      <Crown className="w-3 h-3 text-amber-400" />
                    </span>
                  )}
                  {m.userRole === 'MODERATOR' && (
                    <span title="Moderator">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">{timeStr}</span>
                </div>

                <div
                  className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                    isSelf
                      ? 'bg-accent text-white rounded-tr-none'
                      : 'bg-surface-muted text-slate-200 border border-white/5 rounded-tl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-surface-muted/40">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message..."
            maxLength={500}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-muted border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-accent/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
