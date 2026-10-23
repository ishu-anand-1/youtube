import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../app.js';
import { initializeWebSocket } from '../websocket/socket.js';
import { authService } from '../modules/auth/auth.service.js';
import { roomService } from '../modules/rooms/room.service.js';
import { getRepository } from '../repositories/index.js';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@watchtogether/shared';

describe('Multi-Client WebSocket Synchronization & Role Enforcement', () => {
  let server: http.Server;
  let serverAddress: string;
  let syncEngine: any;
  let hostSocket: ClientSocket;
  let participantSocket: ClientSocket;
  let roomId: string;
  let roomCode: string;
  let hostUser: any;
  let partUser: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await getRepository();

    const app = createApp();
    server = http.createServer(app);
    const ws = initializeWebSocket(server);
    syncEngine = ws.syncEngine;

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const port = (server.address() as any).port;
        serverAddress = `http://localhost:${port}`;
        resolve();
      });
    });

    // 1. Create Host session and room
    const hostCreated = await authService.createGuestSession('HostAlice');
    hostUser = hostCreated.session;
    hostUser.token = hostCreated.rawToken;

    const room = await roomService.createRoom({
      name: 'Sync Room',
      session: hostUser,
    });
    roomId = room.id;
    roomCode = room.code;

    // 2. Create Participant session and join room
    const partCreated = await authService.createGuestSession('PartBob');
    partUser = partCreated.session;
    partUser.token = partCreated.rawToken;

    await roomService.joinRoom({
      roomCode,
      session: partUser,
    });
  });

  afterAll(async () => {
    if (hostSocket?.connected) hostSocket.disconnect();
    if (participantSocket?.connected) participantSocket.disconnect();
    syncEngine?.stop();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('Both clients connect to WebSocket with authentication tokens', async () => {
    hostSocket = ioc(serverAddress, {
      auth: { token: hostUser.token },
      transports: ['websocket'],
    });

    participantSocket = ioc(serverAddress, {
      auth: { token: partUser.token },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise<void>((resolve) => hostSocket.on('connect', resolve)),
      new Promise<void>((resolve) => participantSocket.on('connect', resolve)),
    ]);

    expect(hostSocket.connected).toBe(true);
    expect(participantSocket.connected).toBe(true);
  });

  it('Both clients join the room and receive authoritative room state', async () => {
    const hostJoinedPromise = new Promise<any>((resolve) => {
      hostSocket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId }, (res: any) => resolve(res));
    });

    const partJoinedPromise = new Promise<any>((resolve) => {
      participantSocket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId }, (res: any) => resolve(res));
    });

    const [hostRes, partRes] = await Promise.all([hostJoinedPromise, partJoinedPromise]);

    expect(hostRes.success).toBe(true);
    expect(hostRes.data.role).toBe('HOST');

    expect(partRes.success).toBe(true);
    expect(partRes.data.role).toBe('PARTICIPANT');
  });

  it('Host emits PLAY: Participant receives playback_updated event with PLAYING', async () => {
    const participantReceivedPromise = new Promise<any>((resolve) => {
      participantSocket.once(SERVER_EVENTS.PLAYBACK_UPDATED, (data) => resolve(data));
    });

    const hostAckPromise = new Promise<any>((resolve) => {
      hostSocket.emit(CLIENT_EVENTS.PLAY, { roomId, position: 10 }, (res: any) => resolve(res));
    });

    const [received, hostAck] = await Promise.all([participantReceivedPromise, hostAckPromise]);

    expect(hostAck.success).toBe(true);
    expect(received.playback.status).toBe('PLAYING');
    expect(received.playback.position).toBe(10);
    expect(received.actor.displayName).toBe('HostAlice');
  });

  it('Host emits PAUSE: Participant receives playback_updated with PAUSED', async () => {
    const participantReceivedPromise = new Promise<any>((resolve) => {
      participantSocket.once(SERVER_EVENTS.PLAYBACK_UPDATED, (data) => resolve(data));
    });

    const hostAckPromise = new Promise<any>((resolve) => {
      hostSocket.emit(CLIENT_EVENTS.PAUSE, { roomId, position: 15 }, (res: any) => resolve(res));
    });

    const [received, hostAck] = await Promise.all([participantReceivedPromise, hostAckPromise]);

    expect(hostAck.success).toBe(true);
    expect(received.playback.status).toBe('PAUSED');
    expect(received.playback.position).toBe(15);
  });

  it('Host emits SEEK: Participant receives updated position', async () => {
    const participantReceivedPromise = new Promise<any>((resolve) => {
      participantSocket.once(SERVER_EVENTS.PLAYBACK_UPDATED, (data) => resolve(data));
    });

    const hostAckPromise = new Promise<any>((resolve) => {
      hostSocket.emit(CLIENT_EVENTS.SEEK, { roomId, position: 120 }, (res: any) => resolve(res));
    });

    const [received, hostAck] = await Promise.all([participantReceivedPromise, hostAckPromise]);

    expect(hostAck.success).toBe(true);
    expect(received.playback.position).toBe(120);
  });

  it('Host emits CHANGE_VIDEO: Participant receives video_changed event', async () => {
    const participantReceivedPromise = new Promise<any>((resolve) => {
      participantSocket.once(SERVER_EVENTS.VIDEO_CHANGED, (data) => resolve(data));
    });

    const hostAckPromise = new Promise<any>((resolve) => {
      hostSocket.emit(
        CLIENT_EVENTS.CHANGE_VIDEO,
        { roomId, urlOrId: 'https://youtu.be/dQw4w9WgXcQ', videoTitle: 'Never Gonna Give You Up' },
        (res: any) => resolve(res)
      );
    });

    const [received, hostAck] = await Promise.all([participantReceivedPromise, hostAckPromise]);

    expect(hostAck.success).toBe(true);
    expect(received.playback.videoId).toBe('dQw4w9WgXcQ');
    expect(received.playback.videoTitle).toBe('Never Gonna Give You Up');
  });

  it('Participant attempts direct PLAY command: Server REJECTS with permission error', async () => {
    const partAck = await new Promise<any>((resolve) => {
      participantSocket.emit(CLIENT_EVENTS.PLAY, { roomId, position: 0 }, (res: any) => resolve(res));
    });

    expect(partAck.success).toBe(false);
    expect(partAck.error.code).toBe('FORBIDDEN');
    expect(partAck.error.message).toContain('Host or a Moderator');
  });

  it('Participant submits action request, Host receives request_created, Host approves', async () => {
    const hostReceivedReqPromise = new Promise<any>((resolve) => {
      hostSocket.once(SERVER_EVENTS.REQUEST_CREATED, (data) => resolve(data));
    });

    const partSubmitPromise = new Promise<any>((resolve) => {
      participantSocket.emit(
        CLIENT_EVENTS.REQUEST_ACTION,
        { roomId, action: 'PLAY', position: 55 },
        (res: any) => resolve(res)
      );
    });

    const [reqEvent, partAck] = await Promise.all([hostReceivedReqPromise, partSubmitPromise]);

    expect(partAck.success).toBe(true);
    expect(reqEvent.request.action).toBe('PLAY');
    expect(reqEvent.request.userId).toBe(partUser.userId);

    // Host approves request
    const partReceivedUpdatePromise = new Promise<any>((resolve) => {
      participantSocket.once(SERVER_EVENTS.REQUEST_UPDATED, (data) => resolve(data));
    });

    const hostApproveAckPromise = new Promise<any>((resolve) => {
      hostSocket.emit(
        CLIENT_EVENTS.APPROVE_REQUEST,
        { roomId, requestId: reqEvent.request.id },
        (res: any) => resolve(res)
      );
    });

    const [updatedReqEvent, approveAck] = await Promise.all([
      partReceivedUpdatePromise,
      hostApproveAckPromise,
    ]);

    expect(approveAck.success).toBe(true);
    expect(updatedReqEvent.request.status).toBe('APPROVED');
  });

  it('Host assigns Moderator role to Participant: both receive role_assigned event', async () => {
    const partRolePromise = new Promise<any>((resolve) => {
      participantSocket.once(SERVER_EVENTS.ROLE_ASSIGNED, (data) => resolve(data));
    });

    const hostAssignPromise = new Promise<any>((resolve) => {
      hostSocket.emit(
        CLIENT_EVENTS.ASSIGN_ROLE,
        { roomId, targetUserId: partUser.userId, role: 'MODERATOR' },
        (res: any) => resolve(res)
      );
    });

    const [roleEvent, hostAck] = await Promise.all([partRolePromise, hostAssignPromise]);

    expect(hostAck.success).toBe(true);
    expect(roleEvent.newRole).toBe('MODERATOR');
    expect(roleEvent.targetUserId).toBe(partUser.userId);
  });

  it('Newly promoted Moderator can now directly control playback!', async () => {
    const hostReceivedPromise = new Promise<any>((resolve) => {
      hostSocket.once(SERVER_EVENTS.PLAYBACK_UPDATED, (data) => resolve(data));
    });

    const modAck = await new Promise<any>((resolve) => {
      participantSocket.emit(CLIENT_EVENTS.PLAY, { roomId, position: 200 }, (res: any) => resolve(res));
    });

    const hostReceived = await hostReceivedPromise;

    expect(modAck.success).toBe(true);
    expect(hostReceived.playback.position).toBe(200);
    expect(hostReceived.actor.displayName).toBe('PartBob');
  });

  it('Host removes participant: target receives participant_removed and is ejected', async () => {
    const targetRemovedPromise = new Promise<any>((resolve) => {
      participantSocket.once(SERVER_EVENTS.PARTICIPANT_REMOVED, (data) => resolve(data));
    });

    const hostRemoveAckPromise = new Promise<any>((resolve) => {
      hostSocket.emit(
        CLIENT_EVENTS.REMOVE_PARTICIPANT,
        { roomId, targetUserId: partUser.userId, reason: 'Test ejection' },
        (res: any) => resolve(res)
      );
    });

    const [removedEvent, hostAck] = await Promise.all([targetRemovedPromise, hostRemoveAckPromise]);

    expect(hostAck.success).toBe(true);
    expect(removedEvent.targetUserId).toBe(partUser.userId);
    expect(removedEvent.reason).toBe('Test ejection');
  });
});
