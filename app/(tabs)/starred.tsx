import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useChatContext } from '../contexts/ChatContext';

export default function StarredMessagesScreen() {
  const { currentUser, starredMessages, toggleStarMessage } = useChatContext();

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

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="star-outline" size={64} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>No Starred Messages</Text>
      <Text style={styles.emptySubtitle}>
        Long-press any message in the chat to star it.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F59E0B', '#FCD34D']} 
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Starred Messages</Text>
        <Text style={styles.headerSubtitle}>{starredMessages.length} messages</Text>
      </LinearGradient>

      <FlatList
        data={starredMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={ListEmptyComponent}
      />
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
    color: '#FFFBEB',
    marginTop: 4,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 500,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});