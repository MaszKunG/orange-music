import { useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';

/**
 * YouTubePlayer - Hidden YouTube IFrame player component
 * Creates a YT.Player instance and registers it with PlayerContext
 * Handles onStateChange events (ENDED, BUFFERING, PLAYING, PAUSED)
 */
const YouTubePlayer = () => {
  const containerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const {
    registerYtPlayer,
    currentSong,
    isYouTubeSong,
    getYouTubeId,
    isLoop,
    isPlaying,
    nextSong,
    setIsPlaying,
    setIsBuffering,
  } = usePlayer();

  // Keep refs for callbacks so player events always access the latest values
  const isLoopRef = useRef(isLoop);
  isLoopRef.current = isLoop;
  const currentSongRef = useRef(currentSong);
  currentSongRef.current = currentSong;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    let player = null;

    const createPlayer = () => {
      if (!containerRef.current || playerInstanceRef.current) return;

      player = new window.YT.Player(containerRef.current, {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            playerInstanceRef.current = event.target;
            registerYtPlayer(event.target);

            // If a YouTube song was chosen before player was ready
            if (currentSongRef.current && isYouTubeSong) {
              const vid = getYouTubeId(currentSongRef.current);
              if (vid && isPlayingRef.current) {
                try {
                  event.target.loadVideoById(vid);
                  event.target.playVideo();
                } catch (e) {
                  console.warn('Initial YT load error:', e);
                }
              }
            }
          },
          onStateChange: (event) => {
            const state = event.data;

            switch (state) {
              case window.YT.PlayerState.PLAYING:
                setIsPlaying(true);
                setIsBuffering(false);
                break;

              case window.YT.PlayerState.PAUSED:
                setIsPlaying(false);
                break;

              case window.YT.PlayerState.BUFFERING:
                setIsBuffering(true);
                break;

              case window.YT.PlayerState.ENDED:
                setIsBuffering(false);
                if (isLoopRef.current) {
                  event.target.seekTo(0);
                  event.target.playVideo();
                } else {
                  setIsPlaying(false);
                  nextSong();
                }
                break;

              default:
                break;
            }
          },
          onError: (event) => {
            console.error('YouTube Player Error:', event.data);
            setIsPlaying(false);
            setIsBuffering(false);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        createPlayer();
      };
    }

    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerInstanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0.001,
        pointerEvents: 'none',
        zIndex: -1,
      }}
      aria-hidden="true"
    >
      <div ref={containerRef} id="yt-player-container" />
    </div>
  );
};

export default YouTubePlayer;
