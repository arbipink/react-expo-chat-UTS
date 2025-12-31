import * as React from 'react';
import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

export interface Message {
  id: string;
  chatId: string;
  senderEmail: string;
  username: string;
  text?: string;
  image?: string;
  createdAt: any; 
  status: string; 
  starredBy?: string[];
  isUpdate?: boolean;
}

export interface UserProfile {
  username: string;
  email: string;
  status: string;
}

export interface ChatRoom {
  id: string;
  participants: string[]; 
  lastMessage?: {
    text: string;
    timestamp: any;
  };
}

interface ChatContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  chats: ChatRoom[];
  messages: Message[];
  starredMessages: Message[];
  activeChatId: string | null;
  isLoading: boolean;
  startChat: (email: string) => Promise<void>;
  openChat: (chatId: string | null) => void;
  addMessage: (text: string, image?: string | null) => Promise<void>;
  toggleStarMessage: (messageId: string, currentStarredBy: string[]) => Promise<void>;
  updateMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  logout: () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, username: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Listen for Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsLoading(true);

      if (user) {
        // Fetch extra user details (username, status) from 'users' collection
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          }
        });
        setIsLoading(false);
        return () => unsubscribeProfile();
      } else {
        setUserProfile(null);
        setChats([]);
        setMessages([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen for User's Chats
  useEffect(() => {
    if (!currentUser || !currentUser.email) return;

    // Query chats where 'participants' array contains current user's email
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatRoom[];

      // Sort locally by last message time
      fetchedChats.sort((a, b) => {
        const tA = a.lastMessage?.timestamp?.seconds || 0;
        const tB = b.lastMessage?.timestamp?.seconds || 0;
        return tB - tA;
      });

      setChats(fetchedChats);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 3. Listen for Messages in Active Chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    // Messages are stored in a subcollection: chats/{chatId}/messages
    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [activeChatId]);

  // --- Actions ---

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string, username: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    // Create a user profile document
    await setDoc(doc(db, 'users', res.user.uid), {
      email,
      username,
      status: 'Online',
      createdAt: serverTimestamp()
    });
  };

  const logout = async () => {
    setActiveChatId(null);
    await signOut(auth);
  };

  const startChat = async (targetEmail: string) => {
    if (!currentUser?.email) return;

    // Check if chat already exists
    const existingChat = chats.find(c => c.participants.includes(targetEmail));
    if (existingChat) {
      setActiveChatId(existingChat.id);
      return;
    }

    // Create new chat document
    const newChatRef = await addDoc(collection(db, 'chats'), {
      participants: [currentUser.email, targetEmail],
      createdAt: serverTimestamp(),
      lastMessage: null
    });

    setActiveChatId(newChatRef.id);
  };

  const openChat = (chatId: string | null) => {
    setActiveChatId(chatId);
  };

  const addMessage = async (text: string, image?: string | null) => {
    if (!currentUser || !activeChatId || !userProfile) return;
    if (!text.trim() && !image) return;

    const messageData = {
      chatId: activeChatId,
      senderEmail: currentUser.email,
      username: userProfile.username,
      text,
      image: image || null,
      createdAt: serverTimestamp(), // Let server set the time
      status: 'sent',
      starredBy: []
    };

    // 1. Add to messages subcollection
    await addDoc(collection(db, 'chats', activeChatId, 'messages'), messageData);

    // 2. Update the main chat document with last message info
    const chatRef = doc(db, 'chats', activeChatId);
    await updateDoc(chatRef, {
      lastMessage: {
        text: text || 'Image',
        timestamp: serverTimestamp()
      }
    });
  };

  const toggleStarMessage = async (messageId: string, currentStarredBy: string[] = []) => {
    if (!currentUser?.email || !activeChatId) return;

    const messageRef = doc(db, 'chats', activeChatId, 'messages', messageId);
    const isStarred = currentStarredBy.includes(currentUser.email);

    if (isStarred) {
      await updateDoc(messageRef, {
        starredBy: arrayRemove(currentUser.email)
      });
    } else {
      await updateDoc(messageRef, {
        starredBy: arrayUnion(currentUser.email)
      });
    }
  };

  const updateMessage = async (messageId: string, newText: string) => {
    if (!activeChatId) return;
    const messageRef = doc(db, 'chats', activeChatId, 'messages', messageId);
    await updateDoc(messageRef, {
      text: newText,
      isUpdate: true
    });
  };

  const deleteMessage = async (messageId: string) => {
    if (!activeChatId) return;
    await deleteDoc(doc(db, 'chats', activeChatId, 'messages', messageId));
  };

  // Calculate starred messages locally from the current messages list
  const starredMessages = useMemo(() => {
    if (!currentUser?.email) return [];
    return messages
      .filter(msg => msg.starredBy && msg.starredBy.includes(currentUser.email!))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [messages, currentUser]);

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        userProfile,
        messages,
        starredMessages,
        chats,
        activeChatId,
        isLoading,
        startChat,
        openChat,
        addMessage,
        logout,
        login,
        register,
        toggleStarMessage,
        updateMessage,
        deleteMessage,
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