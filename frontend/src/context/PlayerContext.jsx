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
            if (dur > 0) setDuration(dur);
          } catch (e) {}
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [currentSong, isPlaying]);

  // ตั้งค่า HTML5 audio element เมื่อ mount
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;
    audio.preload = 'auto';

    const onTimeUpdate = () => {
      if (!isYouTubeSong(currentSong)) {
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      if (!isYouTubeSong(currentSong)) {
        setDuration(audio.duration || 0);
        setIsBuffering(false);
      }
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const onCanPlay = () => setIsBuffering(false);
    const onEnded = () => {
      setIsBuffering(false);
      if (isLoop) {
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
  }, [isLoop, currentSong]);

  // เล่นเพลงเดี่ยว หรือเริ่มเล่นจากเพลย์ลิสต์ (รองรับทั้งไฟล์และ YouTube)
  const playSong = async (song, playlist = null) => {
    if (!song) return;

    const audio = audioRef.current;
    const isYt = isYouTubeSong(song);

    // ถ้ากดเล่นเพลงเดิมที่กำลังเล่นอยู่
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        if (isYt) {
          try { ytPlayerRef.current?.pauseVideo(); } catch (e) {}
        } else {
          audio.pause();
        }
        setIsPlaying(false);
      } else {
        if (isYt) {
          try { ytPlayerRef.current?.playVideo(); } catch (e) {}
          setIsPlaying(true);
        } else {
          audio.play().then(() => setIsPlaying(true)).catch(console.error);
        }
      }
      return;
    }

    // เซ็ตคิวเพลงใหม่ถ้าส่ง playlist มา
    if (playlist && Array.isArray(playlist)) {
      setQueue(playlist);
      const index = playlist.findIndex((s) => s.id === song.id);
      setQueueIndex(index !== -1 ? index : 0);
    } else if (queue.length === 0 || !queue.some((s) => s.id === song.id)) {
      setQueue([song]);
      setQueueIndex(0);
    } else {
      const idx = queue.findIndex((s) => s.id === song.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    }

    setCurrentSong(song);
    setIsBuffering(true);
    setCurrentTime(0);

    if (isYt) {
      // กรณีเพลง YouTube: หยุด HTML5 Audio แล้วส่ง Video ID ให้ YouTube Player
      audio.pause();
      audio.src = '';

      const vid = getYouTubeId(song);
      if (vid) {
        if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
          try {
            ytPlayerRef.current.loadVideoById(vid);
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
            setIsBuffering(false);
          } catch (ytErr) {
            console.warn('YouTube load error:', ytErr);
          }
        }
      }
      api.get(`/songs/${song.id}`).catch(() => {});
    } else {
      // กรณีเพลงไฟล์เสียงปกติ: หยุด YouTube แล้วสตรีมไฟล์เสียง
      try { ytPlayerRef.current?.stopVideo(); } catch (e) {}

      audio.src = getFullMediaUrl(song.audio_path);
      audio.currentTime = 0;

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
          api.get(`/songs/${song.id}`).catch(() => {});
        })
        .catch((err) => {
          console.error('Play error:', err);
          setIsBuffering(false);
          setIsPlaying(false);
        });
    }
  };

  const togglePlay = () => {
    if (!currentSong) return;
    const isYt = isYouTubeSong(currentSong);
    const audio = audioRef.current;

    if (isPlaying) {
      if (isYt) {
        try { ytPlayerRef.current?.pauseVideo(); } catch (e) {}
      } else {
        audio.pause();
      }
      setIsPlaying(false);
    } else {
      if (isYt) {
        try { ytPlayerRef.current?.playVideo(); } catch (e) {}
        setIsPlaying(true);
      } else {
        audio.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  };

  const seek = (timeInSeconds) => {
    setCurrentTime(timeInSeconds);
    const isYt = isYouTubeSong(currentSong);
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

  const handleNextSong = () => {
    if (queue.length === 0) return;

    let nextIndex = queueIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      nextIndex = 0; // วนกลับไปเพลงแรกของคิว
    }

    setQueueIndex(nextIndex);
    const nextSong = queue[nextIndex];
    if (nextSong) {
      playSong(nextSong, queue);
    }
  };

  const handlePrevSong = () => {
    if (queue.length === 0) return;

    // ถ้าเล่นเพลงผ่านไปเกิน 3 วินาทีแล้ว ให้เริ่มเพลงเดิมใหม่
    if (currentTime > 3) {
      seek(0);
      return;
    }

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    setQueueIndex(prevIndex);
    const prevSong = queue[prevIndex];
    if (prevSong) {
      playSong(prevSong, queue);
    }
  };

  const updateSongLikeStatus = (songId, isLiked, likeCount) => {
    if (currentSong && currentSong.id === songId) {
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
