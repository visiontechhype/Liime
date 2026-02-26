import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Avatar } from './Avatar';
import { Menu, Search, Settings, Moon, Sun, Users, Phone, Bookmark, Edit2, Trash2, UserSquare, MessageSquare, Shield, Megaphone } from 'lucide-react';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { SearchModal } from './SearchModal';
import { SettingsModal } from './SettingsModal';

export const Sidebar: React.FC = () => {
  const { chats, activeChatId, setActiveChatId, theme, setTheme, lang, selfUser, isDrawerOpen, setDrawerOpen, searchQuery, setSearchQuery, logout } = useAppStore();
  const t = translations[lang];
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isFabMenuOpen, setFabMenuOpen] = useState(false);

  const filteredChats = chats
    .filter(c => c.user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.lastActivity - a.lastActivity);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'HH:mm');
    }
    return format(date, 'MMM d');
  };

  const handleNewChat = () => {
    setFabMenuOpen(!isFabMenuOpen);
  };

  return (
    <div className={`w-full sm:w-[350px] md:w-[400px] h-full flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] relative z-20 shrink-0 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
      {/* Header */}
      <div className="flex items-center px-4 py-3 gap-4">
        <button 
          onClick={() => setDrawerOpen(true)}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[var(--text-secondary)]" />
          </div>
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/5 dark:bg-white/5 text-[var(--text-primary)] rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-shadow placeholder-[var(--text-secondary)]"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredChats.map((chat) => {
          const isActive = activeChatId === chat.id;
          return (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-xl cursor-pointer transition-colors ripple ${
                isActive 
                  ? 'bg-[var(--accent)] text-white dark:text-black' 
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Avatar id={chat.user.id} name={chat.user.name} src={chat.user.avatar} isOnline={chat.user.status === 'online'} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className={`font-medium truncate ${isActive ? 'text-white dark:text-black' : 'text-[var(--text-primary)]'}`}>
                    {chat.user.name}
                  </h3>
                  <span className={`text-xs whitespace-nowrap ml-2 ${isActive ? 'text-white/80 dark:text-black/80' : 'text-[var(--text-secondary)]'}`}>
                    {formatTime(chat.lastMessageTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className={`text-sm truncate ${isActive ? 'text-white/90 dark:text-black/90' : 'text-[var(--text-secondary)]'}`}>
                    {chat.lastMessage || '...'}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 min-w-[1.25rem] text-center text-xs font-medium rounded-full ${
                      isActive 
                        ? 'bg-white text-[var(--accent)] dark:bg-black dark:text-[var(--accent)]' 
                        : 'bg-[var(--accent)] text-white dark:text-black'
                    }`}>
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isFabMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="flex flex-col gap-2 items-end"
            >
              <FabMenuItem icon={<MessageSquare className="w-4 h-4" />} label="Новый чат" onClick={() => { setSearchModalOpen(true); setFabMenuOpen(false); }} />
              <FabMenuItem icon={<Users className="w-4 h-4" />} label="Создать группу" onClick={() => { alert('В разработке'); setFabMenuOpen(false); }} />
              <FabMenuItem icon={<Megaphone className="w-4 h-4" />} label="Создать канал" onClick={() => { alert('В разработке'); setFabMenuOpen(false); }} />
              <FabMenuItem icon={<Shield className="w-4 h-4" />} label="Секретный чат" onClick={() => { alert('В разработке'); setFabMenuOpen(false); }} />
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={handleNewChat}
          className="w-14 h-14 bg-[var(--accent)] rounded-full flex items-center justify-center text-white dark:text-black shadow-lg hover:scale-105 transition-transform ripple"
        >
          <Edit2 className="w-6 h-6" />
        </button>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[300px] bg-[var(--bg-sidebar)] glass-mobile-solid z-50 shadow-2xl flex flex-col"
            >
              <div 
                className="p-4 bg-[var(--bg-sidebar)] border-b border-[var(--border-color)] cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                onClick={() => { setDrawerOpen(false); setSettingsModalOpen(true); }}
              >
                <div className="flex justify-between items-start mb-4">
                  {selfUser && <Avatar id={selfUser.id} name={selfUser.name} src={selfUser.avatar} size="lg" />}
                  <button onClick={(e) => { e.stopPropagation(); toggleTheme(); }} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)]">
                    {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                  </button>
                </div>
                <h2 className="font-medium text-[var(--text-primary)] text-lg">{selfUser?.name}</h2>
                <p className="text-[var(--text-secondary)] text-sm">{selfUser?.username || '@username'}</p>
              </div>
              <div className="flex-1 py-2 overflow-y-auto">
                <DrawerItem icon={<Users />} label={t.newGroup} onClick={() => alert('Функция "Создать группу" в разработке')} />
                <DrawerItem icon={<UserSquare />} label={t.contacts} onClick={() => alert('Функция "Контакты" в разработке')} />
                <DrawerItem icon={<Phone />} label={t.calls} onClick={() => alert('Функция "Звонки" в разработке')} />
                <DrawerItem icon={<Bookmark />} label={t.savedMessages} onClick={() => alert('Функция "Избранное" в разработке')} />
                <DrawerItem icon={<Settings />} label={t.settings} onClick={() => { setDrawerOpen(false); setSettingsModalOpen(true); }} />
                
                <div className="h-px bg-[var(--border-color)] my-2" />
                <DrawerItem icon={<Trash2 className="text-red-500" />} label="Выйти" onClick={() => logout()} />
                
                <div className="mt-auto p-4 text-xs text-center text-[var(--text-secondary)] opacity-70 flex flex-col items-center gap-2">
                  <img src="/favicon2.png" alt="Liime" className="h-6 opacity-50 grayscale hover:grayscale-0 transition-all" />
                  <span>Разработано ChromeTech<br/>при помощи Google Gemini</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchModal isOpen={isSearchModalOpen} onClose={() => setSearchModalOpen(false)} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
    </div>
  );
};

const FabMenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-3 bg-[var(--bg-sidebar)] border border-[var(--border-color)] px-4 py-2 rounded-full shadow-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--text-primary)]">
    <span className="text-[var(--text-secondary)]">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const DrawerItem: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-6 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--text-primary)] ripple">
    <span className="text-[var(--text-secondary)]">{icon}</span>
    <span className="font-medium">{label}</span>
  </button>
);
