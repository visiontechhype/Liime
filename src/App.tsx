import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ProfileDrawer } from './components/ProfileDrawer';
import { useAppStore } from './store';
import { initPeer } from './services/peerService';
import { Auth } from './Auth';

export default function App() {
  const { theme, selfUser, token, chats, addChat, logout } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const totalUnread = chats.reduce((acc, chat) => acc + chat.unreadCount, 0);
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Liime`;
    } else {
      document.title = 'Liime';
    }
  }, [chats]);

  useEffect(() => {
    if (selfUser) {
      initPeer(selfUser.id);

      // Add Lime AI if not exists
      const currentChats = useAppStore.getState().chats;
      const geminiChat = currentChats.find(c => c.id === 'gemini-ai');
      if (!geminiChat) {
        addChat({
          id: 'gemini-ai',
          user: {
            id: 'gemini-ai',
            name: 'Lime AI',
            status: 'online',
            avatar: '/favicon.png',
          },
          lastActivity: Date.now(),
          unreadCount: 0,
        });
      } else if (geminiChat.user.avatar !== '/favicon.png' || geminiChat.user.name !== 'Lime AI') {
        useAppStore.getState().updateChat('gemini-ai', {
          user: {
            ...geminiChat.user,
            name: 'Lime AI',
            avatar: '/favicon.png',
          }
        });
      }
    }
  }, [selfUser]);

  if (!token || !selfUser) {
    return <Auth />;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[var(--bg-main)] text-[var(--text-primary)] overflow-hidden font-sans">
      <Sidebar />
      <ChatArea />
      <ProfileDrawer />
    </div>
  );
}
