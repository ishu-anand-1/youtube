import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getRepository } from '../repositories/index.js';

describe('HTTP REST API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await getRepository();
    app = createApp();
  });

  it('GET /health/live returns UP status', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('watchtogether-server');
  });

  it('GET /health/ready returns READY status', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('READY');
  });

  it('POST /api/auth/session creates guest session and sets cookie', async () => {
    const res = await request(app)
      .post('/api/auth/session')
      .send({ displayName: 'TestUser' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.displayName).toBe('TestUser');
    expect(res.body.data.token).toBeDefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('wt_session=');
  });

  it('Complete Room Workflow: Create, Join, Role Change, Request & Approve', async () => {
    // 1. Host creates session
    const hostAuth = await request(app)
      .post('/api/auth/session')
      .send({ displayName: 'AliceHost' });
    const hostToken = hostAuth.body.data.token;
    const hostId = hostAuth.body.data.userId;

    // 2. Host creates room
    const createRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        name: 'Cool Party',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        displayName: 'AliceHost',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const room = createRes.body.data.room;
    expect(room.name).toBe('Cool Party');
    expect(room.hostId).toBe(hostId);
    expect(room.code).toBeDefined();
    expect(room.playback.status).toBe('PAUSED');
    expect(room.playback.videoId).toBe('dQw4w9WgXcQ');

    // 3. Participant creates session & joins room
    const partAuth = await request(app)
      .post('/api/auth/session')
      .send({ displayName: 'BobParticipant' });
    const partToken = partAuth.body.data.token;
    const partId = partAuth.body.data.userId;

    const joinRes = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${partToken}`)
      .send({
        roomCode: room.code,
        displayName: 'BobParticipant',
      });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.success).toBe(true);
    expect(joinRes.body.data.participant.role).toBe('PARTICIPANT');

    // 4. Participant submits an action request to PLAY
    const reqRes = await request(app)
      .post(`/api/rooms/${room.id}/requests`)
      .set('Authorization', `Bearer ${partToken}`)
      .send({
        action: 'PLAY',
        position: 15,
      });

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.success).toBe(true);
    const actionReq = reqRes.body.data;
    expect(actionReq.status).toBe('PENDING');
    expect(actionReq.action).toBe('PLAY');

    // 5. Host approves the action request
    const approveRes = await request(app)
      .post(`/api/rooms/${room.id}/requests/${actionReq.id}/approve`)
      .set('Authorization', `Bearer ${hostToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.request.status).toBe('APPROVED');
    expect(approveRes.body.data.updatedPlayback.status).toBe('PLAYING');

    // 6. Host promotes Participant to MODERATOR
    const roleRes = await request(app)
      .patch(`/api/rooms/${room.id}/participants/${partId}/role`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ role: 'MODERATOR' });

    expect(roleRes.status).toBe(200);
    expect(roleRes.body.success).toBe(true);
    expect(roleRes.body.data.role).toBe('MODERATOR');

    // 7. Unauthenticated user cannot promote anyone
    const unauthRes = await request(app)
      .patch(`/api/rooms/${room.id}/participants/${partId}/role`)
      .send({ role: 'PARTICIPANT' });

    expect(unauthRes.status).toBe(401);
  });

  it('Regression Test: Allows requests from http://localhost:5174 with CORS headers', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Origin', 'http://localhost:5174')
      .send({
        displayName: 'CorsUser',
        name: 'CORS Test Room',
      });

    expect(res.status).toBe(201);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5174');
    expect(res.body.success).toBe(true);
    expect(res.body.data.room.code).toBeDefined();
  });

  it('Regression Test: Returns 404 ROOM_NOT_FOUND when joining non-existent room code', async () => {
    const res = await request(app)
      .post('/api/rooms/join')
      .set('Origin', 'http://localhost:5174')
      .send({
        roomCode: 'NONEXS',
        displayName: 'LostGuest',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROOM_NOT_FOUND');
    expect(res.body.error.message).toContain('Room not found');
  });

  it('Regression Test: Returns 400 VALIDATION_ERROR on missing or invalid fields', async () => {
    // Missing displayName
    const res1 = await request(app)
      .post('/api/rooms')
      .send({ name: 'No Name Room' });

    expect(res1.status).toBe(400);
    expect(res1.body.success).toBe(false);
    expect(res1.body.error.code).toBe('VALIDATION_ERROR');

    // Invalid YouTube URL
    const res2 = await request(app)
      .post('/api/rooms')
      .send({
        displayName: 'ValidName',
        videoUrl: 'https://notyoutube.com/video',
      });

    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);
    expect(res2.body.error.code).toBe('VALIDATION_ERROR');

    // Invalid 7-character room code in join
    const res3 = await request(app)
      .post('/api/rooms/join')
      .send({
        roomCode: 'TOOLONG1',
        displayName: 'ValidName',
      });

    expect(res3.status).toBe(400);
    expect(res3.body.success).toBe(false);
    expect(res3.body.error.code).toBe('VALIDATION_ERROR');
  });
});
