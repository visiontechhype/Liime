import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { Avatar } from './Avatar';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay } from 'date-fns';
import { Search, MoreVertical, Paperclip, Mic, Send, Smile, Play, Pause, Check, CheckCheck, Clock, Reply, Edit2, Pin, Forward, CheckSquare, Trash2, X, ArrowLeft } from 'lucide-react';
import { Message, MessageStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { sendMessageToPeer } from '../services/peerService';
import { generateGeminiResponse } from '../services/geminiService';

import { VoiceMessage } from './VoiceMessage';

export const ChatArea: React.FC = () => {
  const { activeChatId, chats, messagesMap, selfUser, lang, addMessage, updateMessage, updateChat, setProfileOpen, isProfileOpen } = useAppStore();
  const t = translations[lang];
  const [inputText, setInputText] = useState('');
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: Message } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const { deleteMessages } = useAppStore();

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = activeChatId ? messagesMap[activeChatId] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
    }
  }, [inputText]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent, message: Message) => {
    e.preventDefault();
    if (isMultiSelect) {
      toggleMessageSelection(message.id);
      return;
    }
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const y = clientY > window.innerHeight - 250 ? clientY - 200 : clientY;
    const x = clientX > window.innerWidth - 180 ? clientX - 160 : clientX;

    setContextMenu({ x, y, message });
  };

  const toggleMessageSelection = (id: string) => {
    const newSelection = new Set(selectedMessages);
    if (newSelection.has(id)) {
      newSelection.delete(id);
      if (newSelection.size === 0) setIsMultiSelect(false);
    } else {
      newSelection.add(id);
    }
    setSelectedMessages(newSelection);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setPastedImage(event.target?.result as string);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !isRecording && !pastedImage) return;
    if (!selfUser) return;

    const newMessage: Message = {
      id: uuidv4(),
      senderId: selfUser.id,
      text: inputText.trim() || undefined,
      image: pastedImage || undefined,
      timestamp: Date.now(),
      status: 'sending',
      isSelf: true,
      replyToId: replyTo?.id,
    };

    addMessage(activeChatId!, newMessage);
    updateChat(activeChatId!, {
      lastMessage: pastedImage ? 'Photo' : newMessage.text || (newMessage.isVoice ? 'Voice message' : 'Media'),
      lastMessageTime: newMessage.timestamp,
      lastActivity: newMessage.timestamp,
    });
    setInputText('');
    setPastedImage(null);
    setReplyTo(null);
    
    // Simulate sending delay
    setTimeout(() => {
      updateMessage(activeChatId!, newMessage.id, { status: 'sent' });
    }, 500);

    // If it's the Gemini bot
    if (activeChat?.user.name === 'Lime AI') {
      const responseText = await generateGeminiResponse(newMessage.text || '');
      const botMessage: Message = {
        id: uuidv4(),
        senderId: activeChatId!,
        text: responseText,
        timestamp: Date.now(),
        status: 'sent',
        isSelf: false,
      };
      addMessage(activeChatId!, botMessage);
      
      const store = useAppStore.getState();
      const isActive = store.activeChatId === activeChatId && !document.hidden;
      
      store.updateChat(activeChatId!, {
        lastMessage: responseText,
        lastMessageTime: botMessage.timestamp,
        lastActivity: botMessage.timestamp,
        unreadCount: isActive ? 0 : (store.chats.find(c => c.id === activeChatId)?.unreadCount || 0) + 1,
      });

      if (!isActive) {
        import('../utils/sound').then(({ playNotificationSound }) => {
          playNotificationSound();
        });
      }
    } else {
      // Send via PeerJS
      sendMessageToPeer(activeChatId!, newMessage);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          if (!selfUser) return;
          const base64data = reader.result as string;
          const newMessage: Message = {
            id: uuidv4(),
            senderId: selfUser.id,
            isVoice: true,
            mediaData: base64data,
            voiceDuration: duration,
            timestamp: Date.now(),
            status: 'sending',
            isSelf: true,
            replyToId: replyTo?.id,
          };
          addMessage(activeChatId!, newMessage);
          updateChat(activeChatId!, {
            lastMessage: 'Voice message',
            lastMessageTime: newMessage.timestamp,
            lastActivity: newMessage.timestamp,
          });
          sendMessageToPeer(activeChatId!, newMessage);
          setReplyTo(null);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingStartTimeRef.current = Date.now();

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 hidden md:flex items-center justify-center bg-[var(--bg-main)]">
        <div className="text-center">
          <div className="w-24 h-24 bg-[var(--bg-sidebar)] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm p-4">
            <img src="/favicon.png" alt="Liime" className="w-full h-full object-contain opacity-50 grayscale" />
          </div>
          <p className="text-[var(--text-secondary)] font-medium">Выберите чат, чтобы начать общение</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col bg-[var(--bg-main)] relative h-full overflow-hidden ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between bg-[var(--bg-sidebar)] border-b border-[var(--border-color)] shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => useAppStore.getState().setActiveChatId(null)}
            className="md:hidden p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1.5 rounded-xl transition-colors"
            onClick={() => setProfileOpen(!isProfileOpen)}
          >
            <Avatar id={activeChat.user.id} name={activeChat.user.name} src={activeChat.user.avatar} size="sm" isOnline={activeChat.user.status === 'online'} />
            <div>
              <h2 className="font-medium text-[var(--text-primary)] leading-tight">{activeChat.user.name}</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {activeChat.user.status === 'online' ? t.online : `${t.lastSeen} ${format(activeChat.user.lastSeen || Date.now(), 'HH:mm')}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSearchActive ? (
            <div className="relative">
              <input
                autoFocus
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/5 dark:bg-white/5 text-[var(--text-primary)] rounded-full py-1.5 px-4 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] w-48 transition-all"
              />
              <button onClick={() => setIsSearchActive(false)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsSearchActive(true)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <Search className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => alert('В разработке')} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2 relative">
        {messages.map((msg, index) => {
          const prevMsg = messages[index - 1];
          const nextMsg = messages[index + 1];
          
          const showDateDivider = !prevMsg || !isSameDay(new Date(msg.timestamp), new Date(prevMsg.timestamp));
          const showAvatar = !msg.isSelf && (!nextMsg || nextMsg.senderId !== msg.senderId || showDateDivider);
          const showTail = !nextMsg || nextMsg.senderId !== msg.senderId || showDateDivider;
          const isHighlighted = searchQuery && msg.text?.toLowerCase().includes(searchQuery.toLowerCase());
          const isSelected = selectedMessages.has(msg.id);

          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div className="sticky top-2 z-20 flex justify-center my-2">
                  <div className="bg-[var(--bg-sidebar)]/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-[var(--text-secondary)] shadow-sm border border-[var(--border-color)]">
                    {format(msg.timestamp, 'MMMM d')}
                  </div>
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 max-w-[75%] ${msg.isSelf ? 'self-end flex-row-reverse' : 'self-start'} ${isMultiSelect ? 'cursor-pointer' : ''}`}
                onContextMenu={(e) => handleContextMenu(e, msg)}
                onTouchStart={(e) => {
                  const timer = setTimeout(() => handleContextMenu(e, msg), 500);
                  e.currentTarget.dataset.timer = timer.toString();
                }}
                onTouchEnd={(e) => {
                  clearTimeout(Number(e.currentTarget.dataset.timer));
                }}
                onTouchMove={(e) => {
                  clearTimeout(Number(e.currentTarget.dataset.timer));
                }}
                onClick={() => isMultiSelect && toggleMessageSelection(msg.id)}
              >
                {isMultiSelect && (
                  <div className="flex items-center justify-center shrink-0 w-8">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--text-secondary)]'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white dark:text-black" />}
                    </div>
                  </div>
                )}
                {!msg.isSelf && (
                  <div className="w-8 shrink-0 flex items-end">
                    {showAvatar && <Avatar id={msg.senderId} name={activeChat.user.name} src={activeChat.user.avatar} size="sm" />}
                  </div>
                )}
                <div
                  className={`relative px-3 py-1.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                    msg.isSelf 
                      ? `bg-[var(--bubble-self)] text-white dark:text-black ${showTail ? 'rounded-br-sm' : ''}` 
                      : `bg-[var(--bubble-other)] text-[var(--text-primary)] border border-[var(--border-color)] ${showTail ? 'rounded-bl-sm' : ''}`
                  } ${isHighlighted ? 'flash-highlight' : ''}`}
                >
                  {msg.replyToId && (
                    <div className="mb-1 pl-2 border-l-2 border-white/50 dark:border-black/50 text-sm opacity-80">
                      <div className="font-medium">{messages.find(m => m.id === msg.replyToId)?.isSelf ? selfUser.name : activeChat.user.name}</div>
                      <div className="truncate">{messages.find(m => m.id === msg.replyToId)?.text || 'Voice message'}</div>
                    </div>
                  )}
                  {msg.image && (
                    <img src={msg.image} alt="Attached" className="max-w-full rounded-lg mb-1" />
                  )}
                  {msg.isVoice ? (
                    <VoiceMessage mediaData={msg.mediaData} duration={msg.voiceDuration} />
                  ) : (
                    msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  )}
                  <div className={`flex items-center justify-end gap-1 mt-0.5 text-[11px] ${msg.isSelf ? 'text-white/70 dark:text-black/70' : 'text-[var(--text-secondary)]'}`}>
                    <span>{format(msg.timestamp, 'HH:mm')}</span>
                    {msg.isSelf && (
                      <span>
                        {msg.status === 'sending' && <Clock className="w-3 h-3" />}
                        {msg.status === 'sent' && <Check className="w-3 h-3" />}
                        {msg.status === 'read' && <CheckCheck className="w-3 h-3 text-[var(--accent)]" />}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply & Image Preview */}
      <AnimatePresence>
        {(replyTo || pastedImage) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-[var(--bg-main)] border-t border-[var(--border-color)] flex flex-col gap-2"
          >
            {replyTo && (
              <div className="flex items-center gap-3">
                <Reply className="w-5 h-5 text-[var(--accent)] shrink-0" />
                <div className="flex-1 border-l-2 border-[var(--accent)] pl-2 overflow-hidden">
                  <div className="text-sm font-medium text-[var(--accent)]">{replyTo.isSelf ? selfUser?.name : activeChat.user.name}</div>
                  <div className="text-sm text-[var(--text-secondary)] truncate">{replyTo.text || 'Voice message'}</div>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {pastedImage && (
              <div className="relative inline-block w-24 h-24">
                <img src={pastedImage} alt="Pasted" className="w-full h-full object-cover rounded-lg border border-[var(--border-color)]" />
                <button onClick={() => setPastedImage(null)} className="absolute -top-2 -right-2 p-1 bg-[var(--bg-sidebar)] text-[var(--text-primary)] rounded-full shadow-md hover:bg-black/5 dark:hover:bg-white/5">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-3 bg-[var(--bg-main)] shrink-0 z-10">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <button className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0">
            <Paperclip className="w-6 h-6" />
          </button>
          
          <div className="flex-1 bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl flex items-end shadow-sm overflow-hidden">
            <button onClick={() => alert('Смайлики в разработке')} className="p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0">
              <Smile className="w-6 h-6" />
            </button>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t.message}
              className="flex-1 max-h-36 py-3 px-1 bg-transparent text-[var(--text-primary)] focus:outline-none resize-none custom-scrollbar text-[15px]"
              rows={1}
            />
          </div>

          {inputText.trim() || pastedImage ? (
            <button 
              onClick={(e) => { e.preventDefault(); handleSend(); }}
              className="p-3 rounded-full bg-[var(--accent)] text-white dark:text-black hover:scale-105 transition-transform shadow-md shrink-0"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button 
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`p-3 rounded-full transition-all shadow-md shrink-0 ${
                isRecording 
                  ? 'bg-red-500 text-white scale-110 animate-pulse' 
                  : 'bg-[var(--bg-sidebar)] text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 border border-[var(--border-color)]'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-50 bg-[var(--bg-sidebar)] border border-[var(--border-color)] shadow-xl rounded-xl py-1 min-w-[160px] overflow-hidden"
          >
            <ContextMenuItem icon={<Reply className="w-4 h-4" />} label={t.reply} onClick={() => { setReplyTo(contextMenu.message); setContextMenu(null); }} />
            {contextMenu.message.isSelf && <ContextMenuItem icon={<Edit2 className="w-4 h-4" />} label={t.edit} onClick={() => { alert('В разработке'); setContextMenu(null); }} />}
            <ContextMenuItem icon={<Pin className="w-4 h-4" />} label={t.pin} onClick={() => { alert('В разработке'); setContextMenu(null); }} />
            <ContextMenuItem icon={<Forward className="w-4 h-4" />} label={t.forward} onClick={() => { alert('В разработке'); setContextMenu(null); }} />
            <div className="h-px bg-[var(--border-color)] my-1" />
            <ContextMenuItem icon={<CheckSquare className="w-4 h-4" />} label={t.select} onClick={() => { setIsMultiSelect(true); toggleMessageSelection(contextMenu.message.id); setContextMenu(null); }} />
            <ContextMenuItem icon={<Trash2 className="w-4 h-4 text-red-500" />} label={t.delete} onClick={() => { deleteMessages(activeChatId!, [contextMenu.message.id]); setContextMenu(null); }} className="text-red-500 hover:bg-red-500/10" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-Select Toolbar */}
      <AnimatePresence>
        {isMultiSelect && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 left-0 right-0 bg-[var(--bg-sidebar)] border-t border-[var(--border-color)] p-3 flex items-center justify-between z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
          >
            <button onClick={() => { setIsMultiSelect(false); setSelectedMessages(new Set()); }} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              {t.cancel}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-secondary)] mr-2">{selectedMessages.size} selected</span>
              <button onClick={() => alert('В разработке')} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)] transition-colors">
                <Forward className="w-5 h-5" />
              </button>
              <button onClick={() => { deleteMessages(activeChatId!, Array.from(selectedMessages)); setIsMultiSelect(false); setSelectedMessages(new Set()); }} className="p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContextMenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; className?: string }> = ({ icon, label, onClick, className }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${className || 'text-[var(--text-primary)]'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);
