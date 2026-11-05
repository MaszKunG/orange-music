import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit3, Trash2, ShieldAlert, CheckCircle2, X, Save } from 'lucide-react';
import { api, getFullMediaUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function ManageUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'user'
  });

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role: 'user',
    password: ''
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (roleFilter) params.append('role', roleFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err) {
      showToast('ไม่สามารถดึงข้อมูลผู้ใช้งานได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/users', createForm);
      if (res.success) {
        showToast('เพิ่มผู้ใช้งานสำเร็จ', 'success');
        setShowCreateModal(false);
        setCreateForm({ username: '', full_name: '', email: '', password: '', role: 'user' });
        loadUsers();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถสร้างผู้ใช้ได้', 'error');
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      password: ''
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const payload = {
        full_name: editForm.full_name,
        email: editForm.email,
        role: editForm.role
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }

      const res = await api.put(`/admin/users/${editingUser.id}`, payload);
      if (res.success) {
        showToast('แก้ไขข้อมูลผู้ใช้สำเร็จ', 'success');
        setEditingUser(null);
        loadUsers();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถแก้ไขได้', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/admin/users/${deleteTarget.id}`);
      if (res.success) {
        showToast(res.message, 'success');
        setDeleteTarget(null);
        loadUsers();
      }
    } catch (err) {
      showToast(err.message || 'ไม่สามารถลบผู้ใช้งานได้', 'error');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">แอดมิน (Admin)</span>;
      case 'uploader':
        return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">ผู้อัปโหลด (Uploader)</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">ผู้ใช้ทั่วไป (User)</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
            <Users className="w-7 h-7 text-orange-500" />
            <span>จัดการผู้ใช้งานทั้งหมด ({users.length})</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            เพิ่ม ลบ แก้ไขข้อมูล และกำหนดสิทธิ์บทบาทของผู้ใช้งานในระบบ
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider shadow-glow-orange-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มผู้ใช้งานใหม่</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-dark-surface p-4 rounded-2xl border border-dark-border">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, อีเมล, ชื่อผู้ใช้..."
            className="w-full bg-dark-card text-white text-xs pl-9 pr-4 py-2 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-text-muted whitespace-nowrap">กรองบทบาท:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-dark-card text-white text-xs px-3 py-2 rounded-xl border border-dark-border focus:outline-none focus:border-orange-500 w-full sm:w-auto"
          >
            <option value="">ทุกบทบาท</option>
            <option value="user">ผู้ใช้ทั่วไป (User)</option>
            <option value="uploader">ผู้อัปโหลดเพลง (Uploader)</option>
            <option value="admin">ผู้ดูแลระบบ (Admin)</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-text-muted text-sm">กำลังโหลดข้อมูลผู้ใช้...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">ไม่พบข้อมูลผู้ใช้งาน</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-dark-card border-b border-dark-borderSubtle text-text-muted uppercase text-[10px] tracking-wider">
                  <th className="p-4">ผู้ใช้งาน</th>
                  <th className="p-4">อีเมล</th>
                  <th className="p-4">บทบาท</th>
                  <th className="p-4">เพลงที่ลง</th>
                  <th className="p-4">วันที่สมัคร</th>
                  <th className="p-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-borderSubtle">
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-dark-card/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={getFullMediaUrl(u.avatar) || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                            alt={u.username}
                            className="w-9 h-9 rounded-full object-cover bg-dark-card border border-dark-border"
                          />
                          <div>
                            <p className="font-bold text-white text-sm">
                              {u.full_name} {isSelf && <span className="text-[10px] text-orange-400 font-normal">(คุณ)</span>}
                            </p>
                            <p className="text-[11px] text-text-sub">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-text-sub">{u.email}</td>
                      <td className="p-4">{getRoleBadge(u.role)}</td>
                      <td className="p-4 text-text-sub font-mono">{u.uploaded_songs_count || 0} เพลง</td>
                      <td className="p-4 text-text-muted">{new Date(u.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-3 py-1.5 rounded-lg bg-dark-elevated hover:bg-dark-border text-white text-xs font-semibold inline-flex items-center space-x-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>แก้ไข</span>
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="px-3 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/30 text-xs font-semibold inline-flex items-center space-x-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบ</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal สร้างผู้ใช้งานใหม่ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-surface border border-dark-border w-full max-w-md rounded-2xl p-6 shadow-dialog space-y-4">
            <div className="flex items-center justify-between border-b border-dark-borderSubtle pb-3">
              <h3 className="text-base font-bold text-white">เพิ่มผู้ใช้งานใหม่โดยผู้ดูแลระบบ</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">ชื่อผู้ใช้ (Username)</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  required
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">ชื่อ - นามสกุล</label>
                <input
                  type="text"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  required
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">อีเมล</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">รหัสผ่านเริ่มต้น</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">กำหนดบทบาท</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                >
                  <option value="user">ผู้ใช้ทั่วไป (นักเรียน/นักศึกษา/บุคลากร)</option>
                  <option value="uploader">ผู้อัปโหลดเพลง (Uploader)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
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
                  สร้างบัญชี
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แก้ไขข้อมูลผู้ใช้ */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-surface border border-dark-border w-full max-w-md rounded-2xl p-6 shadow-dialog space-y-4">
            <div className="flex items-center justify-between border-b border-dark-borderSubtle pb-3">
              <h3 className="text-base font-bold text-white">แก้ไขข้อมูลผู้ใช้: @{editingUser.username}</h3>
              <button onClick={() => setEditingUser(null)} className="text-text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">ชื่อ - นามสกุล</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  required
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">อีเมล</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">บทบาท</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                >
                  <option value="user">ผู้ใช้ทั่วไป (User)</option>
                  <option value="uploader">ผู้อัปโหลดเพลง (Uploader)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-sub uppercase mb-1">
                  ตั้งรหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="รหัสผ่านใหม่ 6 ตัวขึ้นไป"
                  minLength={6}
                  className="w-full bg-dark-card text-white text-xs px-3.5 py-2.5 rounded-xl border border-dark-border focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-dark-borderSubtle">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
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

      {/* Modal ยืนยันการลบผู้ใช้ */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="ยืนยันการลบผู้ใช้งาน"
        message={`คุณต้องการลบบัญชีผู้ใช้ "${deleteTarget?.full_name} (@${deleteTarget?.username})" ใช่หรือไม่? ข้อมูลเพลงและเพลย์ลิสต์ของผู้ใช้นี้จะถูกลบทั้งหมด`}
        confirmText="ยืนยันการลบผู้ใช้"
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteTarget(null)}
        isDangerous={true}
      />
    </div>
  );
}
