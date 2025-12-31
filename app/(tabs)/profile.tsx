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
  Alert,
  SafeAreaView,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatContext } from '../contexts/ChatContext';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword as firebaseUpdatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';

const { height } = Dimensions.get('window');

export default function ProfileScreen() {
  const { currentUser, userProfile, logout } = useChatContext();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setStatus(userProfile.status || '');
    }
  }, [userProfile]);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  useEffect(() => {
    const basicInfoChanged =
      username !== userProfile?.username ||
      status !== userProfile?.status;
    const passwordAttempted = showChangePassword && (currentPassword !== '' || newPassword !== '');

    setHasChanges(basicInfoChanged || passwordAttempted);
  }, [username, status, userProfile, currentPassword, newPassword, showChangePassword]);

  const handleSave = async () => {
    if (!currentUser) return;

    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    try {
      if (showChangePassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          Alert.alert('Error', 'Please fill in all password fields');
          return;
        }

        if (newPassword.length < 6) {
          Alert.alert('Error', 'New password must be at least 6 characters');
          return;
        }

        if (newPassword !== confirmPassword) {
          Alert.alert('Error', 'New passwords do not match');
          return;
        }

        if (currentUser.email) {
          const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
          await reauthenticateWithCredential(currentUser, credential);
          await firebaseUpdatePassword(currentUser, newPassword);
        }
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        username: username.trim(),
        status: status.trim() || 'Available'
      });

      Alert.alert('Success', 'Profile updated successfully!');
      setHasChanges(false);
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Current password is incorrect');
      } else {
        Alert.alert('Error', 'Failed to save profile: ' + error.message);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        }
      ]
    );
  };

  const getUserColor = (name: string) => {
    const safeName = name || 'User';
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
    const hash = safeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const userColor = getUserColor(username || 'User');

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
            <View style={[styles.largeAvatar, { backgroundColor: userColor }]}>
              <Text style={styles.largeAvatarText}>
                {username ? username[0].toUpperCase() : '?'}
              </Text>
            </View>

            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Update your personal details</Text>

            <View style={styles.card}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, isFocused === 'username' && styles.inputFocused]}
                onFocus={() => setIsFocused('username')}
                onBlur={() => setIsFocused(null)}
                placeholder="Enter your username"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <Text style={[styles.label, styles.labelMargin]}>Status</Text>
              <TextInput
                style={[styles.input, isFocused === 'status' && styles.inputFocused]}
                onFocus={() => setIsFocused('status')}
                onBlur={() => setIsFocused(null)}
                placeholder="What's your status?"
                placeholderTextColor="#9CA3AF"
                value={status}
                onChangeText={setStatus}
              />

              <TouchableOpacity
                style={styles.togglePasswordRow}
                onPress={() => setShowChangePassword(!showChangePassword)}
              >
                <Text style={[styles.label, { marginBottom: 0, color: '#F8FAFC' }]}>
                  Security (Change Password)
                </Text>
                <Ionicons
                  name={showChangePassword ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#F8FAFC"
                />
              </TouchableOpacity>

              {showChangePassword && (
                <View style={styles.passwordSection}>

                  <Text style={styles.subLabel}>Current Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, isFocused === 'currPass' && styles.inputFocused]}
                      onFocus={() => setIsFocused('currPass')}
                      onBlur={() => setIsFocused(null)}
                      placeholder="Current password"
                      placeholderTextColor="#9CA3AF"
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showPasswordText}
                    />
                    <Pressable
                      style={styles.eyeIcon}
                      onPress={() => setShowPasswordText(!showPasswordText)}>
                      <Ionicons
                        name={showPasswordText ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#64748B"
                      />
                    </Pressable>
                  </View>

                  <Text style={[styles.subLabel, styles.labelMargin]}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, isFocused === 'newPass' && styles.inputFocused]}
                      onFocus={() => setIsFocused('newPass')}
                      onBlur={() => setIsFocused(null)}
                      placeholder="New password (min 6 chars)"
                      placeholderTextColor="#9CA3AF"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPasswordText}
                    />
                    <Pressable
                      style={styles.eyeIcon}
                      onPress={() => setShowPasswordText(!showPasswordText)}>
                      <Ionicons
                        name={showPasswordText ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#64748B"
                      />
                    </Pressable>
                  </View>

                  <Text style={[styles.subLabel, styles.labelMargin]}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, isFocused === 'confPass' && styles.inputFocused]}
                      onFocus={() => setIsFocused('confPass')}
                      onBlur={() => setIsFocused(null)}
                      placeholder="Confirm new password"
                      placeholderTextColor="#9CA3AF"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPasswordText}
                    />
                    <Pressable
                      style={styles.eyeIcon}
                      onPress={() => setShowPasswordText(!showPasswordText)}>
                      <Ionicons
                        name={showPasswordText ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#64748B"
                      />
                    </Pressable>
                  </View>
                </View>
              )}

              {hasChanges && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    { borderWidth: 2, borderColor: '#000066' }
                  ]}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.buttonSolid,
                      { backgroundColor: '#0f307bff' }
                    ]}
                  >
                    <Text style={[styles.buttonText, { color: '#E5E7EB' }]}>
                      Save Changes
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  { marginTop: hasChanges ? 16 : 24, borderWidth: 2, borderColor: '#EF4444' }
                ]}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.buttonSolid,
                    { backgroundColor: '#FEE2E2' }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                    <Text style={[styles.buttonText, { color: '#EF4444' }]}>
                      Logout
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Info Section */}
            <View style={styles.infoMargin}>
              <Ionicons name="information-circle-outline" size={16} color="#64748B" style={{ marginBottom: 4 }} />
              <Text style={styles.infoText}>
                Your profile is now synced online.{"\n"}
                Changing your password will affect your next login.
              </Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  largeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  largeAvatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333739',
    marginBottom: 8,
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
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E2E8F0',
    marginBottom: 6,
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
    width: '100%',
  },
  inputFocused: {
    borderColor: '#2563EB',
    borderWidth: 2,
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
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoMargin: {
    marginTop: 32,
    alignItems: 'center',
    opacity: 0.8,
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  togglePasswordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)'
  },
  passwordSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    zIndex: 10,
  }
});