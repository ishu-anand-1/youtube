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

export function registerChatHandlers(io: Server, socket: Socket) {
  socket.on(CLIENT_EVENTS.CHAT_MESSAGE, async (data: unknown, ack?: (res: SocketAckResponse) => void) => {
    try {
      const session = socket.session!;
      const parsed = ChatMessageSchema.parse(data);

      const repo = await getRepository();
      const participant = await repo.getParticipant(parsed.roomId, session.userId);
      if (!participant) {
        throw new Error('You must be a member of the room to send messages');
      }

      const message = await chatService.saveMessage({
        roomId: parsed.roomId,
        session,
        role: participant.role,
        content: parsed.content,
      });

      // Broadcast message to all room members
      io.to(parsed.roomId).emit(SERVER_EVENTS.CHAT_MESSAGE, { message });

      ack?.({ success: true, data: message });
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Chat error');
      ack?.({ success: false, error: { code: 'CHAT_ERROR', message: err.message } });
    }
  });
}
