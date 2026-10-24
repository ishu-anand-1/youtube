import { create } from 'zustand';
import { 
  ActionRequest, 
  ChatMessage, 
  PlaybackState, 
  QueueItem,
  ReactionEvent,
  RoomDetails, 
  RoomParticipant, 
  RoomRole, 
  RoomSettings 
} from '@watchtogether/shared';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface RecentRoom {
  code: string;
  name: string;
  lastVisited: number;
}

interface RoomState {
  room: RoomDetails | null;
  currentRole: RoomRole;
  playback: PlaybackState | null;
  participants: RoomParticipant[];
  requests: ActionRequest[];
  messages: ChatMessage[];
  queue: QueueItem[];
  settings: RoomSettings;
  reactions: ReactionEvent[];
  unreadMessagesCount: number;
  pingMs: number;
  isSyncing: boolean;
  connectionStatus: ConnectionStatus;
  activeTab: 'chat' | 'queue' | 'participants' | 'requests' | 'settings';

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
  markMessagesRead: () => void;

  setQueue: (queue: QueueItem[]) => void;
  addQueueItem: (item: QueueItem) => void;
  removeQueueItem: (itemId: string) => void;

  updateSettings: (settings: Partial<RoomSettings>, name?: string) => void;

  addReaction: (reaction: ReactionEvent) => void;
  removeReaction: (id: string) => void;

  setPing: (pingMs: number) => void;
  setIsSyncing: (isSyncing: boolean) => void;

  setConnectionStatus: (status: ConnectionStatus) => void;
  setActiveTab: (tab: 'chat' | 'queue' | 'participants' | 'requests' | 'settings') => void;
  
  saveRecentRoom: (code: string, name: string) => void;
  getRecentRooms: () => RecentRoom[];

  reset: () => void;
}

const DEFAULT_SETTINGS: RoomSettings = {
  controlMode: 'HOST_ONLY',
  chatEnabled: true,
  participantLimit: 50,
  isPrivate: false,
};

export const useRoomStore = create<RoomState>((set, get) => ({
  room: null,
  currentRole: 'PARTICIPANT',
  playback: null,
  participants: [],
  requests: [],
  messages: [],
  queue: [],
  settings: DEFAULT_SETTINGS,
  reactions: [],
  unreadMessagesCount: 0,
  pingMs: 25,
  isSyncing: false,
  connectionStatus: 'disconnected',
  activeTab: 'chat',

  setRoom: (room, currentRole) => {
    set({
      room,
      currentRole,
      playback: room.playback,
      participants: room.participants || [],
      queue: room.queue || [],
      settings: room.settings || DEFAULT_SETTINGS,
    });
    get().saveRecentRoom(room.code, room.name);
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
      const isUnread = state.activeTab !== 'chat';
      return { 
        messages: [...state.messages, message],
        unreadMessagesCount: isUnread ? state.unreadMessagesCount + 1 : 0
      };
    });
  },

  markMessagesRead: () => {
    set({ unreadMessagesCount: 0 });
  },

  setQueue: (queue) => {
    set({ queue });
  },

  addQueueItem: (item) => {
    set((state) => ({ queue: [...state.queue, item] }));
  },

  removeQueueItem: (itemId) => {
    set((state) => ({ queue: state.queue.filter((i) => i.id !== itemId) }));
  },

  updateSettings: (newSettings, name) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      const room = state.room ? { ...state.room, name: name || state.room.name, settings: updated } : null;
      return { settings: updated, room };
    });
  },

  addReaction: (reaction) => {
    set((state) => ({ reactions: [...state.reactions.slice(-15), reaction] }));
    // Automatically decay reaction after 3 seconds
    setTimeout(() => {
      get().removeReaction(reaction.id);
    }, 3000);
  },

  removeReaction: (id) => {
    set((state) => ({ reactions: state.reactions.filter((r) => r.id !== id) }));
  },

  setPing: (pingMs) => {
    set({ pingMs });
  },

  setIsSyncing: (isSyncing) => {
    set({ isSyncing });
  },

  setConnectionStatus: (connectionStatus) => {
    set({ connectionStatus });
  },

  setActiveTab: (activeTab) => {
    set({ activeTab });
    if (activeTab === 'chat') {
      get().markMessagesRead();
    }
  },

  saveRecentRoom: (code, name) => {
    try {
      const raw = localStorage.getItem('wt_recent_rooms');
      let list: RecentRoom[] = raw ? JSON.parse(raw) : [];
      list = list.filter((r) => r.code !== code);
      list.unshift({ code, name, lastVisited: Date.now() });
      if (list.length > 5) list = list.slice(0, 5);
      localStorage.setItem('wt_recent_rooms', JSON.stringify(list));
    } catch {
      // Ignore localStorage errors
    }
  },

  getRecentRooms: () => {
    try {
      const raw = localStorage.getItem('wt_recent_rooms');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  reset: () => {
    set({
      room: null,
      currentRole: 'PARTICIPANT',
      playback: null,
      participants: [],
      requests: [],
      messages: [],
      queue: [],
      reactions: [],
      unreadMessagesCount: 0,
      connectionStatus: 'disconnected',
    });
  },
}));
