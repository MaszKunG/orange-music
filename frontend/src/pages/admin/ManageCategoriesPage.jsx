import React, { useState, useEffect } from 'react';
import { Tags, Plus, Edit3, Trash2, X, Save } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      if (res.success) {
        setCategories(res.categories);
      }
    } catch (err) {
      showToast('ไม่สามารถดึงข้อมูลหมวดหมู่ได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    try {
      const res = await api.post('/categories', createForm);
      if (res.success) {
        showToast('เพิ่มหมวดหมู่สำเร็จ', 'success');
        setShowCreateModal(false);
        setCreateForm({ name: '', description: '' });
        loadCategories();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถเพิ่มหมวดหมู่ได้', 'error');
    }
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setEditForm({ name: cat.name, description: cat.description || '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editingCategory) return;

    try {
      const res = await api.put(`/categories/${editingCategory.id}`, editForm);
      if (res.success) {
        showToast('แก้ไขหมวดหมู่สำเร็จ', 'success');
        setEditingCategory(null);
        loadCategories();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถแก้ไขได้', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/categories/${deleteTarget.id}`);
      if (res.success) {
        showToast('ลบหมวดหมู่สำเร็จ', 'success');
        setDeleteTarget(null);
        loadCategories();
      }
    } catch (err) {
      showToast('ไม่สามารถลบหมวดหมู่ได้', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
            <Tags className="w-7 h-7 text-orange-500" />
            <span>จัดการหมวดหมู่เพลง ({categories.length})</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            เพิ่ม ลบ แก้ไขหมวดหมู่เพลงสำหรับจัดหมวดหมู่อารมณ์และแนวเพลงในระบบ
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider shadow-glow-orange-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มหมวดหมู่ใหม่</span>
        </button>
      </div>

      <div className="bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-text-muted text-sm">กำลังโหลดหมวดหมู่...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">ยังไม่มีหมวดหมู่</div>
        ) : (
          <div className="divide-y divide-dark-borderSubtle">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-dark-card transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🍊</span>
                    <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                    <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                      {cat.song_count || 0} เพลง
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-text-sub pl-6">{cat.description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="px-3 py-1.5 rounded-lg bg-dark-elevated hover:bg-dark-border text-white text-xs font-semibold inline-flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="px-3 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/30 text-xs font-semibold inline-flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal สร้างหมวดหมู่ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-surface border border-dark-border w-full max-w-md rounded-2xl p-6 shadow-dialog space-y-4">
            <div className="flex items-center justify-between border-b border-dark-borderSubtle pb-3">
              <h3 className="text-base font-bold text-white">เพิ่มหมวดหมู่เพลงใหม่</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">
                  ชื่อหมวดหมู่
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="เช่น ป๊อปไทยฟังสบาย (Pop Thai)"
                  required
                  autoFocus
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="คำอธิบายสั้นๆ เกี่ยวกับบรรยากาศหรือแนวเพลงในหมวดนี้..."
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-dark-borderSubtle">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-text-sub hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-black bg-orange-500 hover:bg-orange-400 rounded-full"
                >
                  สร้างหมวดหมู่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แก้ไขหมวดหมู่ */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-surface border border-dark-border w-full max-w-md rounded-2xl p-6 shadow-dialog space-y-4">
            <div className="flex items-center justify-between border-b border-dark-borderSubtle pb-3">
              <h3 className="text-base font-bold text-white">แก้ไขหมวดหมู่: {editingCategory.name}</h3>
              <button onClick={() => setEditingCategory(null)} className="text-text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">
                  ชื่อหมวดหมู่
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  autoFocus
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-dark-borderSubtle">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs text-text-sub hover:text-white"
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
        title="ยืนยันการลบหมวดหมู่"
        message={`คุณต้องการลบหมวดหมู่ "${deleteTarget?.name}" ใช่หรือไม่? เพลงในหมวดนี้จะไม่ถูกลบ แต่จะถูกเปลี่ยนเป็นไม่มีหมวดหมู่`}
        confirmText="ยืนยันการลบ"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDangerous={true}
      />
    </div>
  );
}
