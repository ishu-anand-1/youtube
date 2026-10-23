import React, { useEffect, useRef, useState } from 'react';
import { PlaybackState } from '@watchtogether/shared';
import { AlertCircle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  playback: PlaybackState | null;
  onPlayerReady?: (player: any) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onLocalPlay?: (position: number) => void;
  onLocalPause?: (position: number) => void;
  onLocalSeek?: (position: number) => void;
  canControl: boolean;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  playback,
  onPlayerReady,
  onTimeUpdate,
  onLocalPlay,
  onLocalPause,
  canControl,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isSyncingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    function initPlayer() {
      if (!containerRef.current || playerRef.current) return;

      const defaultVideoId = playback?.videoId || 'jfKfPfyJRdk';

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: defaultVideoId,
        playerVars: {
          autoplay: 0,
          controls: canControl ? 1 : 0, // Participants view without direct iframe scrub
          disablekb: canControl ? 0 : 1,
          enablejsapi: 1,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            setIsLoading(false);
            onPlayerReady?.(event.target);
          },
          onStateChange: handleStateChange,
          onError: (e: any) => {
            setIsLoading(false);
            setError(`YouTube player error (Code: ${e.data}). The video may be restricted from embedding.`);
          },
        },
      });
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // Update controls visibility based on permissions
  useEffect(() => {
    // When role changes, if player is ready, you can update options if supported
  }, [canControl]);

  // Handle player state changes triggered by user interactions
  const handleStateChange = (event: any) => {
    if (isSyncingRef.current) {
      // Event was triggered by server synchronization, not local user interaction
      return;
    }

    if (!canControl) {
      // Revert unauthorized manual player state changes by resynchronizing with server
      applyServerSync();
      return;
    }

    const state = event.data;
    const player = playerRef.current;
    if (!player) return;

    const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;

    // YT.PlayerState.PLAYING = 1, PAUSED = 2, BUFFERING = 3
    if (state === window.YT.PlayerState.PLAYING) {
      onLocalPlay?.(currentTime);
    } else if (state === window.YT.PlayerState.PAUSED) {
      onLocalPause?.(currentTime);
    }
  };

  // Sync engine: react to authoritative playback updates from server
  const applyServerSync = () => {
    const player = playerRef.current;
    if (!player || !isReady || !playback) return;

    try {
      isSyncingRef.current = true;

      // 1. Check videoId
      const currentVideoUrl = player.getVideoUrl ? player.getVideoUrl() : '';
      if (playback.videoId && !currentVideoUrl.includes(playback.videoId)) {
        player.loadVideoById({
          videoId: playback.videoId,
          startSeconds: playback.position || 0,
        });
      }

      // 2. Calculate expected authoritative position
      const now = Date.now();
      let expectedPosition = playback.position;
      if (playback.status === 'PLAYING') {
        const elapsed = Math.max(0, (now - playback.timestamp) / 1000);
        expectedPosition = playback.position + elapsed;
      }

      const localTime = player.getCurrentTime ? player.getCurrentTime() : 0;
      const drift = Math.abs(localTime - expectedPosition);

      // 3. Drift correction: seek only if drift exceeds 2 seconds
      if (drift > 2.0) {
        player.seekTo(expectedPosition, true);
      }

      // 4. Play / Pause status synchronization
      const playerState = player.getPlayerState ? player.getPlayerState() : -1;
      if (playback.status === 'PLAYING') {
        if (playerState !== window.YT.PlayerState.PLAYING && playerState !== window.YT.PlayerState.BUFFERING) {
          player.playVideo();
        }
      } else if (playback.status === 'PAUSED') {
        if (playerState === window.YT.PlayerState.PLAYING || playerState === window.YT.PlayerState.BUFFERING) {
          player.pauseVideo();
        }
      }
    } catch (err) {
      console.warn('Sync application error:', err);
    } finally {
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 400);
    }
  };

  useEffect(() => {
    applyServerSync();
  }, [playback, isReady]);

  // Periodic time update ticker for UI progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (player && isReady && onTimeUpdate) {
        try {
          const current = player.getCurrentTime ? player.getCurrentTime() : 0;
          const duration = player.getDuration ? player.getDuration() : 0;
          onTimeUpdate(current, duration);
        } catch {
          // ignore
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isReady, onTimeUpdate]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/90 shadow-2xl border border-white/10 group">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-muted gap-3">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading YouTube Player...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h4 className="text-lg font-semibold text-white">Playback Error</h4>
          <p className="text-sm text-slate-300 max-w-md mt-1">{error}</p>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
