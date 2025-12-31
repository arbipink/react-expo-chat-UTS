import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Pressable,
  Modal,
  Alert,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useChatContext, Message, ChatRoom } from '../contexts/ChatContext';
import { useActionSheet } from '@expo/react-native-action-sheet';

// Helper for consistent user colors
const getUserColor = (username: string) => {
  const safeName = username || 'User';
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
  const hash = safeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Helper to handle Firestore Timestamps vs Dates
const formatTime = (timestamp: any) => {
  if (!timestamp) return '';
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  // Fallback for standard Date objects or strings
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Component for the list of chats (Inbox view)
const ChatListItem = ({ chat, onPress, currentUserEmail }: { chat: ChatRoom, onPress: () => void, currentUserEmail?: string }) => {
  // Find the other participant's email
  const otherParticipantEmail = chat.participants.find(p => p !== currentUserEmail) || 'Unknown';
  // Use email as name since we might not have their username loaded in the chat list view yet
  const displayName = otherParticipantEmail.split('@')[0];

  const lastMsg = chat.lastMessage;
  const userColor = getUserColor(displayName);

  const getPreviewText = () => {
    if (!lastMsg) return 'No messages yet';
    if (lastMsg.text) {
      return lastMsg.text;
    } else {
      return '📷 Image';
    }
  };

  return (
    <TouchableOpacity style={styles.chatListItem} onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: userColor, marginRight: 15 }]}>
        <Text style={styles.avatarText}>{displayName[0]?.toUpperCase()}</Text>
      </View>
      <View style={styles.chatListContent}>
        <View style={styles.chatListHeader}>
          <Text style={styles.chatListName}>{displayName}</Text>
          <Text style={styles.chatListTime}>{formatTime(lastMsg?.timestamp)}</Text>
        </View>
        <Text style={styles.chatListPreview} numberOfLines={1}>
          {getPreviewText()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ChatScreen() {
  const {
    currentUser,
    userProfile,
    chats,
    activeChatId,
    openChat,
    startChat,
    messages,
    addMessage,
    toggleStarMessage,
    updateMessage,
    deleteMessage
  } = useChatContext();

  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [newChatEmail, setNewChatEmail] = useState('');
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false);
  const [isModalDelete, setModalDelete] = useState(false);
  const [isModalImageVisible, setModalImageVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const { showActionSheetWithOptions } = useActionSheet();
  const flatListRef = useRef<FlatList>(null);

  const imagesInChat = messages.filter(msg => msg.image);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, activeChatId]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Could not pick image');
    }
  };

  const handleOpenImage = (clickedImageUri: string | null | undefined) => {
    if (!clickedImageUri) return;

    const index = imagesInChat.findIndex(img => img.image === clickedImageUri);
    if (index >= 0) {
      setCurrentImageIndex(index);
      setImageViewerVisible(true);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < imagesInChat.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  const handleSend = async () => {
    if (!messageText.trim() && !selectedImage) return;

    try {
      if (editingMessage) {
        await updateMessage(editingMessage.id, messageText.trim());
        setEditingMessage(null);
      } else {
        await addMessage(messageText.trim(), selectedImage);
      }
      setMessageText('');
      setSelectedImage(null);
    } catch (error) {
      console.error("Send error:", error);
      Alert.alert("Error", "Could not send message.");
    }
  };

  const handleStartNewChat = async () => {
    if (!newChatEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    try {
      await startChat(newChatEmail.trim());
      setNewChatEmail('');
      setIsNewChatModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Could not start chat. Check the email.');
    }
  };

  const handleEdit = (msg: Message) => {
    setEditingMessage(msg);
    setMessageText(msg.text ?? "");
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderEmail === currentUser?.email;
    const userColor = getUserColor(item.username);

    const isStarred = item.starredBy && currentUser?.email && item.starredBy.includes(currentUser.email);

    return (
      <Pressable
        onLongPress={() => {
          if (!isOwnMessage) {
            const options = ["Star", "Cancel"];
            showActionSheetWithOptions({ options, cancelButtonIndex: 1 }, (btnIndex) => {
              if (btnIndex === 0) toggleStarMessage(item.id, item.starredBy || []);
            });
            return;
          }
          const options = ["Edit", "Star", "Delete", "Cancel"];
          showActionSheetWithOptions(
            { options, destructiveButtonIndex: 2, cancelButtonIndex: 3 },
            (buttonIndex) => {
              if (buttonIndex === 0) handleEdit(item);
              else if (buttonIndex === 1) toggleStarMessage(item.id, item.starredBy || []);
              else if (buttonIndex === 2) {
                setSelectedMessage(item);
                setModalDelete(true);
              }
            }
          );
        }}
      >
        <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
          {!isOwnMessage && (
            <View style={[styles.avatarSmall, { backgroundColor: userColor }]}>
              <Text style={styles.avatarTextSmall}>{item.username ? item.username[0].toUpperCase() : '?'}</Text>
            </View>
          )}

          <View style={[styles.bubble, isOwnMessage && styles.ownBubble]}>
            <View style={isOwnMessage ? styles.ownBubbleColor : styles.otherBubbleContent}>
              {!isOwnMessage && <Text style={[styles.username, { color: userColor }]}>{item.username}</Text>}

              {item.image && (
                <TouchableOpacity onPress={() => handleOpenImage(item.image)} activeOpacity={0.9}>
                  <Image
                    source={{ uri: item.image }}
                    style={[
                      styles.imageMessage,
                      isOwnMessage && styles.imageMessageOwn,
                    ]}
                  />
                </TouchableOpacity>
              )}

              {item.text && (
                <Text style={isOwnMessage ? styles.messageTextOwn : styles.messageText}>
                  {item.text}
                </Text>
              )}

              <View style={styles.footerRow}>
                {item.isUpdate && <Text style={styles.updateMessage}>Edited</Text>}
                {isStarred && <Ionicons name="star" size={14} color="#FFD700" style={styles.starIcon} />}
                <Text style={isOwnMessage ? styles.timestampOwn : styles.timestamp}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  if (!activeChatId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity onPress={() => setIsNewChatModalVisible(true)} style={styles.newChatButton}>
            <Ionicons name="create-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatListItem
              chat={item}
              currentUserEmail={currentUser?.email || ''}
              onPress={() => openChat(item.id)}
            />
          )}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No chats yet. Start one!</Text>
            </View>
          }
        />

        <Modal visible={isNewChatModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Message</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter user email..."
                placeholderTextColor="#999"
                value={newChatEmail}
                onChangeText={setNewChatEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setIsNewChatModalVisible(false)}>
                  <Text style={styles.modalButtonCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStartNewChat}>
                  <Text style={styles.modalButtonConfirm}>Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }
  
  const currentChat = chats.find(c => c.id === activeChatId);
  const otherParticipant = currentChat?.participants.find(p => p !== currentUser?.email) || 'Chat';
  const chatTitle = otherParticipant.split('@')[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => openChat(null)} style={{ marginRight: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{chatTitle}</Text>
            <Text style={styles.headerSubtitle}>{messages.length} messages</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          {selectedImage && (
            <View style={styles.previewContainer}>
              <TouchableOpacity onPress={() => setModalImageVisible(true)}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.removePreviewButton} onPress={removeSelectedImage}>
                <Ionicons name="close-circle" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />

            <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
              <Ionicons name="camera-outline" size={30} color="#9CA3AF" />
            </TouchableOpacity>

          </View>

          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim() && !selectedImage) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim() && !selectedImage}
          >
            <LinearGradient
              colors={(messageText.trim() || selectedImage) ? ['#5B7CFA', '#5B7CFA'] : ['#444444', '#888888']}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={isModalDelete} transparent animationType="fade" onRequestClose={() => setModalDelete(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: '#FFF' }]}>Delete Message?</Text>
            <Text style={{ marginBottom: 20, color: "#AAA" }}>Are you sure you want to delete this message?</Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 20 }}>
              <TouchableOpacity onPress={() => setModalDelete(false)}>
                <Text style={{ fontSize: 16, color: "#CCCCCC" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                if (selectedMessage) await deleteMessage(selectedMessage.id);
                setModalDelete(false);
              }}>
                <Text style={{ fontSize: 16, color: "red", fontWeight: "600" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isModalImageVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalImageVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setModalImageVisible(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={isImageViewerVisible}
        transparent={true}
        onRequestClose={() => setImageViewerVisible(false)}
        animationType="fade"
      >
        <View style={styles.galleryContainer}>

          <TouchableOpacity
            style={styles.galleryCloseButton}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          <View style={styles.galleryContent}>
            {currentImageIndex > 0 ? (
              <TouchableOpacity onPress={handlePrevImage} style={styles.navButton}>
                <Ionicons name="chevron-back" size={40} color="white" />
              </TouchableOpacity>
            ) : (
              <View style={styles.navButton} />
            )}

            <Image
              source={{ uri: imagesInChat[currentImageIndex]?.image || "" }}
              style={styles.galleryImage}
              resizeMode="contain"
            />

            {currentImageIndex < imagesInChat.length - 1 ? (
              <TouchableOpacity onPress={handleNextImage} style={styles.navButton}>
                <Ionicons name="chevron-forward" size={40} color="white" />
              </TouchableOpacity>
            ) : (
              <View style={styles.navButton} />
            )}
          </View>

          <Text style={styles.pageIndicator}>
            {currentImageIndex + 1} / {imagesInChat.length}
          </Text>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#000066',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: '#F3E8FF', marginTop: 2 },
  newChatButton: { padding: 8 },
  chatContainer: { flex: 1 },
  messagesList: { padding: 16, paddingBottom: 8 },

  chatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFF'
  },
  chatListContent: { flex: 1 },
  chatListHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatListName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  chatListTime: { fontSize: 12, color: '#64748B' },
  chatListPreview: { fontSize: 14, color: '#64748B' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyStateText: { color: '#64748B', fontSize: 16 },

  messageContainer: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  ownMessageContainer: { flexDirection: 'row-reverse' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  avatarTextSmall: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

  bubble: { maxWidth: '75%', borderRadius: 16, overflow: 'hidden' },
  ownBubble: { borderBottomRightRadius: 4 },
  ownBubbleColor: { backgroundColor: '#5B7CFA', padding: 12, paddingHorizontal: 16 },
  otherBubbleContent: { backgroundColor: '#000066', padding: 12, paddingHorizontal: 16, borderBottomLeftRadius: 4 },

  username: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  messageText: { fontSize: 16, color: '#FFFFFF', lineHeight: 22 },
  messageTextOwn: { fontSize: 16, color: '#FFFFFF', lineHeight: 22 },

  imageMessage: { width: Dimensions.get("window").width * 0.3, height: Dimensions.get("window").height * 0.3, borderRadius: 12, marginBottom: 6, },
  cameraButton: { position: "absolute", right: 12, bottom: 10, marginRight: 8, marginVertical: 5, },
  imageMessageOwn: { alignSelf: "flex-end", },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  updateMessage: { fontSize: 10, color: '#BFDBFE', marginRight: 5 },
  starIcon: { marginRight: 5 },
  timestamp: { fontSize: 10, color: '#94A3B8' },
  timestampOwn: { fontSize: 10, color: '#E0E7FF' },

  inputContainer: {
    padding: 12,
    backgroundColor: '#000066',
    flexDirection: 'row',
    alignItems: 'flex-end'
  },

  previewContainer: {
    position: 'absolute',
    top: -110,
    left: 12,
    backgroundColor: '#000033',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5B7CFA',
    zIndex: 10,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePreviewButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },

  inputWrapper: {
    flex: 1,
    position: "relative",
    marginRight: 8,
  },
  input: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100, marginRight: 8, paddingRight: 42 },
  sendButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#000033', padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 16 },
  modalInput: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  modalButtonCancel: { color: '#AAA', fontSize: 16 },
  modalButtonConfirm: { color: '#5B7CFA', fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', },
  fullScreenImage: { width: '100%', height: '80%', },
  modalCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 10, },
  galleryContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '80%',
  },
  galleryImage: {
    flex: 1,
    height: '100%',
    marginHorizontal: 10,
  },
  navButton: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  galleryCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 20,
    padding: 10,
  },
  pageIndicator: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 40,
  }
});