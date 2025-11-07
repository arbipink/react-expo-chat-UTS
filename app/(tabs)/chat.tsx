import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useChatContext } from '../contexts/ChatContext';

export default function ChatScreen() {
  const [messageText, setMessageText] = useState('');
  const { currentUser, messages, addMessage, toggleStarMessage } = useChatContext();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim()) {
      addMessage(messageText.trim());
      setMessageText('');
    }
  };

  const getUserColor = (username: string) => {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.username === currentUser?.username;
    const userColor = getUserColor(item.username);

    return (
      <Pressable onLongPress={() => toggleStarMessage(item.id)}>
        <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
          {!isOwnMessage && (
            <View style={[styles.avatar, { backgroundColor: userColor }]}>
              <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
            </View>
          )}

          <View style={[styles.bubble, isOwnMessage && styles.ownBubble]}>
            {isOwnMessage ? (
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                style={styles.ownBubbleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.username}>{item.username}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: '#FCD34D' }]} />
                  <Text style={styles.statusTextOwn}>{item.status}</Text>
                </View>
                <Text style={styles.messageTextOwn}>{item.text}</Text>
                <View style={styles.footerRow}>
                  {item.isStarred && (
                    <Ionicons name="star" size={14} color="#F3E8FF" style={styles.starIcon} />
                  )}
                  <Text style={styles.timestampOwn}>
                    {new Date(item.timestamp || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.otherBubbleContent}>
                <Text style={[styles.username, { color: userColor }]}>{item.username}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: userColor }]} />
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
                <Text style={styles.messageText}>{item.text}</Text>
                <View style={styles.footerRow}>
                  {item.isStarred && (
                    <Ionicons name="star" size={14} color="#F59E0B" style={styles.starIcon} />
                  )}
                  <Text style={styles.timestamp}>
                    {new Date(item.timestamp || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {isOwnMessage && (
            <View style={[styles.avatar, { backgroundColor: userColor }]}>
              <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Chat Room</Text>
        <Text style={styles.headerSubtitle}>{messages.length} messages</Text>
      </LinearGradient>

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
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={messageText.trim() ? ['#8B5CF6', '#EC4899'] : ['#D1D5DB', '#9CA3AF']}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#F3E8FF',
    marginTop: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bubble: {
    maxWidth: '70%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  ownBubbleGradient: {
    padding: 12,
  },
  otherBubbleContent: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  statusTextOwn: {
    fontSize: 12,
    color: '#F3E8FF',
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  messageTextOwn: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  starIcon: {
    marginRight: 5,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  timestampOwn: {
    fontSize: 11,
    color: '#F3E8FF',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});