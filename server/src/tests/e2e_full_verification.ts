import { io as ioc, Socket } from 'socket.io-client';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@watchtogether/shared';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';

interface UserClient {
  index: number;
  displayName: string;
  userId: string;
  token: string;
  socket: Socket | null;
  receivedChats: number;
  receivedPlayback: number;
  receivedSyncs: number;
}

async function createGuestSession(displayName: string) {
  const res = await fetch(`${SERVER_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  });
  const data = await res.json() as any;
  if (!res.ok || !data.success) throw new Error(`Create session failed: ${JSON.stringify(data)}`);
  return {
    userId: data.data.userId,
    token: data.data.token,
    displayName: data.data.displayName,
  };
}

async function createRoom(token: string, name: string, displayName: string) {
  const res = await fetch(`${SERVER_URL}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      displayName,
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    }),
  });
  const data = await res.json() as any;
  if (!res.ok || !data.success) throw new Error(`Create room failed: ${JSON.stringify(data)}`);
  return data.data.room;
}

function connectSocket(token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = ioc(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      timeout: 10000,
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
  });
}

async function main() {
  console.log(`\n===============================================================`);
  console.log(`🧪 WATCHTOGETHER END-TO-END LOAD & CONCURRENCY VERIFICATION`);
  console.log(`   Target Server: ${SERVER_URL}`);
  console.log(`===============================================================\n`);

  // Step 1: Health Check
  console.log('🔍 Step 1: Checking Backend Health...');
  const healthRes = await fetch(`${SERVER_URL}/health/live`);
  const healthData = await healthRes.json() as any;
  console.log(`   Health status: ${healthData.status}, Uptime: ${healthData.uptime.toFixed(1)}s\n`);

  // Step 2: Create Room as Host
  console.log('👑 Step 2: Creating Test Room as Host Alice...');
  const hostSession = await createGuestSession('Host_Alice');
  const room = await createRoom(hostSession.token, 'Mega Watch Party 100', hostSession.displayName);
  console.log(`   ✅ Room created: [${room.code}] (ID: ${room.id})`);
  console.log(`   🔗 Direct Invite Link: http://localhost:5174/join?code=${room.code}\n`);

  // Step 3: Connect Host WebSocket
  console.log('🔌 Step 3: Connecting Host WebSocket and joining room...');
  const hostSocket = await connectSocket(hostSession.token);
  let hostObservedCount = 1;
  const userJoinedEvents: any[] = [];

  hostSocket.on(SERVER_EVENTS.USER_JOINED, (data: any) => {
    userJoinedEvents.push(data.participant);
    hostObservedCount++;
  });

  hostSocket.on(SERVER_EVENTS.USER_LEFT, (data: any) => {
    hostObservedCount--;
  });

  await new Promise<void>((resolve, reject) => {
    hostSocket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId: room.id }, (ack: any) => {
      if (ack?.success) resolve();
      else reject(new Error('Host join failed'));
    });
  });
  console.log(`   ✅ Host joined room. Initial participant count: 1\n`);

  // Step 4: Test 1 - Quick 10 Users Join
  console.log('👥 Step 4: Testing 10 Users Joining...');
  const test10Users: UserClient[] = [];
  for (let i = 1; i <= 10; i++) {
    const s = await createGuestSession(`User_${i.toString().padStart(2, '0')}`);
    test10Users.push({
      index: i,
      displayName: s.displayName,
      userId: s.userId,
      token: s.token,
      socket: null,
      receivedChats: 0,
      receivedPlayback: 0,
      receivedSyncs: 0,
    });
  }

  for (const u of test10Users) {
    const s = await connectSocket(u.token);
    u.socket = s;
    await new Promise<void>((res, rej) => {
      s.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId: room.id }, (ack: any) => {
        if (ack?.success) res();
        else rej(new Error(`Join failed for ${u.displayName}`));
      });
    });
  }

  // Allow short delay for events to settle
  await new Promise((r) => setTimeout(r, 800));

  console.log(`   📊 After 10 users joined:`);
  console.log(`      Host observed count: ${hostObservedCount} (Expected: 11)`);
  console.log(`      USER_JOINED events received: ${userJoinedEvents.length} (Expected: 10)`);
  if (hostObservedCount === 11) {
    console.log(`   ✅ 10-user test PASSED!\n`);
  } else {
    console.warn(`   ⚠️ 10-user test count mismatch: got ${hostObservedCount}, expected 11\n`);
  }

  // Step 5: Test 2 - Scale to 100 Total Users (Add 90 more users)
  console.log('🚀 Step 5: Scaling up to 100 Total Users (Adding 90 more users)...');
  const remaining90Users: UserClient[] = [];
  const startScaleTime = Date.now();

  for (let i = 11; i <= 100; i++) {
    const s = await createGuestSession(`User_${i.toString().padStart(3, '0')}`);
    remaining90Users.push({
      index: i,
      displayName: s.displayName,
      userId: s.userId,
      token: s.token,
      socket: null,
      receivedChats: 0,
      receivedPlayback: 0,
      receivedSyncs: 0,
    });
  }

  const allUsers = [...test10Users, ...remaining90Users];

  // Attach listeners to all users for broadcast verification
  for (const u of allUsers) {
    if (u.socket) {
      u.socket.on(SERVER_EVENTS.CHAT_MESSAGE, () => u.receivedChats++);
      u.socket.on(SERVER_EVENTS.PLAYBACK_UPDATED, () => u.receivedPlayback++);
      u.socket.on(SERVER_EVENTS.SYNC_STATE, () => u.receivedSyncs++);
    }
  }

  // Connect remaining 90 users in batches of 15
  const batchSize = 15;
  for (let b = 0; b < remaining90Users.length; b += batchSize) {
    const chunk = remaining90Users.slice(b, b + batchSize);
    await Promise.all(
      chunk.map(async (u) => {
        const s = await connectSocket(u.token);
        u.socket = s;
        s.on(SERVER_EVENTS.CHAT_MESSAGE, () => u.receivedChats++);
        s.on(SERVER_EVENTS.PLAYBACK_UPDATED, () => u.receivedPlayback++);
        s.on(SERVER_EVENTS.SYNC_STATE, () => u.receivedSyncs++);
        return new Promise<void>((res, rej) => {
          s.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId: room.id }, (ack: any) => {
            if (ack?.success) res();
            else rej(new Error(`Join failed for ${u.displayName}`));
          });
        });
      })
    );
    process.stdout.write(`   Joined ${b + chunk.length + 10} / 100 total participants...\r`);
    await new Promise((r) => setTimeout(r, 100));
  }

  const scaleDuration = (Date.now() - startScaleTime) / 1000;
  console.log(`\n   ⏱️  Scaled to 100 users in ${scaleDuration.toFixed(2)}s`);

  // Wait for all socket broadcasts to settle
  await new Promise((r) => setTimeout(r, 1500));

  console.log(`\n📊 Step 6: Verifying 100-User Room State...`);
  console.log(`   Host Observed Count:            ${hostObservedCount} (Expected: 101 including Host)`);
  console.log(`   Total USER_JOINED Events:       ${userJoinedEvents.length} (Expected: 100)`);
  console.log(`   Active Sockets in Array:        ${allUsers.filter((u) => u.socket?.connected).length}`);

  // Fetch Authoritative Participants from HTTP API to double-verify backend DB state
  const roomCheckRes = await fetch(`${SERVER_URL}/api/rooms/${room.id}`);
  const roomCheckData = await roomCheckRes.json() as any;
  const dbParticipantsCount = roomCheckData.data.participants.length;
  console.log(`   Database Total Participants:    ${dbParticipantsCount}`);

  // Step 7: Broadcast Test - Host sends Chat & Playback Command
  console.log(`\n📡 Step 7: Testing Real-time Broadcast Across all 100 connected sockets...`);
  const broadcastStart = Date.now();

  // Host sends a chat message
  await new Promise<void>((resolve) => {
    hostSocket.emit(
      CLIENT_EVENTS.CHAT_MESSAGE,
      { roomId: room.id, content: '🎉 Welcome all 100 participants to WatchTogether!' },
      () => resolve()
    );
  });

  // Host triggers Play
  await new Promise<void>((resolve) => {
    hostSocket.emit(CLIENT_EVENTS.PLAY, { roomId: room.id, position: 42 }, () => resolve());
  });

  // Wait 1.5s for delivery
  await new Promise((r) => setTimeout(r, 1500));

  const usersGotChat = allUsers.filter((u) => u.receivedChats > 0).length;
  const usersGotPlayback = allUsers.filter((u) => u.receivedPlayback > 0).length;
  const broadcastLatency = Date.now() - broadcastStart;

  console.log(`   Chat Received by:     ${usersGotChat} / 100 users (${((usersGotChat / 100) * 100).toFixed(0)}%)`);
  console.log(`   Playback Received by: ${usersGotPlayback} / 100 users (${((usersGotPlayback / 100) * 100).toFixed(0)}%)`);
  console.log(`   Broadcast Turnaround: ${broadcastLatency}ms`);

  // Step 8: Clean Disconnect & Teardown
  console.log(`\n🧹 Step 8: Teardown & Disconnection...`);
  for (const u of allUsers) {
    u.socket?.disconnect();
  }
  hostSocket.disconnect();

  console.log(`\n===============================================================`);
  console.log(`📋 TEST SUMMARY RESULTS`);
  console.log(`===============================================================`);
  console.log(`   Room Code:                     ${room.code}`);
  console.log(`   100 Users Join Status:         ${hostObservedCount === 101 ? '✅ PASSED' : '⚠️ MISMATCH'}`);
  console.log(`   Top Participant Counter:       ${hostObservedCount} (1 Host + 100 Users = 101)`);
  console.log(`   Realtime Broadcast Delivery:   ${usersGotChat === 100 && usersGotPlayback === 100 ? '✅ 100% RELIABLE' : '⚠️ PARTIAL'}`);
  console.log(`   Database Consistency:          ${dbParticipantsCount >= 101 ? '✅ CONSISTENT' : '⚠️ DB DRIFT'}`);
  console.log(`===============================================================\n`);

  if (hostObservedCount === 101 && usersGotChat === 100) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal Test Failure:', err);
  process.exit(1);
});
