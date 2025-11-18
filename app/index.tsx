import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useChatContext } from './contexts/ChatContext';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const { setCurrentUser, currentUser, isLoading } = useChatContext();
  const router = useRouter();

  // Auto-login if user exists
  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace('/(tabs)/chat');
    }
  }, [currentUser, isLoading]);

  const handleLogin = () => {
    if (username.trim()) {
      setCurrentUser({
        username: username.trim(),
        status: status.trim() || 'Available'
      });
      router.replace('/(tabs)/chat');
    }
  };

  // Show loading while checking for stored user
  if (isLoading) {
    return (
      <LinearGradient
        colors={['#000000', '#000066', '#0000FF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#000000', '#000066', '#0000FF']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.emoji}>💬</Text>
            <Text style={styles.title}>Chat App</Text>
            <Text style={styles.subtitle}>Connect and chat with friends!</Text>

            <View style={styles.card}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                returnKeyType="next"
              />

              <Text style={[styles.label, styles.labelMargin]}>Status</Text>
              <TextInput
                style={styles.input}
                placeholder="What's your status? (e.g., Available, Busy)"
                placeholderTextColor="#9CA3AF"
                value={status}
                onChangeText={setStatus}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  !username.trim() && styles.buttonDisabled,
                  { borderWidth: 2, borderColor: username.trim() ? '#000066' : '#444444' } // MODIFIED: Border for button
                ]}
                onPress={handleLogin}
                disabled={!username.trim()}
                activeOpacity={0.8}
              >
                {/* LinearGradient dihilangkan, diganti dengan View solid */}
                <View
                  style={[
                    styles.buttonSolid,
                    { backgroundColor: username.trim() ? '#000000' : '#222222' } // MODIFIED: Solid background color
                  ]}
                >
                  <Text style={[
                    styles.buttonText,
                    { color: username.trim() ? '#FFFFFF' : '#AAAAAA' } // MODIFIED: Text color
                  ]}>
                    Enter Chat Room
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    minHeight: height,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#CCCCCC',
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#000033',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  labelMargin: {
    marginTop: 16,
  },
  input: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000066',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  button: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonSolid: { // MODIFIED: New style for solid button background
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});