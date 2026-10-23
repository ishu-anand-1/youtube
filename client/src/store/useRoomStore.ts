import { create } from 'zustand';
import { 
  ActionRequest, 
  ChatMessage, 
  PlaybackState, 
  RoomDetails, 
  RoomParticipant, 
  RoomRole 
} from '@watchtogether/shared';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface RoomState {
  room: RoomDetails | null;
  currentRole: RoomRole;
  playback: PlaybackState | null;
  participants: RoomParticipant[];
  requests: ActionRequest[];
  messages: ChatMessage[];
  connectionStatus: ConnectionStatus;
  activeTab: 'chat' | 'participants' | 'requests';

  // Actions
  setRoom: (room: RoomDetails, currentRole: RoomRole) => void;
  updatePlayback: (playback: PlaybackState) => void;
  setParticipants: (participants: RoomParticipant[]) => void;
  updateParticipantRole: (userId: string, newRole: RoomRole) => void;
  updateParticipantStatus: (userId: string, isOnline: boolean) => void;
  addParticipant: (participant: RoomParticipant) => void;
  removeParticipant: (userId: string) => void;
  setCurrentRole: (role: RoomRole) => void;

  setRequests: (requests: ActionRequest[]) => void;
  addRequest: (request: ActionRequest) => void;
  updateRequest: (request: ActionRequest) => void;

  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;

  setConnectionStatus: (status: ConnectionStatus) => void;
  setActiveTab: (tab: 'chat' | 'participants' | 'requests') => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  currentRole: 'PARTICIPANT',
  playback: null,
  participants: [],
  requests: [],
  messages: [],
  connectionStatus: 'disconnected',
  activeTab: 'chat',

  setRoom: (room, currentRole) => {
    set({
      room,
      currentRole,
      playback: room.playback,
      participants: room.participants || [],
    });
  },

  updatePlayback: (playback) => {
    set((state) => {
      // Ignore stale updates if existing version is newer
      if (state.playback && state.playback.version > playback.version) {
        return state;
      }
      return { playback };
    });
  },

  setParticipants: (participants) => {
    set({ participants });
  },

  updateParticipantRole: (userId, newRole) => {
    set((state) => {
      const updated = state.participants.map((p) =>
        p.userId === userId ? { ...p, role: newRole } : p
      );
      return { participants: updated };
    });
  },

  updateParticipantStatus: (userId, isOnline) => {
    set((state) => {
      const updated = state.participants.map((p) =>
        p.userId === userId ? { ...p, isOnline } : p
      );
      return { participants: updated };
    });
  },

  addParticipant: (participant) => {
    set((state) => {
      const exists = state.participants.some((p) => p.userId === participant.userId);
      if (exists) {
        return {
          participants: state.participants.map((p) =>
            p.userId === participant.userId ? participant : p
          ),
        };
      }
      return { participants: [...state.participants, participant] };
    });
  },

  removeParticipant: (userId) => {
    set((state) => ({
      participants: state.participants.filter((p) => p.userId !== userId),
    }));
  },

  setCurrentRole: (role) => {
    set({ currentRole: role });
  },

  setRequests: (requests) => {
    set({ requests });
  },

  addRequest: (request) => {
    set((state) => {
      const exists = state.requests.some((r) => r.id === request.id);
      if (exists) return state;
      return { requests: [request, ...state.requests] };
    });
  },

  updateRequest: (request) => {
    set((state) => ({
      requests: state.requests.map((r) => (r.id === request.id ? request : r)),
    }));
  },

  setMessages: (messages) => {
    set({ messages });
  },

  addMessage: (message) => {
    set((state) => {
      const exists = state.messages.some((m) => m.id === message.id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    });
  },

  setConnectionStatus: (connectionStatus) => {
    set({ connectionStatus });
  },

  setActiveTab: (activeTab) => {
    set({ activeTab });
  },

  reset: () => {
    set({
      room: null,
      currentRole: 'PARTICIPANT',
      playback: null,
      participants: [],
      requests: [],
      messages: [],
      connectionStatus: 'disconnected',
    });
  },
}));
