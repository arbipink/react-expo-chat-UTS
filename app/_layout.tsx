import { Stack } from 'expo-router';
import { ChatProvider } from './contexts/ChatContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <ChatProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ChatProvider>
  );
}
