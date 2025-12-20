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
  ActivityIndicator,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useChatContext, User } from './contexts/ChatContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function SignUpScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading } = useChatContext();
  const router = useRouter();



  const handleSignUp = async () => {
    if (!username || !email || !password) {
      alert('Please fill in all fields');
    }

    if (password.length < 5) {
        alert('Password must be at least 5 characters');
        return;
    }

    try {
   
    const storedUsers = await AsyncStorage.getItem('users');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

    const userExist = users.find(
      u => u.username === username || u.email === email
    );

    if (userExist) {
      alert('Username or email is already taken, please choose another one.');
      return;
    }

    // User baru
    const newUser = {
      username: username.trim(),
      email: email.trim(),
      password,
      status: 'Available',
    };

    // Simpan
    users.push(newUser);
    await AsyncStorage.setItem('users', JSON.stringify(users));

    alert('Registration successful! You can now log in.');
    router.replace('/');

  } catch (error) {
    console.log(error);
    alert('Sign up failed, please try again.');
  }

  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      >
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
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
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
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#000066',
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
    color: '#333739',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#333739',
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#5B7CFA',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#484646ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  labelMargin: {
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333739',
  },
  inputFocused: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: [{ translateY: -11 }],
  },
  button: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonSolid: {
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
  signInMargin: {
    marginTop: 20,
  },
  signInText_1: {
    fontSize: 14,
    color: '#333739',
    marginTop: 20,
    textAlign: 'center',
  },
  signInText_2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f307bff',
    marginTop: 20,
    textAlign: 'center',
  },
});