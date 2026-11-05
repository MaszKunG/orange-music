import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'ยืนยันการลบข้อมูล',
  message = 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้? การกระทำนี้ไม่สามารถยกเลิกได้',
  confirmText = 'ยืนยันการลบ',
  cancelText = 'ยกเลิก',
  onConfirm,
  onCancel,
  isDangerous = true,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-surface border border-dark-border w-full max-w-md rounded-2xl p-6 shadow-dialog space-y-5 animate-scale-up">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${isDangerous ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-text-muted hover:text-white p-1 rounded-full hover:bg-dark-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-text-sub leading-relaxed">{message}</p>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-text-sub hover:text-white bg-dark-card hover:bg-dark-elevated transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-orange-500 hover:bg-orange-400 text-white shadow-glow-orange-sm'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
