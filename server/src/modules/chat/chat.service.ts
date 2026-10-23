import crypto from 'crypto';
import { ChatMessage, RoomRole, UserSession } from '@watchtogether/shared';
import { getRepository } from '../../repositories/index.js';

export class ChatService {
  private sanitize(input: string): string {
    return input
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async saveMessage(params: {
    roomId: string;
    session: UserSession;
    role: RoomRole;
    content: string;
  }): Promise<ChatMessage> {
    const sanitized = this.sanitize(params.content);
    if (!sanitized) {
      throw new Error('Message cannot be empty');
    }
    if (sanitized.length > 500) {
      throw new Error('Message length cannot exceed 500 characters');
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      roomId: params.roomId,
      userId: params.session.userId,
      userName: params.session.displayName,
      userRole: params.role,
      content: sanitized,
      timestamp: Date.now(),
    };

    const repo = await getRepository();
    await repo.saveChatMessage(message);
    return message;
  }

  async getMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
    const repo = await getRepository();
    return repo.getRecentChatMessages(roomId, limit);
  }
}

export const chatService = new ChatService();
