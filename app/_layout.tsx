import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '@/theme';
import { migrate } from '@/db/client';
import { rescheduleAll } from '@/lib/notifications';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect as useEffectRouter } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      migrate();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NotificationRouter />
        <ThemedStatusBar />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="project/edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="task/edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="task/[id]" />
          <Stack.Screen name="project/[id]" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStatusBar() {
  const { colors } = useTheme();
  return <StatusBar style={colors.bg === '#0E0F12' ? 'light' : 'dark'} />;
}

/** Notification tap → open Today; re-arm on app foreground/day change. */
function NotificationRouter() {
  const router = useRouter();
  useEffectRouter(() => {
    rescheduleAll();
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/');
    });
    return () => sub.remove();
  }, []);
  return null;
}
