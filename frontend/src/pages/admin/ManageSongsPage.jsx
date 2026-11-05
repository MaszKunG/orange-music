import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, Play, Pause, Trash2, Search, Eye, Heart, ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { api, getFullMediaUrl } from '../../services/api';
import { usePlayer } from '../../context/PlayerContext';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';

const STATUS_TABS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: '🟡 รออนุมัติ' },
  { key: 'approved', label: '✅ อนุมัติแล้ว' },
  { key: 'rejected', label: '❌ ไม่อนุมัติ' },
];

export default function ManageSongsPage() {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveTarget, setApproveTarget] = useState(null);
  const { playSong, currentSong, isPlaying } = usePlayer();
  const { showToast } = useToast();

  useEffect(() => { loadSongs(); }, [search, statusFilter]);

  const loadSongs = async () => {
    try {
      setLoading(true);
      let url = '/admin/songs';
      const params = [];
      if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (params.length > 0) url += '?' + params.join('&');
      const res = await api.get(url);
      if (res.success) setSongs(res.songs);
    } catch (err) {
      showToast('ไม่สามารถดึงข้อมูลเพลงได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSong = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/admin/songs/${deleteTarget.id}`);
      if (res.success) {
        showToast(`ลบเพลง "${deleteTarget.title}" ออกจากระบบเรียบร้อยแล้ว`, 'success');
        setDeleteTarget(null);
        loadSongs();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถลบเพลงได้', 'error');
    }
  };

  const handleApproveSong = async () => {
    if (!approveTarget) return;
    try {
      const res = await api.patch(`/admin/songs/${approveTarget.id}/approve`);
      if (res.success) {
        showToast(`✅ อนุมัติเพลง "${approveTarget.title}" เรียบร้อยแล้ว`, 'success');
        setApproveTarget(null);
        loadSongs();
      }
    } catch (err) {
      showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleRejectSong = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) { showToast('กรุณาระบุเหตุผล', 'error'); return; }
    try {
      const res = await api.patch(`/admin/songs/${rejectModal.id}/reject`, { reason: rejectReason.trim() });
      if (res.success) {
        showToast(`❌ ไม่อนุมัติเพลง "${rejectModal.title}" พร้อมแจ้งเหตุผลแล้ว`, 'success');
        setRejectModal(null); setRejectReason('');
        loadSongs();
      }
    } catch (err) {
      showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const StatusBadge = ({ status }) => {
    if (status === 'approved') return (
      <span className="inline-flex items-center space-x-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /><span>อนุมัติแล้ว</span>
      </span>
    );
    if (status === 'pending') return (
      <span className="inline-flex items-center space-x-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" /><span>รออนุมัติ</span>
      </span>
    );
    if (status === 'rejected') return (
      <span className="inline-flex items-center space-x-1 bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /><span>ไม่อนุมัติ</span>
      </span>
    );
    return null;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
            <ShieldAlert className="w-7 h-7 text-red-400" />
            <span>ตรวจสอบและจัดการบทเพลง ({songs.length})</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            รับฟังและตรวจสอบความเหมาะสมของบทเพลง พร้อมสิทธิ์อนุมัติ ปฏิเสธ และลบเพลงที่ไม่เหมาะสม
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-dark-surface p-4 rounded-2xl border border-dark-border space-y-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                statusFilter === tab.key
                  ? 'bg-orange-500 text-black shadow-glow-orange-sm'
                  : 'bg-dark-card text-text-sub hover:text-white border border-dark-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อเพลง, ศิลปิน, ผู้อัปโหลด..."
            className="w-full bg-dark-card text-white text-xs pl-9 pr-4 py-2 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-text-muted text-sm">กำลังโหลดรายการเพลง...</div>
        ) : songs.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">ไม่พบบทเพลงในระบบ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-dark-card border-b border-dark-borderSubtle text-text-muted uppercase text-[10px] tracking-wider">
                  <th className="p-4">เพลง</th>
                  <th className="p-4">สถานะ</th>
                  <th className="p-4">หมวดหมู่</th>
                  <th className="p-4">ผู้อัปโหลด</th>
                  <th className="p-4">ยอดฟัง / ถูกใจ</th>
                  <th className="p-4">วันที่ลง</th>
                  <th className="p-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-borderSubtle">
                {songs.map((song) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isThisPlaying = isCurrent && isPlaying;

                  return (
                    <tr key={song.id} className={`hover:bg-dark-card/50 transition-colors ${isCurrent ? 'bg-orange-500/10' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => playSong(song, songs)}
                            className="w-10 h-10 rounded-lg overflow-hidden bg-dark-card flex-shrink-0 relative group"
                            title="กดเพื่อฟังตรวจสอบ"
                          >
                            <img
                              src={song.cover_path ? getFullMediaUrl(song.cover_path) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80'}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {isThisPlaying ? <Pause className="w-4 h-4 fill-white text-white" /> : <Play className="w-4 h-4 fill-white text-white" />}
                            </div>
                          </button>
                          <div>
                            <Link to={`/songs/${song.id}`} className="font-bold text-white text-sm hover:text-orange-400 block truncate max-w-[180px]">{song.title}</Link>
                            <p className="text-[11px] text-text-sub truncate max-w-[180px]">{song.artist}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4"><StatusBadge status={song.status} /></td>

                      <td className="p-4">
                        <span className="bg-dark-card border border-dark-border px-2 py-0.5 rounded-full text-[10px] font-semibold text-orange-400">
                          {song.category_name || 'ทั่วไป'}
                        </span>
                      </td>

                      <td className="p-4 text-text-sub">{song.uploader_name || 'ศิลปินอิสระ'}</td>

                      <td className="p-4 text-text-muted">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center space-x-1"><Eye className="w-3.5 h-3.5" /><span>{song.play_count || 0}</span></span>
                          <span className="flex items-center space-x-1 text-orange-500"><Heart className="w-3.5 h-3.5 fill-current" /><span>{song.like_count || 0}</span></span>
                        </div>
                      </td>

                      <td className="p-4 text-text-muted">{new Date(song.created_at).toLocaleDateString('th-TH')}</td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5 flex-wrap gap-y-1">
                          {song.status === 'pending' && (
                            <button
                              onClick={() => setApproveTarget(song)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /><span>อนุมัติ</span>
                            </button>
                          )}
                          {(song.status === 'pending' || song.status === 'approved') && (
                            <button
                              onClick={() => { setRejectModal(song); setRejectReason(''); }}
                              className="px-2.5 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-500/30 text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /><span>ปฏิเสธ</span>
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(song)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-500/30 text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /><span>ลบ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal อนุมัติ */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border w-full max-w-sm rounded-2xl p-6 shadow-dialog space-y-4">
            <h3 className="text-base font-bold text-white">ยืนยันการอนุมัติเพลง</h3>
            <p className="text-xs text-text-sub">เพลง <span className="text-white font-bold">"{approveTarget.title}"</span> จะถูกเผยแพร่สู่สาธารณะทันที</p>
            <div className="flex items-center justify-end space-x-2">
              <button onClick={() => setApproveTarget(null)} className="px-4 py-2 text-xs font-semibold text-text-sub hover:text-white">ยกเลิก</button>
              <button onClick={handleApproveSong} className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-full transition-all">✅ ยืนยันอนุมัติ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ปฏิเสธ */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border w-full max-w-md rounded-2xl p-6 shadow-dialog space-y-4">
            <h3 className="text-base font-bold text-white">ไม่อนุมัติเพลง: "{rejectModal.title}"</h3>
            <div>
              <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">เหตุผลที่ไม่อนุมัติ <span className="text-red-400">*</span></label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="เช่น เนื้อหาไม่เหมาะสม, คุณภาพเสียงต่ำ..."
                className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-red-500 focus:outline-none resize-none"
              />
            </div>
            <div className="flex items-center justify-end space-x-2">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="px-4 py-2 text-xs font-semibold text-text-sub hover:text-white">ยกเลิก</button>
              <button onClick={handleRejectSong} disabled={!rejectReason.trim()} className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-full transition-all disabled:opacity-40">❌ ยืนยันไม่อนุมัติ</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="ยืนยันการลบเพลงโดยผู้ดูแลระบบ"
        message={`คุณต้องการลบเพลง "${deleteTarget?.title}" ออกจากระบบถาวรใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ยืนยันลบเพลง"
        onConfirm={handleDeleteSong}
        onCancel={() => setDeleteTarget(null)}
        isDangerous={true}
      />
    </div>
  );
}
