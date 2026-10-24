import React, { useEffect, useRef, useState } from 'react';
import { PlaybackState } from '@watchtogether/shared';
import { AlertCircle, Loader2, Maximize, RefreshCw, Volume2 } from 'lucide-react';
import { FloatingReactionsOverlay } from './FloatingReactions.js';
import { useRoomStore } from '../../store/useRoomStore.js';

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
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isSyncingRef = useRef(false);
  const isMountedRef = useRef(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const { isSyncing, setIsSyncing } = useRoomStore();

  // Load YouTube IFrame API script safely with isolated mount point
  useEffect(() => {
    isMountedRef.current = true;

    function initPlayer() {
      if (!containerRef.current || !isMountedRef.current || playerRef.current) return;

      try {
        // Completely isolate the YouTube DOM mount point from React's virtual DOM
        containerRef.current.innerHTML = '';
        const mountNode = document.createElement('div');
        mountNode.style.width = '100%';
        mountNode.style.height = '100%';
        containerRef.current.appendChild(mountNode);

        const defaultVideoId = playback?.videoId || 'jfKfPfyJRdk';

        playerRef.current = new window.YT.Player(mountNode, {
          videoId: defaultVideoId,
          playerVars: {
            autoplay: 0,
            controls: canControl ? 1 : 0,
            disablekb: canControl ? 0 : 1,
            enablejsapi: 1,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin,
            widget_referrer: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (!isMountedRef.current) return;
              setIsReady(true);
              setIsLoading(false);
              onPlayerReady?.(event.target);
            },
            onStateChange: handleStateChange,
            onError: (e: any) => {
              if (!isMountedRef.current) return;
              setIsLoading(false);
              setError(`YouTube player error (Code: ${e.data}). The video may be restricted from embedding.`);
            },
          },
        });
      } catch (err: any) {
        console.warn('YouTube Player initialization notice:', err);
      }
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') {
          try {
            prevCallback();
          } catch {
            // ignore
          }
        }
        if (isMountedRef.current) {
          initPlayer();
        }
      };
    }

    return () => {
      isMountedRef.current = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy?.();
        } catch {
          // ignore safe destroy cleanup errors
        }
        playerRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Handle player state changes triggered by user interactions
  const handleStateChange = (event: any) => {
    if (!isMountedRef.current || isSyncingRef.current) {
      return;
    }

    if (!canControl) {
      applyServerSync();
      return;
    }

    const state = event.data;
    const player = playerRef.current;
    if (!player) return;

    try {
      const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;

      // YT.PlayerState.PLAYING = 1, PAUSED = 2, BUFFERING = 3
      if (state === window.YT.PlayerState.PLAYING) {
        onLocalPlay?.(currentTime);
      } else if (state === window.YT.PlayerState.PAUSED) {
        onLocalPause?.(currentTime);
      }
    } catch {
      // player may be destroying or unmounted
    }
  };

  // Authoritative sync engine
  const applyServerSync = () => {
    const player = playerRef.current;
    if (!player || !isReady || !playback || !isMountedRef.current) return;

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
        setIsSyncing(true);
        player.seekTo(expectedPosition, true);
        setTimeout(() => {
          if (isMountedRef.current) setIsSyncing(false);
        }, 800);
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
      console.warn('Sync application notice:', err);
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
      if (player && isReady && onTimeUpdate && isMountedRef.current) {
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

  const handleManualSync = () => {
    applyServerSync();
  };

  const handleToggleFullscreen = () => {
    if (!playerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      playerWrapperRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div 
      ref={playerWrapperRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/95 shadow-2xl border border-blossom/20 group glow-card"
    >
      {/* Floating Reactions Layer */}
      <FloatingReactionsOverlay />

      {/* Syncing Indicator Pill */}
      {isSyncing && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-blossom/90 text-background text-xs font-bold backdrop-blur-md shadow-lg animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Synchronizing...</span>
        </div>
      )}

      {/* Top Action Overlay (Sync with Host & Fullscreen) */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleManualSync}
          className="px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-text-primary text-xs font-medium border border-blossom/20 backdrop-blur-sm flex items-center gap-1.5 shadow-md hover:border-blossom/40 transition-all"
          title="Force align with host playback"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blossom" />
          <span className="hidden sm:inline">Sync with Host</span>
        </button>

        <button
          onClick={handleToggleFullscreen}
          className="p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-text-primary text-xs border border-blossom/20 backdrop-blur-sm shadow-md hover:border-blossom/40 transition-all"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-4 h-4 text-blossom" />
        </button>
      </div>

      {/* Autoplay / Unmute Prompt if needed */}
      {needsUserInteraction && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-black/85 p-4 text-center backdrop-blur-sm">
          <Volume2 className="w-10 h-10 text-blossom mb-2 animate-bounce" />
          <h4 className="text-base font-semibold text-white">Browser Audio Restricted</h4>
          <p className="text-xs text-text-secondary max-w-sm mt-1 mb-3">
            Click to interact and enable synchronized audio for the watch party.
          </p>
          <button
            onClick={() => {
              setNeedsUserInteraction(false);
              playerRef.current?.unMute?.();
              playerRef.current?.playVideo?.();
            }}
            className="px-4 py-2 rounded-xl bg-blossom text-background text-xs font-bold shadow-blossom-sm hover:bg-blossom-hover transition-all"
          >
            Start Watching
          </button>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface gap-3">
          <Loader2 className="w-10 h-10 text-blossom animate-spin" />
          <p className="text-xs font-semibold text-text-secondary">Loading YouTube Player...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h4 className="text-base font-semibold text-white">Playback Error</h4>
          <p className="text-xs text-text-secondary max-w-md mt-1">{error}</p>
        </div>
      )}

      {/* 
        ISOLATED CONTAINER:
        React renders NO children inside this div. YouTube API replaces the internally created
        node with <iframe> without corrupting React's virtual DOM tree or triggering insertBefore errors.
      */}
      <div ref={containerRef} className="w-full h-full pointer-events-auto" />
    </div>
  );
};
