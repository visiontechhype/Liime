import React from 'react';
import { useAppStore } from '../store';
import { Avatar } from './Avatar';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Image, File, Link2 } from 'lucide-react';

export const ProfileDrawer: React.FC = () => {
  const { activeChatId, chats, isProfileOpen, setProfileOpen, lang } = useAppStore();
  const t = translations[lang];
  
  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <AnimatePresence>
      {isProfileOpen && activeChat && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full md:w-[320px] h-full bg-[var(--bg-sidebar)] glass-mobile-solid border-l border-[var(--border-color)] flex flex-col shrink-0 z-30 shadow-xl absolute md:relative right-0"
        >
          {/* Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--border-color)] shrink-0">
            <h2 className="font-medium text-[var(--text-primary)]">Информация</h2>
            <button 
              onClick={() => setProfileOpen(false)}
              className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="p-6 flex flex-col items-center border-b border-[var(--border-color)]">
            <Avatar 
              id={activeChat.user.id} 
              name={activeChat.user.name} 
              src={activeChat.user.avatar} 
              size="xl" 
              className="mb-4 shadow-lg"
            />
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{activeChat.user.name}</h2>
            {activeChat.user.username && (
              <p className="text-sm text-[var(--text-secondary)]">{activeChat.user.username}</p>
            )}
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {activeChat.user.status === 'online' ? t.online : t.lastSeen}
            </p>
            
            {activeChat.user.name === 'Lime AI' && (
              <p className="mt-4 text-center text-sm text-[var(--text-primary)] leading-relaxed bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                {t.geminiBio}
              </p>
            )}
          </div>

          {/* Settings */}
          <div className="p-2">
            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors ripple">
              <div className="flex items-center gap-4 text-[var(--text-primary)]">
                <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="font-medium">{t.muteNotifications}</span>
              </div>
              <div className="w-10 h-6 bg-[var(--accent)] rounded-full relative shadow-inner">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </button>
          </div>

          {/* Shared Media Tabs */}
          <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-[var(--border-color)]">
            <div className="flex border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-sidebar)] z-10">
              <Tab icon={<Image className="w-4 h-4" />} label={t.media} active />
              <Tab icon={<File className="w-4 h-4" />} label={t.files} />
              <Tab icon={<Link2 className="w-4 h-4" />} label={t.links} />
            </div>
            <div className="p-4 text-center text-sm text-[var(--text-secondary)] mt-10">
              Пока нет общих медиа
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Tab: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <button className={`flex-1 flex flex-col items-center gap-1 py-3 border-b-2 transition-colors ${
    active 
      ? 'border-[var(--accent)] text-[var(--accent)]' 
      : 'border-transparent text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
  }`}>
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </button>
);
