import * as React from 'react'; 
import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TYPES ---
export interface Message {
  id: string;
  chatId: string; // Links message to specific room
  username: string;
  text: string;
  timestamp: string;
  status: string;
  isStarred?: boolean;
  isUpdate?: boolean;
}

export interface User {
  username: string;
  status: string;
  email: string;
  password: string;
}

export interface ChatRoom {
  id: string;
  participants: string[]; 
  lastMessage?: Message;
}

interface ChatContextType {
  currentUser: User | null;
  chats: ChatRoom[];
  messages: Message[]; 
  starredMessages: Message[]; // <--- Added this back!
  activeChatId: string | null;
  isLoading: boolean;
  setCurrentUser: (user: User) => void;
  updateUser: (user: User) => void;
  startChat: (email: string) => void;
  openChat: (chatId: string | null) => void;
  addMessage: (text: string) => void;
  toggleStarMessage: (messageId: string) => void;
  updateMessage: (messageId: string, newText: string) => void;
  deleteMessage: (messageId: string) => void;
  logout: () => void;
  getMessagesForChat: (chatId: string) => Message[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: '@chat_app_user',
  MESSAGES: '@chat_app_messages_v2', 
  CHATS: '@chat_app_chats',
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadStoredData();
  }, []);

  // Save data on changes
  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [messages, chats, currentUser, isLoading]);

  const loadStoredData = async () => {
    try {
      const [storedUser, storedMessages, storedChats] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.MESSAGES),
        AsyncStorage.getItem(STORAGE_KEYS.CHATS),
      ]);

      if (storedUser) setCurrentUserState(JSON.parse(storedUser));
      
      if (storedChats) {
        setChats(JSON.parse(storedChats));
      } else {
        setChats([{ id: 'chatbot-room', participants: ['ChatBot'] }]);
      }

      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        setMessages([
          {
            id: '1',
            chatId: 'chatbot-room',
            username: 'ChatBot',
            text: 'Welcome! Type an email to start a new private chat.',
            timestamp: new Date().toISOString(),
            status: 'System',
            isStarred: false,
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async () => {
    try {
      if (currentUser) await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const setCurrentUser = (user: User) => setCurrentUserState(user);
  const updateUser = (user: User) => setCurrentUserState(user);

  // --- CHAT ROOM LOGIC ---

  const openChat = (chatId: string | null) => {
    setActiveChatId(chatId);
  };

  const startChat = (email: string) => {
    if (!currentUser) return;
    
    // Check if chat already exists
    const existingChat = chats.find(c => c.participants.includes(email) && c.participants.includes(currentUser.email));
    
    if (existingChat) {
      setActiveChatId(existingChat.id);
      return;
    }

    const newChatId = Date.now().toString();
    const newChat: ChatRoom = {
      id: newChatId,
      participants: [currentUser.email, email],
      lastMessage: undefined,
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
  };

  // --- MESSAGE LOGIC ---

  const addMessage = (text: string) => {
    if (!currentUser || !activeChatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId: activeChatId,
      username: currentUser.username,
      text,
      timestamp: new Date().toISOString(),
      status: currentUser.status,
      isStarred: false,
    };

    setMessages(prev => [...prev, newMessage]);

    // Update last message in chat list and re-sort
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === activeChatId 
          ? { ...chat, lastMessage: newMessage } 
          : chat
      ).sort((a, b) => {
        const timeA = a.lastMessage?.timestamp || '0';
        const timeB = b.lastMessage?.timestamp || '0';
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      })
    );
  };

  const getMessagesForChat = (chatId: string) => {
    return messages.filter(m => m.chatId === chatId);
  };

  const toggleStarMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg));
  };

  // Calculate starred messages dynamically
  const starredMessages = useMemo(() => {
    return messages
      .filter(msg => msg.isStarred)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages]);

  const updateMessage = (messageId: string, newText: string) => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, text: newText, isUpdate: true } : msg));
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      setCurrentUserState(null);
      setActiveChatId(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        messages,
        starredMessages,
        chats,
        activeChatId,
        isLoading,
        setCurrentUser,
        updateUser,
        startChat,
        openChat,
        addMessage,
        logout,
        toggleStarMessage,
        updateMessage,
        deleteMessage,
        getMessagesForChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};