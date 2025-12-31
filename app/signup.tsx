import React, { useState } from 'react';
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

export default function SignUpScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, isLoading } = useChatContext();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await register(email, password, username);
      Alert.alert('Success', 'Account created!');
      router.replace('/(tabs)/chat');
    } catch (error: any) {
      console.log(error);
      Alert.alert('Sign Up Failed', error.message);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000066" />
          <Text style={styles.loadingText}>Creating Account...</Text>
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.emoji}>💬</Text>
            <Text style={styles.title}>Chat App</Text>
            <Text style={styles.subtitle}>Sign up to have a chit-chat!</Text>

            <View style={styles.card}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, isFocused && styles.inputFocused]}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Enter your username"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                returnKeyType="next"
              />

              <Text style={[styles.label, styles.labelMargin]}>Email</Text>
              <TextInput
                style={[styles.input, isFocused && styles.inputFocused]}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
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
                  onSubmitEditing={handleSignUp}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#64748B"
                  />
                </Pressable>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  !username.trim() && styles.buttonDisabled,
                  { borderWidth: 2, borderColor: username.trim() ? '#000066' : '#444444' }
                ]}
                onPress={handleSignUp}
                disabled={!username.trim()}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.buttonSolid,
                    { backgroundColor: username.trim() ? '#0f307bff' : '#222222' }
                  ]}
                >
                  <Text style={[
                    styles.buttonText,
                    { color: username.trim() ? '#E5E7EB' : '#AAAAAA' }
                  ]}>
                    Sign Up
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.signInMargin}>
              <Text style={styles.signInText_1}>Already have an account?
                <Link href={'/'} style={styles.signInText_2}> Sign In Now!</Link>
              </Text>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1, },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  loadingText: { color: '#000066', fontSize: 18, marginTop: 16, fontWeight: '600', },
  container: { flex: 1, },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, minHeight: height, },
  content: { alignItems: 'center', },
  emoji: { fontSize: 80, marginBottom: 16, },
  title: { fontSize: 40, fontWeight: 'bold', color: '#333739', marginBottom: 8, },
  subtitle: { fontSize: 18, color: '#333739', marginBottom: 40, textAlign: 'center', },
  card: { backgroundColor: '#5B7CFA', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400, elevation: 8, },
  label: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', marginBottom: 8, },
  labelMargin: { marginTop: 16, },
  input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16, fontSize: 16, color: '#333739', },
  inputFocused: { borderColor: '#2563EB', borderWidth: 2, },
  eyeIcon: { position: 'absolute', right: 14, top: '50%', transform: [{ translateY: -11 }], },
  button: { marginTop: 24, borderRadius: 12, overflow: 'hidden', },
  buttonSolid: { paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', },
  buttonDisabled: { opacity: 0.6, },
  buttonText: { fontSize: 18, fontWeight: 'bold', },
  signInMargin: { marginTop: 20, },
  signInText_1: { fontSize: 14, color: '#333739', marginTop: 20, textAlign: 'center', },
  signInText_2: { fontSize: 14, fontWeight: 'bold', color: '#0f307bff', marginTop: 20, textAlign: 'center', },
});