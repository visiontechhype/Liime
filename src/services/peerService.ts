import Peer, { DataConnection } from 'peerjs';
import { useAppStore } from '../store';
import { Message, User } from '../types';
import { playNotificationSound } from '../utils/sound';

let peer: Peer | null = null;
const connections: Record<string, DataConnection> = {};

export const initPeer = (myId?: string) => {
  if (peer) return peer;
  
  peer = new Peer(myId || undefined);
  
  peer.on('open', (id) => {
    useAppStore.getState().setMyPeerId(id);
  });

  peer.on('connection', (conn) => {
    setupConnection(conn);
  });

  return peer;
};

export const connectToPeer = (peerId: string) => {
  if (!peer) return;
  const conn = peer.connect(peerId);
  setupConnection(conn);
};

const setupConnection = (conn: DataConnection) => {
  connections[conn.peer] = conn;

  conn.on('open', () => {
    const selfUser = useAppStore.getState().selfUser;
    conn.send(JSON.stringify({
      type: 'handshake',
      data: selfUser,
    }));
  });

  conn.on('data', (data: any) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      handleIncomingData(conn.peer, parsed);
    } catch (e) {
      console.error('Failed to parse incoming data', e);
    }
  });

  conn.on('close', () => {
    delete connections[conn.peer];
    // Update user status to offline
  });
};

const handleIncomingData = (peerId: string, payload: any) => {
  const { type, data } = payload;
  const store = useAppStore.getState();

  if (type === 'handshake') {
    const user = data as User;
    const existingChat = store.chats.find(c => c.user.id === user.id);
    if (!existingChat) {
      store.addChat({
        id: user.id,
        user,
        lastActivity: Date.now(),
        unreadCount: 0,
      });
    }
  } else if (type === 'text' || type === 'voice' || type === 'media') {
    const message = data as Message;
    store.addMessage(message.senderId, message);
    
    // Update chat summary
    const isActive = store.activeChatId === message.senderId && !document.hidden;
    store.updateChat(message.senderId, {
      lastMessage: message.text || (message.isVoice ? 'Voice message' : 'Media'),
      lastMessageTime: message.timestamp,
      lastActivity: message.timestamp,
      unreadCount: isActive ? 0 : (store.chats.find(c => c.id === message.senderId)?.unreadCount || 0) + 1,
    });

    if (!isActive) {
      playNotificationSound();
    }
  }
};

export const sendMessageToPeer = (peerId: string, message: Message) => {
  const conn = connections[peerId];
  if (conn && conn.open) {
    conn.send(JSON.stringify({
      type: message.isVoice ? 'voice' : message.mediaData ? 'media' : 'text',
      data: message,
    }));
  }
};
