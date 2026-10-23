import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomStore } from '../store/useRoomStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket.js';
import { roomApi } from '../lib/api.js';
import { YouTubePlayer } from '../components/player/YouTubePlayer.js';
import { PlaybackControls } from '../components/player/PlaybackControls.js';
import { ChangeVideoModal } from '../components/player/ChangeVideoModal.js';
import { InviteModal } from '../components/room/InviteModal.js';
import { RoomToolbar } from '../components/room/RoomToolbar.js';
import { ParticipantList } from '../components/room/ParticipantList.js';
import { ChatPanel } from '../components/room/ChatPanel.js';
import { RequestsPanel } from '../components/room/RequestsPanel.js';
import { 
  CLIENT_EVENTS, 
  SERVER_EVENTS, 
  RoomRole, 
  PlaybackState 
} from '@watchtogether/shared';
import { MessageSquare, Users, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const {
    room,
    currentRole,
    playback,
    participants,
    requests,
    messages,
    connectionStatus,
    activeTab,
    setRoom,
    updatePlayback,
    setParticipants,
    updateParticipantRole,
    updateParticipantStatus,
    addParticipant,
    removeParticipant,
    setCurrentRole,
    setRequests,
    addRequest,
    updateRequest,
    setMessages,
    addMessage,
    setConnectionStatus,
    setActiveTab,
    reset,
  } = useRoomStore();

  const { user } = useAuthStore();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isChangeVideoOpen, setIsChangeVideoOpen] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  const canControl = currentRole === 'HOST' || currentRole === 'MODERATOR';

  // 1. Initial Room Fetch & Verification
  useEffect(() => {
    if (!roomId) {
      navigate('/join');
      return;
    }

    let isMounted = true;

    const targetRoomId = roomId;

    async function loadRoom() {
      setIsLoadingRoom(true);
      setRoomError(null);
      try {
        const roomDetails = await roomApi.getRoom(targetRoomId);
        if (!isMounted) return;

        // Determine user's role from participants or hostId
        let role: RoomRole = 'PARTICIPANT';
        if (user && user.userId === roomDetails.hostId) {
          role = 'HOST';
        } else if (user) {
          const match = roomDetails.participants.find((p) => p.userId === user.userId);
          if (match) role = match.role;
        }

        setRoom(roomDetails, role);

        // Fetch initial chat and requests
        try {
          const [chatHistory, requestList] = await Promise.all([
            roomApi.getChatMessages(targetRoomId),
            roomApi.getRequests(targetRoomId),
          ]);
          if (isMounted) {
            setMessages(chatHistory);
            setRequests(requestList);
          }
        } catch {
          // Non-critical background fetches
        }
      } catch (err: any) {
        if (!isMounted) return;
        setRoomError(err.message || 'Room not found or unavailable');
      } finally {
        if (isMounted) setIsLoadingRoom(false);
      }
    }

    loadRoom();

    return () => {
      isMounted = false;
    };
  }, [roomId, user?.userId]);

  // 2. WebSocket Real-Time Event Integration
  useEffect(() => {
    if (!roomId) return;

    const socket = connectSocket();
    setConnectionStatus('connecting');

    const onConnect = () => {
      setConnectionStatus('connected');
      socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId }, (res: any) => {
        if (res?.success) {
          if (res.data?.role) {
            setCurrentRole(res.data.role);
          }
        } else {
          toast.error(res?.error?.message || 'Failed to join room WebSocket');
        }
      });
    };

    const onDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    const onReconnectAttempt = () => {
      setConnectionStatus('reconnecting');
    };

    // Server-to-Client Event Handlers
    const onRoomJoined = (data: { room: any; currentRole: RoomRole }) => {
      setRoom(data.room, data.currentRole);
    };

    const onUserJoined = (data: { participant: any }) => {
      addParticipant(data.participant);
      toast.info(`${data.participant.displayName} joined the party`);
    };

    const onUserLeft = (data: { userId: string; displayName: string }) => {
      updateParticipantStatus(data.userId, false);
      toast(`${data.displayName} left the party`);
    };

    const onPlaybackUpdated = (data: { playback: PlaybackState; actor: any }) => {
      updatePlayback(data.playback);
    };

    const onVideoChanged = (data: { playback: PlaybackState; actor: any }) => {
      updatePlayback(data.playback);
      toast.info(`Video changed to "${data.playback.videoTitle || 'new video'}" by ${data.actor.displayName}`);
    };

    const onRoleAssigned = (data: { targetUserId: string; targetDisplayName: string; newRole: RoomRole; assignedBy: string }) => {
      updateParticipantRole(data.targetUserId, data.newRole);
      if (user && data.targetUserId === user.userId) {
        setCurrentRole(data.newRole);
        toast.success(`You were assigned the ${data.newRole} role by ${data.assignedBy}!`);
      } else {
        toast.info(`${data.targetDisplayName} is now a ${data.newRole}`);
      }
    };

    const onParticipantRemoved = (data: { targetUserId: string; targetDisplayName?: string; reason?: string }) => {
      if (user && data.targetUserId === user.userId) {
        toast.error(`You were removed from this room: ${data.reason || 'by the host'}`);
        disconnectSocket();
        reset();
        navigate('/');
        return;
      }
      removeParticipant(data.targetUserId);
      toast.info(`${data.targetDisplayName || 'A participant'} was removed by the host`);
    };

    const onRequestCreated = (data: { request: any }) => {
      addRequest(data.request);
      if (canControl) {
        toast.info(`New request from ${data.request.userName}: ${data.request.action}`);
      }
    };

    const onRequestUpdated = (data: { request: any }) => {
      updateRequest(data.request);
      if (data.request.status === 'APPROVED') {
        toast.success(`Request by ${data.request.userName} was approved`);
      } else if (data.request.status === 'REJECTED') {
        toast.error(`Request by ${data.request.userName} was rejected`);
      }
    };

    const onChatMessage = (data: { message: any }) => {
      addMessage(data.message);
    };

    const onSyncState = (data: { playback: PlaybackState }) => {
      updatePlayback(data.playback);
    };

    const onError = (data: { message: string }) => {
      toast.error(data.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);

    socket.on(SERVER_EVENTS.ROOM_JOINED, onRoomJoined);
    socket.on(SERVER_EVENTS.USER_JOINED, onUserJoined);
    socket.on(SERVER_EVENTS.USER_LEFT, onUserLeft);
    socket.on(SERVER_EVENTS.PLAYBACK_UPDATED, onPlaybackUpdated);
    socket.on(SERVER_EVENTS.VIDEO_CHANGED, onVideoChanged);
    socket.on(SERVER_EVENTS.ROLE_ASSIGNED, onRoleAssigned);
    socket.on(SERVER_EVENTS.PARTICIPANT_REMOVED, onParticipantRemoved);
    socket.on(SERVER_EVENTS.REQUEST_CREATED, onRequestCreated);
    socket.on(SERVER_EVENTS.REQUEST_UPDATED, onRequestUpdated);
    socket.on(SERVER_EVENTS.CHAT_MESSAGE, onChatMessage);
    socket.on(SERVER_EVENTS.SYNC_STATE, onSyncState);
    socket.on(SERVER_EVENTS.ERROR, onError);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.off(SERVER_EVENTS.ROOM_JOINED, onRoomJoined);
      socket.off(SERVER_EVENTS.USER_JOINED, onUserJoined);
      socket.off(SERVER_EVENTS.USER_LEFT, onUserLeft);
      socket.off(SERVER_EVENTS.PLAYBACK_UPDATED, onPlaybackUpdated);
      socket.off(SERVER_EVENTS.VIDEO_CHANGED, onVideoChanged);
      socket.off(SERVER_EVENTS.ROLE_ASSIGNED, onRoleAssigned);
      socket.off(SERVER_EVENTS.PARTICIPANT_REMOVED, onParticipantRemoved);
      socket.off(SERVER_EVENTS.REQUEST_CREATED, onRequestCreated);
      socket.off(SERVER_EVENTS.REQUEST_UPDATED, onRequestUpdated);
      socket.off(SERVER_EVENTS.CHAT_MESSAGE, onChatMessage);
      socket.off(SERVER_EVENTS.SYNC_STATE, onSyncState);
      socket.off(SERVER_EVENTS.ERROR, onError);
    };
  }, [roomId, user?.userId]);

  // Client-to-Server Playback Commands
  const handlePlay = (position?: number) => {
    const socket = getSocket();
    const pos = typeof position === 'number' ? position : currentTime;
    socket.emit(CLIENT_EVENTS.PLAY, { roomId, position: pos }, (res: any) => {
      if (!res?.success) toast.error(res?.error?.message || 'Failed to play');
    });
  };

  const handlePause = (position?: number) => {
    const socket = getSocket();
    const pos = typeof position === 'number' ? position : currentTime;
    socket.emit(CLIENT_EVENTS.PAUSE, { roomId, position: pos }, (res: any) => {
      if (!res?.success) toast.error(res?.error?.message || 'Failed to pause');
    });
  };

  const handleSeek = (pos: number) => {
    const socket = getSocket();
    socket.emit(CLIENT_EVENTS.SEEK, { roomId, position: pos }, (res: any) => {
      if (!res?.success) toast.error(res?.error?.message || 'Failed to seek');
    });
  };

  const handleChangeVideo = (videoId: string, videoTitle?: string) => {
    const socket = getSocket();
    if (canControl) {
      socket.emit(
        CLIENT_EVENTS.CHANGE_VIDEO,
        { roomId, urlOrId: videoId, videoTitle },
        (res: any) => {
          if (!res?.success) toast.error(res?.error?.message || 'Failed to change video');
        }
      );
    } else {
      // Participant suggests video change as a request
      socket.emit(
        CLIENT_EVENTS.REQUEST_ACTION,
        { roomId, action: 'CHANGE_VIDEO', urlOrId: videoId, videoTitle },
        (res: any) => {
          if (res?.success) {
            toast.success('Video change suggested! Waiting for Host approval.');
          } else {
            toast.error(res?.error?.message || 'Failed to submit request');
          }
        }
      );
    }
  };

  const handleRequestAction = (action: 'PLAY' | 'PAUSE' | 'CHANGE_VIDEO') => {
    if (action === 'CHANGE_VIDEO') {
      setIsChangeVideoOpen(true);
      return;
    }
    const socket = getSocket();
    socket.emit(
      CLIENT_EVENTS.REQUEST_ACTION,
      { roomId, action, position: currentTime },
      (res: any) => {
        if (res?.success) {
          toast.success(`Requested ${action.toLowerCase()}! Waiting for Host approval.`);
        } else {
          toast.error(res?.error?.message || 'Failed to submit request');
        }
      }
    );
  };

  const handleApproveRequest = (requestId: string) => {
    const socket = getSocket();
    socket.emit(CLIENT_EVENTS.APPROVE_REQUEST, { roomId, requestId }, (res: any) => {
      if (!res?.success) toast.error(res?.error?.message || 'Failed to approve request');
    });
  };

  const handleRejectRequest = (requestId: string) => {
    const socket = getSocket();
    socket.emit(CLIENT_EVENTS.REJECT_REQUEST, { roomId, requestId }, (res: any) => {
      if (!res?.success) toast.error(res?.error?.message || 'Failed to reject request');
    });
  };

  const handleAssignRole = (targetUserId: string, newRole: RoomRole) => {
    const socket = getSocket();
    socket.emit(CLIENT_EVENTS.ASSIGN_ROLE, { roomId, targetUserId, role: newRole }, (res: any) => {
      if (!res?.success) toast.error(res?.error?.message || 'Failed to update role');
    });
  };

  const handleRemoveParticipant = (targetUserId: string) => {
    if (confirm('Are you sure you want to remove this participant from the watch party?')) {
      const socket = getSocket();
      socket.emit(
        CLIENT_EVENTS.REMOVE_PARTICIPANT,
        { roomId, targetUserId, reason: 'Removed by host' },
        (res: any) => {
          if (!res?.success) toast.error(res?.error?.message || 'Failed to remove participant');
        }
      );
    }
  };

  const handleSendMessage = (content: string) => {
    const socket = getSocket();
    socket.emit(CLIENT_EVENTS.CHAT_MESSAGE, { roomId, content }, (res: any) => {
      if (!res?.success) toast.error(res?.error?.message || 'Failed to send message');
    });
  };

  const handleLeaveRoom = () => {
    if (confirm('Leave this watch party?')) {
      disconnectSocket();
      reset();
      navigate('/');
    }
  };

  if (isLoadingRoom) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white gap-3">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <p className="text-sm font-medium text-slate-400">Entering Watch Party...</p>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white p-6 text-center">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full border border-white/10 flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Watch Party Unavailable</h2>
          <p className="text-sm text-slate-400 mb-6">{roomError || 'Room not found'}</p>
          <button
            onClick={() => navigate('/join')}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all shadow-lg shadow-accent/25"
          >
            Join Another Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100 overflow-hidden">
      {/* Room Navigation Toolbar */}
      <RoomToolbar
        roomName={room.name}
        roomCode={room.code}
        participantCount={participants.length}
        connectionStatus={connectionStatus}
        currentRole={currentRole}
        onOpenInvite={() => setIsInviteOpen(true)}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Main Experience Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left / Center: Video Player & Controls */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl mx-auto flex flex-col">
            {/* Embedded Official YouTube Player */}
            <YouTubePlayer
              playback={playback}
              canControl={canControl}
              onTimeUpdate={(cur, dur) => {
                setCurrentTime(cur);
                setDuration(dur);
              }}
              onLocalPlay={handlePlay}
              onLocalPause={handlePause}
            />

            {/* Video Meta Info Bar */}
            <div className="flex items-center justify-between mt-3 px-2">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  {playback?.videoTitle || 'YouTube Video'}
                </h2>
                <p className="text-xs text-slate-400">
                  Last updated by{' '}
                  <span className="text-slate-200 font-medium">{playback?.updatedBy || 'Host'}</span>
                </p>
              </div>
            </div>

            {/* Playback Controls */}
            <PlaybackControls
              isPlaying={playback?.status === 'PLAYING'}
              currentTime={currentTime}
              duration={duration}
              role={currentRole}
              onPlay={() => handlePlay()}
              onPause={() => handlePause()}
              onSeek={handleSeek}
              onChangeVideoClick={() => setIsChangeVideoOpen(true)}
              onRequestAction={handleRequestAction}
            />
          </div>
        </div>

        {/* Right: Side Panel (Chat, Participants, Requests) */}
        <div className="w-full lg:w-96 glass-panel border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-[420px] lg:h-auto flex-shrink-0">
          {/* Tab Selector */}
          <div className="flex items-center border-b border-white/5 bg-surface-muted/50 p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'chat'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'participants'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members ({participants.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all relative ${
                activeTab === 'requests'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Requests</span>
              {requests.filter((r) => r.status === 'PENDING').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && (
              <ChatPanel
                messages={messages}
                currentUserId={user?.userId}
                onSendMessage={handleSendMessage}
              />
            )}

            {activeTab === 'participants' && (
              <ParticipantList
                participants={participants}
                currentUserId={user?.userId}
                currentUserRole={currentRole}
                onAssignRole={handleAssignRole}
                onRemoveParticipant={handleRemoveParticipant}
              />
            )}

            {activeTab === 'requests' && (
              <RequestsPanel
                requests={requests}
                currentUserRole={currentRole}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <InviteModal
        isOpen={isInviteOpen}
        roomCode={room.code}
        onClose={() => setIsInviteOpen(false)}
      />

      <ChangeVideoModal
        isOpen={isChangeVideoOpen}
        role={currentRole}
        onClose={() => setIsChangeVideoOpen(false)}
        onSubmit={handleChangeVideo}
      />
    </div>
  );
};
