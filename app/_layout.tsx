import { Stack } from 'expo-router';
import { ChatProvider } from './contexts/ChatContext';
import { StatusBar } from 'expo-status-bar';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

export default function RootLayout() {
  return (
    <ActionSheetProvider>
      <ChatProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ChatProvider>
    </ActionSheetProvider>
  );
}
