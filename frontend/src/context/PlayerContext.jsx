import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { getFullMediaUrl, api } from '../services/api';
import { useToast } from './ToastContext';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const ytPlayerRef = useRef(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showVideoMV, setShowVideoMV] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('orange_music_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const { showToast } = useToast();

  // Refs เพื่อป้องกัน Stale Closures ใน Event Listeners และ Timers
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const queueIndexRef = useRef(queueIndex);
  queueIndexRef.current = queueIndex;
  const isLoopRef = useRef(isLoop);
  isLoopRef.current = isLoop;
  const isShuffleRef = useRef(isShuffle);
  isShuffleRef.current = isShuffle;
  const currentSongRef = useRef(currentSong);
  currentSongRef.current = currentSong;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;
  const durationRef = useRef(duration);
  durationRef.current = duration;

  const isYouTubeSong = (song) => {
    if (!song) return false;
    return (
      song.source_type === 'youtube' ||
      (typeof song.audio_path === 'string' && song.audio_path.startsWith('youtube:')) ||
      Boolean(song.youtube_id)
    );
  };

  const getYouTubeId = (song) => {
    if (!song) return null;
    if (song.youtube_id) return song.youtube_id;
    if (typeof song.audio_path === 'string' && song.audio_path.startsWith('youtube:')) {
      return song.audio_path.replace(/^youtube:/, '');
    }
    return null;
  };

  const registerYtPlayer = (player) => {
    ytPlayerRef.current = player;
  };

  // ติดตามเวลาของเพลง YouTube ทุก 500ms
  useEffect(() => {
    const isYt = isYouTubeSong(currentSong);
    if (isYt && isPlaying) {
      const interval = setInterval(() => {
        if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
          try {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setCurrentTime(cur);
            currentTimeRef.current = cur;
            if (dur > 0) {
              setDuration(dur);
              durationRef.current = dur;
            }
          } catch (e) {}
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [currentSong, isPlaying]);

  // ตั้งค่า HTML5 audio element
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;
    audio.preload = 'auto';

    const onTimeUpdate = () => {
      if (!isYouTubeSong(currentSongRef.current)) {
        setCurrentTime(audio.currentTime);
        currentTimeRef.current = audio.currentTime;
      }
    };
    const onLoadedMetadata = () => {
      if (!isYouTubeSong(currentSongRef.current)) {
        const dur = audio.duration || 0;
        setDuration(dur);
        durationRef.current = dur;
        setIsBuffering(false);
      }
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
      isPlayingRef.current = true;
    };
    const onCanPlay = () => setIsBuffering(false);
    const onEnded = () => {
      setIsBuffering(false);
      if (isLoopRef.current) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNextSong();
      }
    };
    const onError = (e) => {
      console.warn('Audio play error:', e);
      setIsBuffering(false);
      setIsPlaying(false);
      isPlayingRef.current = false;
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // เล่นเพลงเดี่ยว หรือเริ่มเล่นจากเพลย์ลิสต์ (รองรับทั้งไฟล์และ YouTube)
  const playSong = async (song, playlist = null, forceRestart = false) => {
    if (!song) return;

    const audio = audioRef.current;
    const isYt = isYouTubeSong(song);

    // ถ้ากดเล่นเพลงเดิมที่กำลังเล่นอยู่
    if (currentSongRef.current?.id === song.id && !forceRestart) {
      const isAtEnd = durationRef.current > 0 && currentTimeRef.current >= durationRef.current - 1;
      if (isAtEnd) {
        seek(0);
        if (isYt) {
          try {
            ytPlayerRef.current?.seekTo(0, true);
            ytPlayerRef.current?.playVideo();
          } catch (e) {}
        } else {
          audio.currentTime = 0;
          audio.play().then(() => {
            setIsPlaying(true);
            isPlayingRef.current = true;
          }).catch(console.error);
        }
        setIsPlaying(true);
        isPlayingRef.current = true;
        return;
      }

      if (isPlayingRef.current) {
        if (isYt) {
          try { ytPlayerRef.current?.pauseVideo(); } catch (e) {}
        } else {
          audio.pause();
        }
        setIsPlaying(false);
        isPlayingRef.current = false;
      } else {
        if (isYt) {
          try { ytPlayerRef.current?.playVideo(); } catch (e) {}
          setIsPlaying(true);
          isPlayingRef.current = true;
        } else {
          audio.play().then(() => {
            setIsPlaying(true);
            isPlayingRef.current = true;
          }).catch(console.error);
        }
      }
      return;
    }

    // เซ็ตคิวเพลงใหม่ (ตรวจสอบ playlist ว่ามีข้อมูลจริง)
    let newQueue = queueRef.current;
    if (playlist && Array.isArray(playlist) && playlist.length > 0) {
      newQueue = playlist;
      setQueue(playlist);
      queueRef.current = playlist;
      const index = playlist.findIndex((s) => s.id === song.id);
      const newIdx = index !== -1 ? index : 0;
      setQueueIndex(newIdx);
      queueIndexRef.current = newIdx;
    } else if (!newQueue || newQueue.length === 0 || !newQueue.some((s) => s.id === song.id)) {
      newQueue = [song];
      setQueue(newQueue);
      queueRef.current = newQueue;
      setQueueIndex(0);
      queueIndexRef.current = 0;

      // โหลดเพลงทั้งหมดมาต่อคิวอัตโนมัติ เพื่อให้ฟังเพลงต่อเนื่องได้ไม่มีสะดุด
      api.get('/songs?limit=50').then((res) => {
        if (res.success && res.songs && res.songs.length > 1) {
          const others = res.songs.filter((s) => s.id !== song.id);
          const autoQueue = [song, ...others];
          setQueue(autoQueue);
          queueRef.current = autoQueue;
        }
      }).catch(() => {});
    } else {
      const idx = newQueue.findIndex((s) => s.id === song.id);
      const newIdx = idx !== -1 ? idx : 0;
      setQueueIndex(newIdx);
      queueIndexRef.current = newIdx;
    }

    setCurrentSong(song);
    currentSongRef.current = song;
    setIsBuffering(true);
    setCurrentTime(0);
    currentTimeRef.current = 0;

    if (isYt) {
      audio.pause();
      audio.src = '';

      const vid = getYouTubeId(song);
      if (vid) {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          try {
            ytPlayerRef.current.loadVideoById(vid);
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
            isPlayingRef.current = true;
            setIsBuffering(false);
          } catch (ytErr) {
            console.warn('YouTube load error:', ytErr);
          }
        }
      }
      api.get(`/songs/${song.id}`).catch(() => {});
    } else {
      try { ytPlayerRef.current?.stopVideo(); } catch (e) {}

      audio.src = getFullMediaUrl(song.audio_path);
      audio.currentTime = 0;

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          isPlayingRef.current = true;
          setIsBuffering(false);
          api.get(`/songs/${song.id}`).catch(() => {});
        })
        .catch((err) => {
          console.error('Play error:', err);
          setIsBuffering(false);
          setIsPlaying(false);
          isPlayingRef.current = false;
        });
    }
  };

  const togglePlay = () => {
    const song = currentSongRef.current;
    if (!song) return;
    const isYt = isYouTubeSong(song);
    const audio = audioRef.current;

    if (isPlayingRef.current) {
      if (isYt) {
        try { ytPlayerRef.current?.pauseVideo(); } catch (e) {}
      } else {
        audio.pause();
      }
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      // ถ้าเพลงอยู่ท้ายคลิปหรือจบแล้ว ให้เริ่มเล่นจากวินาทีที่ 0
      const isAtEnd = durationRef.current > 0 && currentTimeRef.current >= durationRef.current - 1;
      if (isAtEnd) {
        seek(0);
      }

      if (isYt) {
        try {
          if (isAtEnd) ytPlayerRef.current?.seekTo(0, true);
          ytPlayerRef.current?.playVideo();
        } catch (e) {}
        setIsPlaying(true);
        isPlayingRef.current = true;
      } else {
        if (isAtEnd) audio.currentTime = 0;
        audio.play().then(() => {
          setIsPlaying(true);
          isPlayingRef.current = true;
        }).catch(console.error);
      }
    }
  };

  const seek = (timeInSeconds) => {
    setCurrentTime(timeInSeconds);
    currentTimeRef.current = timeInSeconds;
    const isYt = isYouTubeSong(currentSongRef.current);
    if (isYt) {
      try { ytPlayerRef.current?.seekTo(timeInSeconds, true); } catch (e) {}
    } else if (audioRef.current) {
      audioRef.current.currentTime = timeInSeconds;
    }
  };

  const handleVolumeChange = (newVol) => {
    const vol = Math.max(0, Math.min(1, newVol));
    setVolume(vol);
    localStorage.setItem('orange_music_volume', vol.toString());
    if (audioRef.current) audioRef.current.volume = vol;
    try { ytPlayerRef.current?.setVolume(vol * 100); } catch (e) {}
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      audioRef.current.volume = volume;
      try {
        ytPlayerRef.current?.unMute();
        ytPlayerRef.current?.setVolume(volume * 100);
      } catch (e) {}
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      try { ytPlayerRef.current?.mute(); } catch (e) {}
      setIsMuted(true);
    }
  };

  const toggleLoop = () => {
    setIsLoop((prev) => !prev);
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const handleNextSong = async () => {
    let currentQueue = queueRef.current;
    let currentIdx = queueIndexRef.current;
    const shuffle = isShuffleRef.current;

    // ถ้าไม่มีคิว หรือคิวมีแค่ 1 เพลง ให้ลองดึงเพลงทั้งหมดมาเติมคิว
    if (!currentQueue || currentQueue.length <= 1) {
      try {
        const res = await api.get('/songs?limit=50');
        if (res.success && res.songs && res.songs.length > 0) {
          currentQueue = res.songs;
          setQueue(currentQueue);
          queueRef.current = currentQueue;
          currentIdx = currentQueue.findIndex((s) => s.id === currentSongRef.current?.id);
          if (currentIdx === -1) currentIdx = 0;
          setQueueIndex(currentIdx);
          queueIndexRef.current = currentIdx;
        }
      } catch (e) {
        console.warn('Auto fetch queue error:', e);
      }
    }

    if (!currentQueue || currentQueue.length === 0) return;

    let nextIndex = currentIdx + 1;
    if (shuffle && currentQueue.length > 1) {
      let rand = currentIdx;
      while (rand === currentIdx) {
        rand = Math.floor(Math.random() * currentQueue.length);
      }
      nextIndex = rand;
    } else if (nextIndex >= currentQueue.length) {
      nextIndex = 0; // วนกลับไปเพลงแรกของคิว
    }

    setQueueIndex(nextIndex);
    queueIndexRef.current = nextIndex;
    const nextSong = currentQueue[nextIndex];
    if (nextSong) {
      playSong(nextSong, currentQueue, true);
    }
  };

  const handlePrevSong = () => {
    const currentQueue = queueRef.current;
    const currentIdx = queueIndexRef.current;

    if (!currentQueue || currentQueue.length === 0) return;

    // ถ้าเล่นเพลงผ่านไปเกิน 3 วินาทีแล้ว ให้เริ่มเพลงเดิมใหม่
    if (currentTimeRef.current > 3) {
      seek(0);
      return;
    }

    let prevIndex = currentIdx - 1;
    if (prevIndex < 0) {
      prevIndex = currentQueue.length - 1;
    }

    setQueueIndex(prevIndex);
    queueIndexRef.current = prevIndex;
    const prevSong = currentQueue[prevIndex];
    if (prevSong) {
      playSong(prevSong, currentQueue, true);
    }
  };

  const updateSongLikeStatus = (songId, isLiked, likeCount) => {
    if (currentSongRef.current && currentSongRef.current.id === songId) {
      setCurrentSong((prev) => ({
        ...prev,
        is_liked: isLiked,
        like_count: likeCount !== undefined ? likeCount : (prev.like_count || 0) + (isLiked ? 1 : -1),
      }));
    }
    setQueue((prevQueue) =>
      prevQueue.map((s) =>
        s.id === songId
          ? {
              ...s,
              is_liked: isLiked,
              like_count: likeCount !== undefined ? likeCount : (s.like_count || 0) + (isLiked ? 1 : -1),
            }
          : s
      )
    );
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        setIsPlaying,
        isBuffering,
        setIsBuffering,
        currentTime,
        duration,
        volume,
        isMuted,
        isLoop,
        isShuffle,
        queue,
        queueIndex,
        isYouTubeSong: isYouTubeSong(currentSong),
        showVideoMV,
        setShowVideoMV,
        registerYtPlayer,
        getYouTubeId,
        playSong,
        togglePlay,
        seek,
        setVolume: handleVolumeChange,
        toggleMute,
        toggleLoop,
        toggleShuffle,
        nextSong: handleNextSong,
        prevSong: handlePrevSong,
        updateSongLikeStatus,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
