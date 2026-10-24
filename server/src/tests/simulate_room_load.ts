import { io as ioc, Socket } from 'socket.io-client';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@watchtogether/shared';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';

interface SimulatedUser {
  index: number;
  displayName: string;
  userId: string;
  token: string;
  socket: Socket | null;
  joined: boolean;
  receivedSyncs: number;
  receivedChats: number;
}

export async function createGuestSession(displayName: string, serverUrl = SERVER_URL): Promise<{ userId: string; token: string; displayName: string }> {
  const res = await fetch(`${serverUrl}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  });

  const data = await res.json() as any;
  if (!res.ok || !data.success) {
    throw new Error(`Failed to create guest session for ${displayName}: ${JSON.stringify(data)}`);
  }

  return {
    userId: data.data.userId,
    token: data.data.token,
    displayName: data.data.displayName,
  };
}

export async function joinRoomHttp(roomCode: string, sessionToken: string, displayName: string, serverUrl = SERVER_URL) {
  const res = await fetch(`${serverUrl}/api/rooms/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ roomCode, displayName }),
  });

  const data = await res.json() as any;
  if (!res.ok || !data.success) {
    throw new Error(`Failed to join room via HTTP for ${displayName}: ${JSON.stringify(data)}`);
  }

  return data.data;
}

export async function connectSocketAndJoin(
  user: SimulatedUser,
  roomId: string,
  serverUrl = SERVER_URL
): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = ioc(serverUrl, {
      auth: { token: user.token },
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      timeout: 10000,
    });

    const timeout = setTimeout(() => {
      reject(new Error(`Socket connection timeout for user ${user.displayName}`));
    }, 10000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      user.socket = socket;

      // Join room via socket
      socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId }, (ack: any) => {
        if (ack?.success) {
          user.joined = true;
          resolve(socket);
        } else {
          reject(new Error(`Failed to join room: ${JSON.stringify(ack?.error)}`));
        }
      });
    });

    socket.on(SERVER_EVENTS.SYNC_STATE, () => {
      user.receivedSyncs++;
    });

    socket.on(SERVER_EVENTS.CHAT_MESSAGE, () => {
      user.receivedChats++;
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export async function runLoadSimulation(params: {
  roomId: string;
  roomCode: string;
  userCount: number;
  batchSize?: number;
  batchDelayMs?: number;
  holdSeconds?: number;
}) {
  const { roomId, roomCode, userCount, batchSize = 10, batchDelayMs = 200, holdSeconds = 30 } = params;
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Load Test: ${userCount} users joining Room [${roomCode}] (ID: ${roomId})`);
  console.log(`   Target Server: ${SERVER_URL}`);
  console.log(`======================================================\n`);

  const startTime = Date.now();
  const users: SimulatedUser[] = [];

  // Phase 1: Create sessions and prepare users
  console.log(`📦 Phase 1: Creating ${userCount} guest user sessions...`);
  for (let i = 1; i <= userCount; i++) {
    const displayName = `TestUser_${i.toString().padStart(3, '0')}`;
    try {
      const session = await createGuestSession(displayName);
      users.push({
        index: i,
        displayName,
        userId: session.userId,
        token: session.token,
        socket: null,
        joined: false,
        receivedSyncs: 0,
        receivedChats: 0,
      });
      if (i % 25 === 0 || i === userCount) {
        console.log(`   Created ${i}/${userCount} sessions`);
      }
    } catch (err: any) {
      console.error(`   ❌ Failed to create session for user ${i}:`, err.message);
    }
  }

  console.log(`   ✅ Successfully created ${users.length} sessions in ${Date.now() - startTime}ms\n`);

  // Phase 2: Connect sockets and join room in batches
  console.log(`⚡ Phase 2: Connecting and joining ${users.length} WebSocket clients in batches of ${batchSize}...`);
  const joinStartTime = Date.now();
  let successfulJoins = 0;
  let failedJoins = 0;

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const promises = batch.map(async (u) => {
      try {
        await connectSocketAndJoin(u, roomId);
        successfulJoins++;
      } catch (err: any) {
        failedJoins++;
        console.warn(`   ⚠️ User ${u.displayName} join failed:`, err.message);
      }
    });

    await Promise.all(promises);
    console.log(`   Progress: ${Math.min(i + batchSize, users.length)}/${users.length} connected...`);
    if (batchDelayMs > 0 && i + batchSize < users.length) {
      await new Promise((r) => setTimeout(r, batchDelayMs));
    }
  }

  const joinDuration = (Date.now() - joinStartTime) / 1000;
  console.log(`\n\n🎉 Join Phase Complete!`);
  console.log(`   ✅ Successful Joins: ${successfulJoins}/${users.length}`);
  console.log(`   ❌ Failed Joins:     ${failedJoins}`);
  console.log(`   ⏱️  Total Join Time:  ${joinDuration.toFixed(2)}s (${(successfulJoins / joinDuration).toFixed(1)} joins/sec)\n`);

  // Phase 3: Hold connections and monitor
  if (holdSeconds > 0) {
    console.log(`⏳ Phase 3: Holding ${successfulJoins} active connections for ${holdSeconds} seconds...`);
    console.log(`   👉 You can now check the browser UI! Participant counter should reflect all users!`);

    for (let s = holdSeconds; s > 0; s -= 5) {
      console.log(`   Holding... ${s}s remaining (${successfulJoins} users still connected)`);
      await new Promise((r) => setTimeout(r, Math.min(5000, s * 1000)));
    }
  }

  // Phase 4: Cleanup
  console.log(`\n🧹 Phase 4: Disconnecting all simulated users...`);
  for (const u of users) {
    if (u.socket?.connected) {
      u.socket.disconnect();
    }
  }
  console.log(`   ✅ All simulated users disconnected.\n`);

  return {
    totalRequested: userCount,
    successfulJoins,
    failedJoins,
    durationSeconds: joinDuration,
  };
}

// CLI entry point
if (process.argv[1]?.endsWith('simulate_room_load.ts')) {
  const args = process.argv.slice(2);
  const roomId = args[0];
  const roomCode = args[1];
  const count = parseInt(args[2] || '10', 10);
  const hold = parseInt(args[3] || '30', 10);

  if (!roomId || !roomCode) {
    console.error('Usage: tsx simulate_room_load.ts <roomId> <roomCode> [userCount=10] [holdSeconds=30]');
    process.exit(1);
  }

  runLoadSimulation({
    roomId,
    roomCode,
    userCount: count,
    holdSeconds: hold,
  })
    .then((result) => {
      console.log('Test Summary:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal Test Error:', err);
      process.exit(1);
    });
}
