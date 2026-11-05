import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { getFullMediaUrl, api } from '../services/api';
import { useToast } from './ToastContext';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
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

  // ตั้งค่า audio element เมื่อ mount
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (isLoop) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNextSong();
      }
    };
    const onError = (e) => {
      console.warn('Audio play error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [isLoop]);

  // เล่นเพลงเดี่ยว หรือเริ่มเล่นจากเพลย์ลิสต์
  const playSong = async (song, playlist = null) => {
    if (!song || !song.audio_path) return;

    const audio = audioRef.current;

    // ถ้ากดเล่นเพลงเดิมที่กำลังเล่นอยู่
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().then(() => setIsPlaying(true)).catch(console.error);
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
    audio.src = getFullMediaUrl(song.audio_path);
    audio.currentTime = 0;

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        // เรียก API เพื่อบันทึกยอด play_count ใน backend
        api.get(`/songs/${song.id}`).catch(() => {});
      })
      .catch((err) => {
        console.error('Play error:', err);
        setIsPlaying(false);
      });
  };

  const togglePlay = () => {
    if (!currentSong) return;
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const seek = (timeInSeconds) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = timeInSeconds;
    setCurrentTime(timeInSeconds);
  };

  const handleVolumeChange = (newVol) => {
    const vol = Math.max(0, Math.min(1, newVol));
    setVolume(vol);
    localStorage.setItem('orange_music_volume', vol.toString());
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
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
        currentTime,
        duration,
        volume,
        isMuted,
        isLoop,
        isShuffle,
        queue,
        queueIndex,
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
