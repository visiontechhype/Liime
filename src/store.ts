import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chat, Language, Message, Theme, User } from './types';

export type ThemeType = 'default';

interface AppState {
  theme: Theme;
  lang: Language;
  selfUser: User | null;
  token: string | null;
  chats: Chat[];
  messagesMap: Record<string, Message[]>;
  myPeerId: string;
  activeChatId: string | null;
  isDrawerOpen: boolean;
  isProfileOpen: boolean;
  searchQuery: string;
  
  setTheme: (theme: Theme) => void;
  setLang: (lang: Language) => void;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setSelfUser: (user: Partial<User>) => void;
  addChat: (chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessages: (chatId: string, messageIds: string[]) => void;
  setActiveChatId: (id: string | null) => void;
  setDrawerOpen: (isOpen: boolean) => void;
  setProfileOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
  setMyPeerId: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      lang: 'ru',
      selfUser: null,
      token: null,
      chats: [],
      messagesMap: {},
      myPeerId: '',
      activeChatId: null,
      isDrawerOpen: false,
      isProfileOpen: false,
      searchQuery: '',

      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      setAuth: (selfUser, token) => set({ selfUser, token }),
      logout: () => set({ selfUser: null, token: null, chats: [], messagesMap: {}, activeChatId: null }),
      setSelfUser: (updates) => set((state) => ({ selfUser: state.selfUser ? { ...state.selfUser, ...updates } : null })),
      addChat: (chat) => set((state) => {
        if (state.chats.some(c => c.id === chat.id)) return state;
        return { chats: [...state.chats, chat] };
      }),
      updateChat: (chatId, updates) =>
        set((state) => ({
          chats: state.chats.map((c) => (c.id === chatId ? { ...c, ...updates } : c)),
        })),
      addMessage: (chatId, message) =>
        set((state) => {
          const chatMessages = state.messagesMap[chatId] || [];
          return {
            messagesMap: {
              ...state.messagesMap,
              [chatId]: [...chatMessages, message],
            },
          };
        }),
      updateMessage: (chatId, messageId, updates) =>
        set((state) => {
          const chatMessages = state.messagesMap[chatId] || [];
          return {
            messagesMap: {
              ...state.messagesMap,
              [chatId]: chatMessages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
            },
          };
        }),
      deleteMessages: (chatId, messageIds) =>
        set((state) => {
          const chatMessages = state.messagesMap[chatId] || [];
          return {
            messagesMap: {
              ...state.messagesMap,
              [chatId]: chatMessages.filter((m) => !messageIds.includes(m.id)),
            },
          };
        }),
      setActiveChatId: (id) => set((state) => {
        if (id) {
          return {
            activeChatId: id,
            chats: state.chats.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
          };
        }
        return { activeChatId: id };
      }),
      setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
      setProfileOpen: (isOpen) => set({ isProfileOpen: isOpen }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setMyPeerId: (id) => set({ myPeerId: id }),
    }),
    {
      name: 'liime_storage_v1',
      partialize: (state) => ({
        theme: state.theme,
        lang: state.lang,
        selfUser: state.selfUser,
        token: state.token,
        chats: state.chats,
        messagesMap: state.messagesMap,
        myPeerId: state.myPeerId,
      }),
    }
  )
);
