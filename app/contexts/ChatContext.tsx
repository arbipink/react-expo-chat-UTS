import * as React from 'react'; 
import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  status: string;
  isStarred?: boolean;
  isUpdate?: boolean;
}

interface User {
  username: string;
  status: string;
}

interface ChatContextType {
  currentUser: User | null;
  messages: Message[];
  starredMessages: Message[];
  isLoading: boolean;
  setCurrentUser: (user: User) => void;
  updateUser: (user: User) => void;
  addMessage: (text: string) => void;
  toggleStarMessage: (messageId: string) => void;
  updateMessage: (messageId: string, newText: string) => void;
  deleteMessage: (messageId: string) => void;
  logout: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: '@chat_app_user',
  MESSAGES: '@chat_app_messages',
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      saveMessages();
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading && currentUser) {
      saveUser();
    }
  }, [currentUser, isLoading]);

  const loadStoredData = async () => {
    try {
      const [storedUser, storedMessages] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.MESSAGES),
      ]);
      if (storedUser) {
        setCurrentUserState(JSON.parse(storedUser));
      }
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        setMessages([
          {
            id: '1',
            username: 'ChatBot',
            text: 'Welcome to the chat room! 👋',
            timestamp: new Date().toISOString(),
            status: 'Always here to help',
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

  const saveUser = async () => {
    try {
      if (currentUser) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const saveMessages = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
  };

  const updateUser = (user: User) => {
    setCurrentUserState(user);
  };

  const addMessage = (text: string) => {
    if (!currentUser) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      username: currentUser.username,
      text,
      timestamp: new Date().toISOString(),
      status: currentUser.status,
      isStarred: false,
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const toggleStarMessage = (messageId: string) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
      )
    );
  };

  const starredMessages = useMemo(() => {
    return messages.filter(msg => msg.isStarred).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages]);

  const updateMessage =  (messageId: string, newText: string) => {
    setMessages(prevMesssages =>
      prevMesssages.map(msg =>
        msg.id === messageId ?
        {
          ...msg,
          text: newText,
          isUpdate: true,
          timestamp: new Date().toISOString()
        }
        : msg
      )
    );
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prevMessages =>
      prevMessages.filter(msg => msg.id !== messageId)
    );
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      setCurrentUserState(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        messages,
        isLoading,
        setCurrentUser,
        updateUser,
        addMessage,
        logout,
        toggleStarMessage,
        starredMessages,
        updateMessage,
        deleteMessage
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