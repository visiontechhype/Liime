import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Image as ImageIcon, User, AtSign, Save } from 'lucide-react';
import { useAppStore } from '../store';
import { Avatar } from './Avatar';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { selfUser, token, setSelfUser } = useAppStore();
  const [name, setName] = useState(selfUser?.name || '');
  const [username, setUsername] = useState(selfUser?.username || '');
  const [avatar, setAvatar] = useState(selfUser?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Файл слишком большой (макс. 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!username.startsWith('@')) {
      setError('Имя пользователя должно начинаться с @');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, username, avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelfUser(data);
      setSuccess('Настройки успешно сохранены');
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--bg-sidebar)] rounded-2xl shadow-2xl z-50 overflow-hidden border border-[var(--border-color)]"
          >
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Настройки профиля</h2>
              <button onClick={onClose} className="px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-sm font-medium text-[var(--text-primary)] transition-colors">
                Закрыть
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Avatar id={selfUser?.id || ''} name={name} src={avatar} size="xl" className="shadow-lg" />
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-[var(--accent)] hover:text-emerald-400 transition-colors"
                >
                  Изменить аватар
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Отображаемое имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all text-[var(--text-primary)]"
                  />
                </div>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="@username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all text-[var(--text-primary)]"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              {success && <p className="text-emerald-500 text-sm text-center">{success}</p>}

              <button
                disabled={loading}
                onClick={handleSave}
                className="w-full bg-[var(--accent)] hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Save className="w-5 h-5" />
                    Сохранить
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
