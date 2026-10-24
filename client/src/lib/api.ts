import { 
  ActionRequest, 
  ChatMessage, 
  RoomDetails, 
  RoomParticipant, 
  RoomRole, 
  UserSession 
} from '@watchtogether/shared';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('wt_session_token');
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include', // sends cookies
  });

  let body: any = null;
  try {
    body = await response.json();
  } catch {
    body = { success: false, error: { message: response.statusText || `Server responded with ${response.status}` } };
  }

  if (!response.ok || !body?.success) {
    const errorMsg = body?.error?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    (err as any).code = body?.error?.code;
    (err as any).status = response.status;
    (err as any).details = body?.error?.details;
    throw err;
  }

  return body.data;
}

export const authApi = {
  createSession: async (displayName: string): Promise<UserSession> => {
    const data = await fetchJson<UserSession>('/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    });
    if (data.token) {
      localStorage.setItem('wt_session_token', data.token);
      localStorage.setItem('wt_user_display_name', data.displayName);
    }
    return data;
  },

  getMe: async (): Promise<UserSession> => {
    return fetchJson<UserSession>('/api/auth/me');
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('wt_session_token');
    await fetchJson('/api/auth/logout', { method: 'POST' });
  },
};

export const roomApi = {
  createRoom: async (params: {
    name?: string;
    videoUrl?: string;
    displayName: string;
    avatarColor?: string;
    isPrivate?: boolean;
  }): Promise<{ room: RoomDetails; session: UserSession }> => {
    const res = await fetchJson<{ room: RoomDetails; session: UserSession }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (res.session?.token) {
      localStorage.setItem('wt_session_token', res.session.token);
      localStorage.setItem('wt_user_display_name', res.session.displayName);
    }
    return res;
  },

  joinRoom: async (params: {
    roomCode: string;
    displayName: string;
    avatarColor?: string;
  }): Promise<{ room: RoomDetails; participant: RoomParticipant; session: UserSession }> => {
    const res = await fetchJson<{ room: RoomDetails; participant: RoomParticipant; session: UserSession }>(
      '/api/rooms/join',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    if (res.session?.token) {
      localStorage.setItem('wt_session_token', res.session.token);
      localStorage.setItem('wt_user_display_name', res.session.displayName);
    }
    return res;
  },

  getRoom: async (roomId: string): Promise<RoomDetails> => {
    return fetchJson<RoomDetails>(`/api/rooms/${roomId}`);
  },

  getRoomByCode: async (code: string): Promise<RoomDetails> => {
    return fetchJson<RoomDetails>(`/api/rooms/code/${code}`);
  },

  getRoomState: async (roomId: string): Promise<{ playback: RoomDetails['playback']; participants: RoomParticipant[] }> => {
    return fetchJson(`/api/rooms/${roomId}/state`);
  },

  updateSettings: async (roomId: string, settings: any, name?: string): Promise<RoomDetails> => {
    return fetchJson<RoomDetails>(`/api/rooms/${roomId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify({ ...settings, name }),
    });
  },

  closeRoom: async (roomId: string): Promise<void> => {
    await fetchJson(`/api/rooms/${roomId}`, {
      method: 'DELETE',
    });
  },

  getQueue: async (roomId: string): Promise<any[]> => {
    return fetchJson(`/api/rooms/${roomId}/queue`);
  },

  addToQueue: async (roomId: string, urlOrId: string, videoTitle?: string): Promise<any[]> => {
    return fetchJson(`/api/rooms/${roomId}/queue`, {
      method: 'POST',
      body: JSON.stringify({ urlOrId, videoTitle }),
    });
  },

  removeFromQueue: async (roomId: string, queueItemId: string): Promise<any[]> => {
    return fetchJson(`/api/rooms/${roomId}/queue/${queueItemId}`, {
      method: 'DELETE',
    });
  },

  playNextInQueue: async (roomId: string): Promise<any> => {
    return fetchJson(`/api/rooms/${roomId}/queue/play-next`, {
      method: 'POST',
    });
  },

  getRequests: async (roomId: string): Promise<ActionRequest[]> => {
    return fetchJson<ActionRequest[]>(`/api/rooms/${roomId}/requests`);
  },

  createRequest: async (params: {
    roomId: string;
    action: string;
    position?: number;
    urlOrId?: string;
    videoTitle?: string;
  }): Promise<ActionRequest> => {
    return fetchJson<ActionRequest>(`/api/rooms/${params.roomId}/requests`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  approveRequest: async (roomId: string, requestId: string): Promise<any> => {
    return fetchJson(`/api/rooms/${roomId}/requests/${requestId}/approve`, {
      method: 'POST',
    });
  },

  rejectRequest: async (roomId: string, requestId: string): Promise<any> => {
    return fetchJson(`/api/rooms/${roomId}/requests/${requestId}/reject`, {
      method: 'POST',
    });
  },

  assignRole: async (roomId: string, targetUserId: string, role: RoomRole): Promise<RoomParticipant> => {
    return fetchJson<RoomParticipant>(`/api/rooms/${roomId}/participants/${targetUserId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  removeParticipant: async (roomId: string, targetUserId: string, reason?: string): Promise<RoomParticipant> => {
    return fetchJson<RoomParticipant>(`/api/rooms/${roomId}/participants/${targetUserId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  },

  getChatMessages: async (roomId: string): Promise<ChatMessage[]> => {
    return fetchJson<ChatMessage[]>(`/api/rooms/${roomId}/chat`);
  },
};
