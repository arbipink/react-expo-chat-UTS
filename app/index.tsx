import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions,
  ActivityIndicator, Pressable, Alert
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useChatContext } from './contexts/ChatContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState(''); // Changed Username to Email
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, currentUser, isLoading } = useChatContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace('/(tabs)/chat');
    }
  }, [currentUser, isLoading]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    try {
      await login(email, password);
      // Status update is optional here since profile usually loads from DB
      router.replace('/(tabs)/chat');
    } catch (error: any) {
      console.log(error);
      Alert.alert('Login Failed', error.message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000066" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.emoji}>💬</Text>
            <Text style={styles.title}>Chat App</Text>
            <Text style={styles.subtitle}>Connect and chat with friends!</Text>

            <View style={styles.card}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, isFocused && styles.inputFocused]}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />

              <Text style={[styles.label, styles.labelMargin]}>Password</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={[styles.input, isFocused && styles.inputFocused]}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#64748B" />
                </Pressable>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  !email.trim() && styles.buttonDisabled,
                  { borderWidth: 2, borderColor: email.trim() ? '#000066' : '#444444' }
                ]}
                onPress={handleLogin}
                disabled={!email.trim()}
                activeOpacity={0.8}
              >
                <View style={[styles.buttonSolid, { backgroundColor: email.trim() ? '#0f307bff' : '#222222' }]}>
                  <Text style={[styles.buttonText, { color: email.trim() ? '#E5E7EB' : '#AAAAAA' }]}>
                    Enter Chat Room
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.signUpMargin}>
              <Text style={styles.signUpText_1}>Don't have an account yet?
                <Link href={'/signup'} style={styles.signUpText_2}> Sign Up Now!</Link>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (Keep your existing styles, they are fine)
  gradient: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#000066', fontSize: 18, marginTop: 16, fontWeight: '600' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, minHeight: height },
  content: { alignItems: 'center' },
  emoji: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#333739', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#333739', marginBottom: 40, textAlign: 'center' },
  card: { backgroundColor: '#5B7CFA', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400, elevation: 8 },
  label: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', marginBottom: 8 },
  labelMargin: { marginTop: 16 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16, fontSize: 16, color: '#333739' },
  inputFocused: { borderColor: '#2563EB', borderWidth: 2 },
  eyeIcon: { position: 'absolute', right: 14, top: '50%', transform: [{ translateY: -11 }] },
  button: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  buttonSolid: { paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 18, fontWeight: 'bold' },
  signUpMargin: { marginTop: 20 },
  signUpText_1: { fontSize: 14, color: '#333739', marginTop: 20, textAlign: 'center' },
  signUpText_2: { fontSize: 14, fontWeight: 'bold', color: '#0f307bff', marginTop: 20, textAlign: 'center' },
});