import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Music, UploadCloud, Edit3, Trash2, Eye, Heart, ArrowLeft, X, Save,
  Clock, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { api, getFullMediaUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';

function StatusBadge({ status }) {
  if (status === 'approved') return (
    <span className="inline-flex items-center space-x-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
      <CheckCircle2 className="w-3 h-3" /><span>อนุมัติแล้ว</span>
    </span>
  );
  if (status === 'pending') return (
    <span className="inline-flex items-center space-x-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
      <Clock className="w-3 h-3" /><span>รออนุมัติ</span>
    </span>
  );
  if (status === 'rejected') return (
    <span className="inline-flex items-center space-x-1 bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
      <XCircle className="w-3 h-3" /><span>ไม่อนุมัติ</span>
    </span>
  );
  return null;
}

export default function MySongsPage() {
  const { user } = useAuth();
  const [songs, setSongs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSong, setEditingSong] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resubmitTarget, setResubmitTarget] = useState(null);
  const [expandedReason, setExpandedReason] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '', artist: '', category_id: '', description: '', lyrics: ''
  });
  const [editCoverFile, setEditCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadMySongs();
    loadCategories();
  }, [user]);

  const loadMySongs = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get(`/songs?uploader_id=${user.id}`);
      if (res.success) setSongs(res.songs);
    } catch (err) {
      showToast('ไม่สามารถโหลดรายการเพลงได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.success) setCategories(res.categories);
    } catch (err) {}
  };

  const handleOpenEdit = (song) => {
    setEditingSong(song);
    setEditFormData({
      title: song.title,
      artist: song.artist,
      category_id: song.category_id ? song.category_id.toString() : '',
      description: song.description || '',
      lyrics: song.lyrics || ''
    });
    setEditCoverFile(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSong) return;
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('title', editFormData.title.trim());
      formData.append('artist', editFormData.artist.trim());
      if (editFormData.category_id) formData.append('category_id', editFormData.category_id);
      formData.append('description', editFormData.description);
      formData.append('lyrics', editFormData.lyrics);
      if (editCoverFile) formData.append('cover', editCoverFile);

      const res = await api.put(`/songs/${editingSong.id}`, formData);
      if (res.success) {
        const wasApproved = editingSong.status === 'approved';
        showToast(
          wasApproved
            ? '✏️ แก้ไขข้อมูลสำเร็จ — เพลงถูกส่งให้ตรวจสอบใหม่อีกครั้ง'
            : 'แก้ไขข้อมูลเพลงสำเร็จเรียบร้อย',
          'success'
        );
        setEditingSong(null);
        loadMySongs();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถแก้ไขเพลงได้', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/songs/${deleteTarget.id}`);
      if (res.success) {
        showToast(`ลบเพลง "${deleteTarget.title}" สำเร็จเรียบร้อย`, 'success');
        setDeleteTarget(null);
        loadMySongs();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถลบเพลงได้', 'error');
    }
  };

  const handleResubmit = async () => {
    if (!resubmitTarget) return;
    try {
      setResubmitting(true);
      const res = await api.patch(`/songs/${resubmitTarget.id}/resubmit`);
      if (res.success) {
        showToast(`📤 ส่งเพลง "${resubmitTarget.title}" ให้ตรวจสอบใหม่เรียบร้อยแล้ว`, 'success');
        setResubmitTarget(null);
        loadMySongs();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถส่งตรวจได้', 'error');
    } finally {
      setResubmitting(false);
    }
  };

  const pendingCount = songs.filter(s => s.status === 'pending').length;
  const approvedCount = songs.filter(s => s.status === 'approved').length;
  const rejectedCount = songs.filter(s => s.status === 'rejected').length;

  return (
    <div className="space-y-6 pb-20">
      <Link to="/uploader/dashboard" className="inline-flex items-center space-x-1.5 text-xs text-text-sub hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>ย้อนกลับไปแดชบอร์ด</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
            <Music className="w-7 h-7 text-orange-500" />
            <span>จัดการเพลงของฉัน ({songs.length})</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            แก้ไขรายละเอียดหรือลบผลงานเพลงที่คุณเป็นผู้อัปโหลด
          </p>
        </div>
        <Link
          to="/uploader/upload"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider shadow-glow-orange-sm transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>อัปโหลดเพลงใหม่</span>
        </Link>
      </div>

      {/* Summary badges */}
      {songs.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /><span>อนุมัติแล้ว {approvedCount}</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-full text-xs font-bold text-amber-400">
            <Clock className="w-3.5 h-3.5" /><span>รออนุมัติ {pendingCount}</span>
          </span>
          {rejectedCount > 0 && (
            <span className="inline-flex items-center space-x-1.5 bg-red-500/10 border border-red-500/25 px-3 py-1.5 rounded-full text-xs font-bold text-red-400">
              <XCircle className="w-3.5 h-3.5" /><span>ไม่อนุมัติ {rejectedCount}</span>
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-text-muted text-sm">กำลังโหลดรายการเพลงของคุณ...</div>
      ) : songs.length === 0 ? (
        <div className="text-center py-16 bg-dark-surface rounded-3xl border border-dark-border p-8 space-y-3">
          <Music className="w-12 h-12 text-text-muted mx-auto" />
          <h3 className="text-base font-bold text-white">คุณยังไม่มีเพลงที่อัปโหลด</h3>
          <p className="text-xs text-text-sub max-w-sm mx-auto">เริ่มต้นอัปโหลดเพลงแรกของคุณและแสดงความสามารถให้ทุกคนได้ฟัง</p>
        </div>
      ) : (
        <div className="bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
          <div className="divide-y divide-dark-borderSubtle">
            {songs.map((song) => (
              <div key={song.id}>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-dark-card transition-colors">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <img
                      src={song.cover_path ? getFullMediaUrl(song.cover_path) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80'}
                      alt={song.title}
                      className="w-12 h-12 rounded-xl object-cover bg-dark-elevated flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      {song.status === 'approved' ? (
                        <Link to={`/songs/${song.id}`} className="text-sm font-bold text-white hover:text-orange-400 transition-colors truncate block">
                          {song.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-bold text-white truncate">{song.title}</p>
                      )}
                      <p className="text-xs text-text-sub truncate">{song.artist}</p>
                      <div className="flex items-center flex-wrap gap-2 mt-1.5">
                        <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full">
                          {song.category_name || 'ทั่วไป'}
                        </span>
                        <StatusBadge status={song.status} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-0 border-dark-borderSubtle">
                    <div className="flex items-center space-x-3 text-xs text-text-muted">
                      <span className="flex items-center space-x-1">
                        <Eye className="w-3.5 h-3.5 text-text-sub" />
                        <span>{song.play_count || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Heart className="w-3.5 h-3.5 text-orange-500" />
                        <span>{song.like_count || 0}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* ปุ่มส่งตรวจใหม่ (สำหรับเพลง rejected เท่านั้น) */}
                      {song.status === 'rejected' && (
                        <button
                          onClick={() => setResubmitTarget(song)}
                          className="px-3 py-1.5 rounded-lg bg-amber-900/30 hover:bg-amber-900/60 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1 transition-colors"
                          title="ส่งตรวจอีกครั้ง"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">ส่งตรวจใหม่</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(song)}
                        className="px-3 py-1.5 rounded-lg bg-dark-elevated hover:bg-dark-border text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(song)}
                        className="px-3 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rejection reason expandable */}
                {song.status === 'rejected' && song.reject_reason && (
                  <div className="px-4 pb-3">
                    <button
                      onClick={() => setExpandedReason(expandedReason === song.id ? null : song.id)}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center space-x-1 transition-colors"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>ดูเหตุผลที่ไม่อนุมัติ</span>
                      {expandedReason === song.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {expandedReason === song.id && (
                      <div className="mt-2 bg-red-950/20 border border-red-500/25 rounded-xl px-4 py-3">
                        <p className="text-xs font-bold text-red-400 mb-1">เหตุผลจากผู้ดูแลระบบ:</p>
                        <p className="text-xs text-red-300 leading-relaxed">{song.reject_reason}</p>
                        <p className="text-[10px] text-red-400/60 mt-2">
                          แก้ไขเพลงให้ถูกต้องแล้วกดปุ่ม "ส่งตรวจใหม่" เพื่อส่งขออนุมัติอีกครั้ง
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal แก้ไขเพลง */}
      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-surface border border-dark-border w-full max-w-lg rounded-2xl p-6 shadow-dialog space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-dark-borderSubtle pb-3">
              <div>
                <h3 className="text-base font-bold text-white">แก้ไขข้อมูลเพลง: {editingSong.title}</h3>
                {editingSong.status === 'approved' && (
                  <p className="text-[11px] text-amber-400 mt-0.5">⚠️ การแก้ไขจะรีเซตสถานะเป็น "รออนุมัติ" โดยอัตโนมัติ</p>
                )}
              </div>
              <button onClick={() => setEditingSong(null)} className="text-text-muted hover:text-white p-1 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">ชื่อบทเพลง</label>
                <input type="text" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} required
                  className="w-full bg-dark-card text-white text-sm px-4 py-2 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">ชื่อศิลปิน</label>
                <input type="text" value={editFormData.artist} onChange={(e) => setEditFormData({ ...editFormData, artist: e.target.value })} required
                  className="w-full bg-dark-card text-white text-sm px-4 py-2 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">หมวดหมู่บทเพลง</label>
                <select value={editFormData.category_id} onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })}
                  className="w-full bg-dark-card text-white text-sm px-4 py-2 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none">
                  <option value="">ไม่ระบุ</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">เปลี่ยนรูปภาพหน้าปก (.jpg, .png ไม่เกิน 2MB)</label>
                <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={(e) => setEditCoverFile(e.target.files[0])}
                  className="w-full text-xs text-text-sub file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-dark-card file:text-orange-400 file:font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">คำอธิบาย</label>
                <input type="text" value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full bg-dark-card text-white text-sm px-4 py-2 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">เนื้อเพลง (Lyrics)</label>
                <textarea rows={4} value={editFormData.lyrics} onChange={(e) => setEditFormData({ ...editFormData, lyrics: e.target.value })}
                  className="w-full bg-dark-card text-white text-sm px-4 py-2 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none font-sans" />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-dark-borderSubtle">
                <button type="button" onClick={() => setEditingSong(null)} className="px-4 py-2 text-xs font-semibold text-text-sub hover:text-white">ยกเลิก</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-xs font-bold text-black bg-orange-500 hover:bg-orange-400 rounded-full flex items-center space-x-1 disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ส่งตรวจใหม่ */}
      {resubmitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border w-full max-w-sm rounded-2xl p-6 shadow-dialog space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-900/30 border border-amber-500/30 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ส่งตรวจอีกครั้ง</h3>
                <p className="text-xs text-text-sub mt-0.5">สถานะจะกลับเป็น "รออนุมัติ"</p>
              </div>
            </div>
            <div className="bg-dark-card rounded-xl p-3 border border-dark-border">
              <p className="text-sm font-bold text-white">{resubmitTarget.title}</p>
              <p className="text-xs text-text-sub">{resubmitTarget.artist}</p>
            </div>
            <div className="flex items-center justify-end space-x-2">
              <button onClick={() => setResubmitTarget(null)} className="px-4 py-2 text-xs font-semibold text-text-sub hover:text-white">ยกเลิก</button>
              <button onClick={handleResubmit} disabled={resubmitting}
                className="px-5 py-2 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 rounded-full disabled:opacity-50 transition-all">
                {resubmitting ? 'กำลังส่ง...' : '📤 ยืนยันส่งตรวจใหม่'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="ยืนยันการลบเพลง"
        message={`คุณต้องการลบเพลง "${deleteTarget?.title}" ออกจากระบบใช่หรือไม่? ไฟล์เสียงและสถิติทั้งหมดของเพลงนี้จะถูกลบอย่างถาวร`}
        confirmText="ยืนยันการลบเพลง"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDangerous={true}
      />
    </div>
  );
}
