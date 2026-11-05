import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ListMusic, Plus, Play, Trash2, Edit3, Music } from 'lucide-react';
import { api, getFullMediaUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';

export default function MyPlaylistsPage() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const res = await api.get('/playlists');
      if (res.success) {
        setPlaylists(res.playlists);
      }
    } catch (err) {
      showToast('ไม่สามารถโหลดเพลย์ลิสต์ได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const res = await api.post('/playlists', { name: newPlaylistName.trim() });
      if (res.success) {
        showToast('สร้างเพลย์ลิสต์ใหม่สำเร็จ', 'success');
        setNewPlaylistName('');
        setShowCreateModal(false);
        loadPlaylists();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถสร้างเพลย์ลิสต์ได้', 'error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editingPlaylist) return;

    try {
      const res = await api.put(`/playlists/${editingPlaylist.id}`, { name: editName.trim() });
      if (res.success) {
        showToast('แก้ไขชื่อเพลย์ลิสต์สำเร็จ', 'success');
        setEditingPlaylist(null);
        loadPlaylists();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถแก้ไขได้', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/playlists/${deleteTarget.id}`);
      if (res.success) {
        showToast(`ลบเพลย์ลิสต์ "${deleteTarget.name}" เรียบร้อยแล้ว`, 'success');
        setDeleteTarget(null);
        loadPlaylists();
      }
    } catch (err) {
      showToast('ไม่สามารถลบเพลย์ลิสต์ได้', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
            <ListMusic className="w-7 h-7 text-orange-500" />
            <span>เพลย์ลิสต์ของฉัน (My Playlists)</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            จัดรวมเพลงโปรดและเพลงสำหรับการอ่านหนังสือสอบของคุณ
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider shadow-glow-orange-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างเพลย์ลิสต์ใหม่</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-muted text-sm">กำลังโหลดเพลย์ลิสต์...</div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-16 bg-dark-surface rounded-3xl border border-dark-border p-8 space-y-3">
          <ListMusic className="w-12 h-12 text-text-muted mx-auto" />
          <h3 className="text-base font-bold text-white">คุณยังไม่มีเพลย์ลิสต์</h3>
          <p className="text-xs text-text-sub max-w-sm mx-auto">
            สร้างเพลย์ลิสต์เพื่อรวบรวมเพลงที่คุณชอบสำหรับการอ่านหนังสือ ฟังเพลินระหว่างเดินทาง หรือผ่อนคลาย
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-2 inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-orange-500 text-black font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างเพลย์ลิสต์แรก</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="group relative bg-dark-surface hover:bg-dark-card p-4 rounded-2xl border border-dark-borderSubtle hover:border-dark-border transition-all flex flex-col justify-between shadow-card"
            >
              <Link to={`/my-playlists/${pl.id}`} className="block">
                <div className="relative aspect-square rounded-xl bg-dark-card flex items-center justify-center overflow-hidden mb-3 border border-dark-borderSubtle">
                  {pl.cover_path ? (
                    <img
                      src={getFullMediaUrl(pl.cover_path)}
                      alt={pl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-orange-500/40 text-4xl">🍊</div>
                  )}

                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-black flex items-center justify-center shadow-glow-orange">
                      <Play className="w-5 h-5 fill-black translate-x-0.5" />
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-orange-400 truncate">
                  {pl.name}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">{pl.song_count || 0} เพลง</p>
              </Link>

              <div className="flex items-center justify-end space-x-1 pt-2 mt-2 border-t border-dark-borderSubtle">
                <button
                  onClick={() => {
                    setEditingPlaylist(pl);
                    setEditName(pl.name);
                  }}
                  className="p-1.5 text-text-muted hover:text-white rounded-lg hover:bg-dark-elevated transition-colors"
                  title="เปลี่ยนชื่อ"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(pl)}
                  className="p-1.5 text-text-muted hover:text-red-400 rounded-lg hover:bg-dark-elevated transition-colors"
                  title="ลบเพลย์ลิสต์"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal สร้างเพลย์ลิสต์ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-surface border border-dark-border w-full max-w-sm rounded-2xl p-6 shadow-dialog space-y-4">
            <h3 className="text-base font-bold text-white">สร้างเพลย์ลิสต์ใหม่</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="ชื่อเพลย์ลิสต์ เช่น เพลงอ่านหนังสือสอบ"
                required
                autoFocus
                className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
              />
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-text-sub hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-black bg-orange-500 hover:bg-orange-400 rounded-full"
                >
                  สร้างเพลย์ลิสต์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แก้ไขชื่อเพลย์ลิสต์ */}
      {editingPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-surface border border-dark-border w-full max-w-sm rounded-2xl p-6 shadow-dialog space-y-4">
            <h3 className="text-base font-bold text-white">แก้ไขชื่อเพลย์ลิสต์</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                autoFocus
                className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
              />
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingPlaylist(null)}
                  className="px-4 py-2 text-xs font-semibold text-text-sub hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-black bg-orange-500 hover:bg-orange-400 rounded-full"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ยืนยันการลบ */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="ยืนยันการลบเพลย์ลิสต์"
        message={`คุณต้องการลบเพลย์ลิสต์ "${deleteTarget?.name}" ใช่หรือไม่? เพลงทั้งหมดในเพลย์ลิสต์นี้จะถูกนำออก`}
        confirmText="ยืนยันการลบ"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDangerous={true}
      />
    </div>
  );
}
