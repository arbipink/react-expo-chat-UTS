import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Image,
  Dimensions
} from 'react-native';
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

    const isStarred = item.starredBy && currentUser && item.starredBy.includes(currentUser.email);

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
              <View style={styles.ownBubbleColor}>
                <Text style={styles.username}>{item.username}</Text>

                {item.image && (
                  <Image
                    source={{ uri: item.image }}
                    style={[styles.imageMessage, styles.imageMessageOwn]}
                  />
                )}

                {item.text ? (
                  <Text style={styles.messageTextOwn}>{item.text}</Text>
                ) : null}

                <View style={styles.footerRow}>
                  {isStarred && (
                    <Ionicons name="star" size={14} color="#FFD700" style={styles.starIcon} />
                  )}
                  <Text style={styles.timestampOwn}>
                    {new Date(item.timestamp || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.otherBubbleContent}>
                <Text style={[styles.username, { color: userColor }]}>{item.username}</Text>

                {item.image && (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.imageMessage}
                  />
                )}

                {item.text ? (
                  <Text style={styles.messageText}>{item.text}</Text>
                ) : null}

                <View style={styles.footerRow}>
                  {isStarred && (
                    <Ionicons name="star" size={14} color="#FFD700" style={styles.starIcon} />
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
      <Ionicons name="star-outline" size={64} color="#000066" />
      <Text style={styles.emptyTitle}>No Starred Messages</Text>
      <Text style={styles.emptySubtitle}>
        Long-press any message in the chat to star it.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Starred Messages</Text>
        <Text style={styles.headerSubtitle}>{starredMessages.length} messages</Text>
      </View>

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
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#000066',
    paddingTop: 40,
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
  ownBubbleColor: {
    backgroundColor: '#5B7CFA',
    padding: 18,
  },
  otherBubbleContent: {
    backgroundColor: '#000066',
    padding: 18,
    borderBottomLeftRadius: 4,
    shadowColor: '#484646ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
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
    color: '#888888',
    fontStyle: 'italic',
  },
  statusTextOwn: {
    fontSize: 12,
    color: '#F3E8FF',
    fontStyle: 'italic',
  },

  imageMessage: {
    width: Dimensions.get("window").width * 0.2,
    height: Dimensions.get("window").height * 0.2,
    borderRadius: 12,
    marginBottom: 6,
  },
  imageMessageOwn: {
    alignSelf: "flex-end",
  },

  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
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
    color: '#444444',
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
    color: '#000066',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 8,
    textAlign: 'center',
  },
});