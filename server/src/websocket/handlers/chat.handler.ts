import { Server, Socket } from 'socket.io';
import { 
  CLIENT_EVENTS, 
  SERVER_EVENTS, 
  ChatMessageSchema, 
  SocketAckResponse 
} from '@watchtogether/shared';
import { chatService } from '../../modules/chat/chat.service.js';
import { getRepository } from '../../repositories/index.js';
import { logger } from '../../config/logger.js';

// Sliding window rate limiter for chat per socket
const messageTimestamps = new Map<string, number[]>();

export function registerChatHandlers(io: Server, socket: Socket) {
  socket.on(CLIENT_EVENTS.CHAT_MESSAGE, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = ChatMessageSchema.parse(data);

      // Rate limit check: max 5 messages per 3 seconds
      const now = Date.now();
      const timestamps = messageTimestamps.get(socket.id) || [];
      const recent = timestamps.filter(t => now - t < 3000);
      if (recent.length >= 5) {
        throw new Error('You are sending messages too quickly. Please wait a moment.');
      }
      recent.push(now);
      messageTimestamps.set(socket.id, recent);

      const repo = await getRepository();
      const participant = await repo.getParticipant(parsed.roomId, session.userId);
      if (!participant) {
        throw new Error('You must be a member of the room to send messages');
      }

      // Check if chat is disabled by host
      const room = await repo.getRoomById(parsed.roomId);
      if (room?.settings && !room.settings.chatEnabled && participant.role === 'PARTICIPANT') {
        throw new Error('Chat is currently muted by the host');
      }

      const message = await chatService.saveMessage({
        roomId: parsed.roomId,
        session,
        role: participant.role,
        content: parsed.content,
        avatarColor: participant.avatarColor,
        replyToId: parsed.replyToId,
        replyToContent: parsed.replyToContent,
        replyToUserName: parsed.replyToUserName,
      });

      // Broadcast message to all room members
      io.to(parsed.roomId).emit(SERVER_EVENTS.CHAT_MESSAGE, { message });

      ack?.({ success: true, data: message });
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Chat error');
      ack?.({ success: false, error: { code: 'CHAT_ERROR', message: err.message } });
    }
  });

  socket.on('disconnect', () => {
    messageTimestamps.delete(socket.id);
  });
}
