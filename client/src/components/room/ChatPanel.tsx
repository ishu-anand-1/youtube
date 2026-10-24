import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, RoomRole } from '@watchtogether/shared';
import { Send, Crown, ShieldCheck, CornerDownRight, X, AlertCircle } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId?: string;
  chatEnabled?: boolean;
  onSendMessage: (content: string, replyTo?: { id: string; userName: string; content: string }) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  chatEnabled = true,
  onSendMessage,
}) => {
  const [input, setInput] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; userName: string; content: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !chatEnabled) return;
    onSendMessage(trimmed, replyTarget || undefined);
    setInput('');
    setReplyTarget(null);
  };

  const handleReplyClick = (m: ChatMessage) => {
    setReplyTarget({
      id: m.id,
      userName: m.userName,
      content: m.content.slice(0, 80),
    });
    inputRef.current?.focus();
  };

  const handleQuickEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-surface/40 backdrop-blur-md">
      {/* Disabled Chat Banner */}
      {!chatEnabled && (
        <div className="px-3.5 py-2 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Chat has been paused by the room host.</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
            <p className="text-xs font-semibold text-text-secondary">No chat messages yet.</p>
            <p className="text-[11px] text-text-muted mt-1">Say hello to everyone in the party!</p>
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
                className={`flex flex-col group ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-xs font-semibold text-text-primary">
                    {m.userName}
                  </span>
                  {m.userRole === 'HOST' && (
                    <span title="Host">
                      <Crown className="w-3 h-3 text-amber-400" />
                    </span>
                  )}
                  {m.userRole === 'MODERATOR' && (
                    <span title="Moderator">
                      <ShieldCheck className="w-3 h-3 text-lavender" />
                    </span>
                  )}
                  <span className="text-[10px] text-text-muted">{timeStr}</span>

                  <button
                    onClick={() => handleReplyClick(m)}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-blossom p-0.5 rounded transition-opacity"
                    title="Reply"
                  >
                    <CornerDownRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Quoted Reply if any */}
                {m.replyToContent && (
                  <div
                    className={`text-[11px] px-2.5 py-1 mb-1 rounded-lg border max-w-[85%] truncate ${
                      isSelf
                        ? 'bg-blossom/20 border-blossom/30 text-white self-end'
                        : 'bg-surface border-border text-text-secondary self-start'
                    }`}
                  >
                    <span className="font-semibold text-blossom">@{m.replyToUserName || 'User'}: </span>
                    <span className="italic">{m.replyToContent}</span>
                  </div>
                )}

                <div
                  className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] break-words leading-relaxed shadow-sm ${
                    isSelf
                      ? 'bg-blossom text-background font-medium rounded-tr-none'
                      : 'bg-surface text-text-primary border border-border rounded-tl-none'
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

      {/* Reply target banner */}
      {replyTarget && (
        <div className="px-3 py-1.5 bg-blossom/15 border-t border-blossom/25 flex items-center justify-between text-xs text-text-primary">
          <div className="flex items-center gap-1.5 truncate">
            <CornerDownRight className="w-3.5 h-3.5 text-blossom shrink-0" />
            <span className="text-text-muted">Replying to</span>
            <span className="font-semibold text-blossom">@{replyTarget.userName}</span>
            <span className="truncate text-text-secondary">"{replyTarget.content}"</span>
          </div>
          <button
            onClick={() => setReplyTarget(null)}
            className="p-1 hover:text-white text-text-muted"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Quick emoji bar */}
      <div className="px-3 pt-2 pb-1 bg-surface/50 flex items-center gap-1 text-sm border-t border-border">
        {['👍', '🔥', '❤️', '😂', '🎉', '👀'].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleQuickEmoji(emoji)}
            className="hover:scale-125 transition-transform p-1 rounded hover:bg-surface-elevated"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-surface/60">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!chatEnabled}
            placeholder={chatEnabled ? "Send a message..." : "Chat is disabled"}
            maxLength={500}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-muted text-xs focus:outline-none focus:border-blossom focus:ring-1 focus:ring-blossom transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || !chatEnabled}
            className="p-2.5 rounded-xl bg-blossom text-background hover:bg-blossom-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-blossom-sm font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
