import React, { useState } from 'react';
import { RoomDetails, RoomRole, RoomSettings } from '@watchtogether/shared';
import { 
  X, 
  Settings, 
  Shield, 
  MessageSquare, 
  Users, 
  Trash2, 
  Lock, 
  Unlock, 
  Save, 
  AlertTriangle 
} from 'lucide-react';
import { roomApi } from '../../lib/api.js';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface RoomSettingsModalProps {
  room: RoomDetails;
  role: RoomRole;
  isOpen: boolean;
  onClose: () => void;
}

export const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
  room,
  role,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const isHost = role === 'HOST';

  const [name, setName] = useState(room.name);
  const [controlMode, setControlMode] = useState<'HOST_ONLY' | 'ALL'>(
    room.settings?.controlMode || 'HOST_ONLY'
  );
  const [chatEnabled, setChatEnabled] = useState<boolean>(
    room.settings?.chatEnabled ?? true
  );
  const [isPrivate, setIsPrivate] = useState<boolean>(
    room.settings?.isPrivate ?? false
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHost) return;

    try {
      setIsSaving(true);
      await roomApi.updateSettings(
        room.id,
        {
          controlMode,
          chatEnabled,
          isPrivate,
        },
        name.trim() || room.name
      );
      toast.success('Room settings updated!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseRoom = async () => {
    if (!isHost) return;
    const confirm = window.confirm(
      'Are you sure you want to close this room? All participants will be disconnected.'
    );
    if (!confirm) return;

    try {
      setIsClosing(true);
      await roomApi.closeRoom(room.id);
      toast.success('Room closed successfully');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to close room');
      setIsClosing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md glass-panel-elevated border border-blossom/25 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blossom/15 text-blossom">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Room Settings</h3>
              <p className="text-xs text-text-secondary">Configure party and moderation rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {!isHost && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                You are currently viewing settings in read-only mode. Only the Room Host can modify these rules.
              </p>
            </div>
          )}

          {/* Room Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isHost}
              className="w-full px-3.5 py-2.5 text-sm bg-surface rounded-xl border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blossom disabled:opacity-60"
            />
          </div>

          {/* Playback Control Mode */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blossom" />
              Playback Control
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => isHost && setControlMode('HOST_ONLY')}
                disabled={!isHost}
                className={`p-3 rounded-xl border text-left transition-all ${
                  controlMode === 'HOST_ONLY'
                    ? 'bg-blossom/15 border-blossom text-text-primary shadow-sm'
                    : 'bg-surface/60 border-border text-text-secondary hover:bg-surface'
                } disabled:opacity-60`}
              >
                <div className="text-xs font-bold">Host & Mods</div>
                <div className="text-[10px] text-text-muted mt-0.5">Authoritative sync</div>
              </button>

              <button
                type="button"
                onClick={() => isHost && setControlMode('ALL')}
                disabled={!isHost}
                className={`p-3 rounded-xl border text-left transition-all ${
                  controlMode === 'ALL'
                    ? 'bg-blossom/15 border-blossom text-text-primary shadow-sm'
                    : 'bg-surface/60 border-border text-text-secondary hover:bg-surface'
                } disabled:opacity-60`}
              >
                <div className="text-xs font-bold">Open Control</div>
                <div className="text-[10px] text-text-muted mt-0.5">Any guest can play/pause</div>
              </button>
            </div>
          </div>

          {/* Chat Enabled Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface/60 border border-border">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-blossom" />
              <div>
                <div className="text-xs font-semibold text-text-primary">Live Chat</div>
                <div className="text-[11px] text-text-muted">Allow participants to send messages</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={chatEnabled}
              onChange={(e) => isHost && setChatEnabled(e.target.checked)}
              disabled={!isHost}
              className="w-4 h-4 accent-blossom rounded cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface/60 border border-border">
            <div className="flex items-center gap-2.5">
              {isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
              <div>
                <div className="text-xs font-semibold text-text-primary">Private Room</div>
                <div className="text-[11px] text-text-muted">Require exact invite link or code</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => isHost && setIsPrivate(e.target.checked)}
              disabled={!isHost}
              className="w-4 h-4 accent-blossom rounded cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {isHost ? (
              <>
                <button
                  type="button"
                  onClick={handleCloseRoom}
                  disabled={isClosing}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isClosing ? 'Closing...' : 'Close Room'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-elevated text-text-secondary text-xs font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-blossom hover:bg-blossom-hover text-background text-xs font-bold transition-all shadow-blossom-sm flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-surface hover:bg-surface-elevated text-text-primary text-xs font-semibold transition-all"
              >
                Close
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
