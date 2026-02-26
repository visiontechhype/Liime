import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader2, UserPlus } from 'lucide-react';
import { useAppStore } from '../store';
import { Avatar } from './Avatar';
import { User } from '../types';

export const SearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { token, addChat, setActiveChatId } = useAppStore();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, token]);

  const handleStartChat = (user: User) => {
    addChat({
      id: user.id,
      user: { ...user, status: 'online' },
      lastActivity: Date.now(),
      unreadCount: 0,
    });
    setActiveChatId(user.id);
    onClose();
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
            <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Поиск по имени или @username..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 text-[var(--text-primary)] rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                />
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                </div>
              ) : results.length > 0 ? (
                results.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleStartChat(user)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Avatar id={user.id} name={user.name} src={user.avatar} size="md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--text-primary)] truncate">{user.name}</h3>
                      <p className="text-sm text-[var(--text-secondary)] truncate">{user.username}</p>
                    </div>
                    <UserPlus className="w-5 h-5 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              ) : query ? (
                <div className="text-center p-8 text-[var(--text-secondary)]">
                  Ничего не найдено
                </div>
              ) : (
                <div className="text-center p-8 text-[var(--text-secondary)]">
                  Введите имя или @username для поиска
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
