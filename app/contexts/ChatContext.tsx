import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  status: string;
}

interface User {
  username: string;
  status: string;
}

interface ChatContextType {
  currentUser: User | null;
  messages: Message[];
  isLoading: boolean;
  setCurrentUser: (user: User) => void;
  updateUser: (user: User) => void;
  addMessage: (text: string) => void;
  logout: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: '@chat_app_user',
  MESSAGES: '@chat_app_messages'
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and messages from storage on mount
  useEffect(() => {
    loadStoredData();
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      saveMessages();
    }
  }, [messages, isLoading]);

  // Save user whenever it changes
  useEffect(() => {
    if (!isLoading && currentUser) {
      saveUser();
    }
  }, [currentUser, isLoading]);

  const loadStoredData = async () => {
    try {
      const [storedUser, storedMessages] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.MESSAGES)
      ]);

      if (storedUser) {
        setCurrentUserState(JSON.parse(storedUser));
      }

      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        // Set welcome message only if no messages exist
        setMessages([
          {
            id: '1',
            username: 'ChatBot',
            text: 'Welcome to the chat room! 👋',
            timestamp: new Date().toISOString(),
            status: 'Always here to help'
          }
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
      status: currentUser.status
    };
    
    setMessages(prev => [...prev, newMessage]);
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
    <ChatContext.Provider value={{ currentUser, messages, isLoading, setCurrentUser, updateUser, addMessage, logout }}>
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
