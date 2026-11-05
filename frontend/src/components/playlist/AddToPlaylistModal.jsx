import React, { useState, useEffect } from 'react';
import { X, Plus, Check, ListMusic, Music } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AddToPlaylistModal({ song, isOpen, onClose }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && song) {
      loadPlaylists();
    }
  }, [isOpen, song]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const res = await api.get('/playlists');
      if (res.success) {
        setPlaylists(res.playlists);
      }
    } catch (err) {
      showToast('ไม่สามารถโหลดรายการเพลย์ลิสต์ได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    try {
      const res = await api.post(`/playlists/${playlistId}/songs`, { song_id: song.id });
      if (res.success) {
        showToast(`เพิ่ม "${song.title}" ลงเพลย์ลิสต์เรียบร้อยแล้ว`, 'success');
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถเพิ่มเพลงลงเพลย์ลิสต์ได้', 'error');
    }
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const res = await api.post('/playlists', { name: newPlaylistName.trim() });
      if (res.success) {
        const newPl = res.playlist;
        await api.post(`/playlists/${newPl.id}/songs`, { song_id: song.id });
        showToast(`สร้างเพลย์ลิสต์ "${newPlaylistName}" และเพิ่มเพลงสำเร็จ`, 'success');
        setNewPlaylistName('');
        setShowCreateForm(false);
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถสร้างเพลย์ลิสต์ได้', 'error');
    }
  };

  if (!isOpen || !song) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-surface border border-dark-border w-full max-w-md rounded-2xl p-6 shadow-dialog space-y-4">
        <div className="flex items-center justify-between border-b border-dark-borderSubtle pb-3">
          <div className="flex items-center space-x-2">
            <ListMusic className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-bold text-white">เพิ่มลงในเพลย์ลิสต์</h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white p-1 rounded-full hover:bg-dark-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ข้อมูลเพลงที่กำลังจะเพิ่ม */}
        <div className="flex items-center space-x-3 bg-dark-card p-3 rounded-xl border border-dark-borderSubtle">
          <img
            src={song.cover_path || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
            alt={song.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{song.title}</p>
            <p className="text-xs text-text-sub truncate">{song.artist}</p>
          </div>
        </div>

        {/* รายการเพลย์ลิสต์ */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-xs text-text-muted text-center py-4">กำลังโหลดเพลย์ลิสต์...</p>
          ) : playlists.length === 0 ? (
            <div className="text-center py-6 text-text-muted">
              <p className="text-sm">คุณยังไม่มีเพลย์ลิสต์</p>
              <p className="text-xs mt-1">สร้างเพลย์ลิสต์แรกของคุณได้ทันทีด้านล่าง</p>
            </div>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-dark-card border border-transparent hover:border-dark-border transition-colors text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-black transition-colors">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">
                      {pl.name}
                    </p>
                    <p className="text-[11px] text-text-muted">{pl.song_count || 0} เพลง</p>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-text-sub group-hover:text-orange-400" />
              </button>
            ))
          )}
        </div>

        {/* ปุ่มสร้างเพลย์ลิสต์ใหม่ */}
        {showCreateForm ? (
          <form onSubmit={handleCreateAndAdd} className="space-y-3 pt-2 border-t border-dark-borderSubtle">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="ระบุชื่อเพลย์ลิสต์ใหม่..."
              className="w-full bg-dark-card text-white text-sm px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-sub hover:text-white"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-black bg-orange-500 hover:bg-orange-400"
              >
                สร้างและเพิ่มเพลง
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center justify-center space-x-2 py-2.5 border border-dashed border-dark-border hover:border-orange-500/60 rounded-xl text-xs font-semibold text-text-sub hover:text-orange-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างเพลย์ลิสต์ใหม่</span>
          </button>
        )}
      </div>
    </div>
  );
}
