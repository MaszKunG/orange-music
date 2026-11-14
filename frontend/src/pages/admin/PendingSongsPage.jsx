import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, CheckCircle2, XCircle, Play, Pause, Image as ImageIcon,
  ShieldAlert, ChevronDown, ChevronUp, RefreshCw, CheckSquare, Square
} from 'lucide-react';
import { api, getFullMediaUrl } from '../../services/api';
import { usePlayer } from '../../context/PlayerContext';
import { useToast } from '../../context/ToastContext';

export default function PendingSongsPage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [expandedLyrics, setExpandedLyrics] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { song }
  const [rejectReason, setRejectReason] = useState('');
  const [approveModal, setApproveModal] = useState(null); // { song } or 'bulk'
  const [bulkLoading, setBulkLoading] = useState(false);
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const { showToast } = useToast();

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/songs?status=pending');
      if (res.success) {
        setSongs(res.songs || []);
        setSelected(new Set());
      }
    } catch (err) {
      showToast('ไม่สามารถโหลดรายการเพลงรออนุมัติได้', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  /* ---- selection ---- */
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selected.size === songs.length) setSelected(new Set());
    else setSelected(new Set(songs.map(s => s.id)));
  };

  /* ---- approve single ---- */
  const handleApproveSingle = async (song) => {
    try {
      const res = await api.patch(`/admin/songs/${song.id}/approve`);
      if (res.success) {
        showToast(`✅ อนุมัติเพลง "${song.title}" เรียบร้อยแล้ว`, 'success');
        setApproveModal(null);
        loadPending();
      }
    } catch (err) {
      showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  /* ---- bulk approve ---- */
  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    try {
      setBulkLoading(true);
      const songList = [...selected];
      const res = await api.post('/admin/songs/bulk-approve', { 
        song_ids: songList, 
        songIds: songList 
      });
      if (res.success) {
        showToast(`✅ อนุมัติ ${songList.length} เพลงพร้อมกันเรียบร้อยแล้ว`, 'success');
        setSelected(new Set());
        setApproveModal(null);
        loadPending();
      }
    } catch (err) {
      showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  /* ---- reject ---- */
  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      showToast('กรุณาระบุเหตุผลที่ไม่อนุมัติ', 'error');
      return;
    }
    try {
      const res = await api.patch(`/admin/songs/${rejectModal.id}/reject`, { reason: rejectReason.trim() });
      if (res.success) {
        showToast(`❌ ไม่อนุมัติเพลง "${rejectModal.title}" พร้อมแจ้งเหตุผลแล้ว`, 'success');
        setRejectModal(null);
        setRejectReason('');
        loadPending();
      }
    } catch (err) {
      showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const handlePlaySong = (song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song, songs);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-400 bg-amber-950/30 px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>เพลงรออนุมัติ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            คิวรออนุมัติเพลง
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            ตรวจสอบ ฟังตัวอย่าง และอนุมัติหรือปฏิเสธเพลงก่อนเผยแพร่สู่สาธารณะ
          </p>
        </div>
        <button
          onClick={loadPending}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-dark-card hover:bg-dark-elevated border border-dark-border text-xs font-bold text-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเฟรช</span>
        </button>
      </div>

      {/* Bulk Action Bar */}
      {songs.length > 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center space-x-2 text-xs font-semibold text-text-sub hover:text-white transition-colors"
          >
            {selected.size === songs.length && songs.length > 0
              ? <CheckSquare className="w-4 h-4 text-orange-500" />
              : <Square className="w-4 h-4" />
            }
            <span>เลือกทั้งหมด ({songs.length})</span>
          </button>

          {selected.size > 0 && (
            <>
              <span className="text-dark-border">|</span>
              <span className="text-xs text-amber-400 font-bold">เลือกแล้ว {selected.size} เพลง</span>
              <button
                onClick={() => setApproveModal('bulk')}
                className="ml-auto inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>อนุมัติ {selected.size} เพลงพร้อมกัน</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-text-muted text-sm">กำลังโหลดรายการเพลงรออนุมัติ...</div>
        ) : songs.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-white font-bold">ไม่มีเพลงรออนุมัติ</p>
            <p className="text-xs text-text-sub">ทุกเพลงได้รับการตรวจสอบเรียบร้อยแล้ว 🎉</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-dark-card border-b border-dark-borderSubtle text-text-muted uppercase text-[10px] tracking-wider">
                  <th className="p-4 w-8"></th>
                  <th className="p-4">เพลง / ศิลปิน</th>
                  <th className="p-4">ผู้อัปโหลด</th>
                  <th className="p-4">หมวดหมู่</th>
                  <th className="p-4">วันที่ส่ง</th>
                  <th className="p-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-borderSubtle">
                {songs.map((song) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isThisPlaying = isCurrent && isPlaying;
                  const isChecked = selected.has(song.id);

                  return (
                    <React.Fragment key={song.id}>
                      <tr className={`transition-colors hover:bg-dark-card/50 ${isCurrent ? 'bg-amber-500/5' : ''} ${isChecked ? 'bg-orange-500/5' : ''}`}>
                        {/* Checkbox */}
                        <td className="p-4">
                          <button onClick={() => toggleSelect(song.id)}>
                            {isChecked
                              ? <CheckSquare className="w-4 h-4 text-orange-500" />
                              : <Square className="w-4 h-4 text-text-muted hover:text-white" />
                            }
                          </button>
                        </td>

                        {/* Song Info + Preview */}
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {/* Cover + Play */}
                            <button
                              onClick={() => handlePlaySong(song)}
                              className="w-11 h-11 rounded-xl overflow-hidden bg-dark-card flex-shrink-0 relative group"
                              title="ฟังตัวอย่างเพลง"
                            >
                              {song.cover_path ? (
                                <img
                                  src={getFullMediaUrl(song.cover_path)}
                                  alt={song.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-amber-950/30">
                                  <ImageIcon className="w-5 h-5 text-amber-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {isThisPlaying
                                  ? <Pause className="w-4 h-4 fill-white text-white" />
                                  : <Play className="w-4 h-4 fill-white text-white" />
                                }
                              </div>
                            </button>

                            <div className="min-w-0">
                              <p className="font-bold text-white text-sm truncate max-w-[180px]">{song.title}</p>
                              <p className="text-[11px] text-text-sub truncate max-w-[180px]">{song.artist}</p>
                              {/* Lyrics toggle */}
                              {song.lyrics && (
                                <button
                                  onClick={() => setExpandedLyrics(expandedLyrics === song.id ? null : song.id)}
                                  className="text-[10px] text-amber-400 hover:underline flex items-center space-x-0.5 mt-0.5"
                                >
                                  <span>เนื้อเพลง</span>
                                  {expandedLyrics === song.id
                                    ? <ChevronUp className="w-3 h-3" />
                                    : <ChevronDown className="w-3 h-3" />
                                  }
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-text-sub">{song.uploader_name || '-'}</td>

                        <td className="p-4">
                          <span className="bg-dark-card border border-dark-border px-2 py-0.5 rounded-full text-[10px] font-semibold text-orange-400">
                            {song.category_name || 'ทั่วไป'}
                          </span>
                        </td>

                        <td className="p-4 text-text-muted whitespace-nowrap">
                          {new Date(song.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setApproveModal(song)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-900/70 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>อนุมัติ</span>
                            </button>
                            <button
                              onClick={() => { setRejectModal(song); setRejectReason(''); }}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-500/30 text-xs font-bold transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ปฏิเสธ</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Lyrics expanded row */}
                      {expandedLyrics === song.id && song.lyrics && (
                        <tr className="bg-amber-950/10">
                          <td colSpan={6} className="px-6 pb-4 pt-2">
                            <div className="bg-dark-card rounded-xl p-4 border border-amber-500/20">
                              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">เนื้อเพลง</p>
                              <pre className="text-xs text-text-sub whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                                {song.lyrics}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Modal อนุมัติ (single) ===== */}
      {approveModal && approveModal !== 'bulk' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border w-full max-w-sm rounded-2xl p-6 shadow-dialog space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ยืนยันการอนุมัติเพลง</h3>
                <p className="text-xs text-text-sub mt-0.5">เพลงจะถูกเผยแพร่สู่สาธารณะทันที</p>
              </div>
            </div>
            <div className="bg-dark-card rounded-xl p-3 border border-dark-border">
              <p className="text-sm font-bold text-white">{approveModal.title}</p>
              <p className="text-xs text-text-sub">{approveModal.artist} • {approveModal.uploader_name}</p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setApproveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-text-sub hover:text-white transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleApproveSingle(approveModal)}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-full transition-all"
              >
                ✅ ยืนยันอนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal อนุมัติ bulk ===== */}
      {approveModal === 'bulk' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border w-full max-w-sm rounded-2xl p-6 shadow-dialog space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ยืนยันอนุมัติหลายเพลง</h3>
                <p className="text-xs text-text-sub mt-0.5">จะอนุมัติ {selected.size} เพลงพร้อมกัน</p>
              </div>
            </div>
            <p className="text-xs text-text-sub bg-dark-card rounded-xl p-3 border border-dark-border">
              เพลงที่เลือกทั้ง {selected.size} รายการจะถูกอนุมัติและเผยแพร่สู่สาธารณะพร้อมกันทันที
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setApproveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-text-sub hover:text-white transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleBulkApprove}
                disabled={bulkLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-full transition-all disabled:opacity-50"
              >
                {bulkLoading ? 'กำลังอนุมัติ...' : `✅ อนุมัติ ${selected.size} เพลง`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal ปฏิเสธ ===== */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border w-full max-w-md rounded-2xl p-6 shadow-dialog space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ไม่อนุมัติเพลง</h3>
                <p className="text-xs text-text-sub mt-0.5">กรุณาระบุเหตุผลเพื่อแจ้งผู้อัปโหลด</p>
              </div>
            </div>

            <div className="bg-dark-card rounded-xl p-3 border border-dark-border">
              <p className="text-sm font-bold text-white">{rejectModal.title}</p>
              <p className="text-xs text-text-sub">{rejectModal.artist} • {rejectModal.uploader_name}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-sub uppercase mb-1.5">
                เหตุผลที่ไม่อนุมัติ <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="เช่น เนื้อหาไม่เหมาะสม, คุณภาพเสียงต่ำเกินไป, ไฟล์เสียหาย..."
                className="w-full bg-dark-card text-white text-sm px-4 py-2.5 rounded-xl border border-dark-border focus:border-red-500 focus:outline-none resize-none"
              />
              <p className="text-[10px] text-text-muted mt-1">ผู้อัปโหลดจะได้รับการแจ้งเตือนพร้อมเหตุผลนี้</p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-dark-borderSubtle">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 text-xs font-semibold text-text-sub hover:text-white transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ❌ ยืนยันไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
