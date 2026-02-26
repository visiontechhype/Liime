export type User = {
  id: string;
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
  status: 'online' | 'offline';
  lastSeen?: number;
};

export type MessageStatus = 'sending' | 'sent' | 'read';

export type Message = {
  id: string;
  senderId: string;
  text?: string;
  image?: string;
  isVoice?: boolean;
  voiceUrl?: string;
  mediaData?: string; // Base64
  voiceDuration?: number;
  timestamp: number;
  status: MessageStatus;
  isSelf: boolean;
  replyToId?: string;
  isEdited?: boolean;
  forwardedFrom?: string;
  isSticker?: boolean;
  isCall?: boolean;
};

export type Chat = {
  id: string;
  user: User;
  lastMessage?: string;
  lastMessageTime?: number;
  lastActivity: number;
  unreadCount: number;
  pinnedMessageId?: string;
};

export type Language = 'en' | 'ru';
export type Theme = 'light' | 'dark';
