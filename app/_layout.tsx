import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../src/constants/theme';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { SnackbarProvider } from '../src/contexts/SnackbarContext';

// Impede o auto-esconder da tela de splash
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    // Esconde a tela de splash assim que a autenticação terminar
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    // Se estiver carregando, não faz nada. O redirecionamento ocorre após o carregamento.
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (user && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!user && !inAuthGroup) {
      router.replace('/login');
    }
  }, [user, isLoading, segments]);

  // Enquanto isLoading for true, a tela de splash permanecerá visível.
  // A Stack é renderizada imediatamente para evitar o erro de navegação.
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.text.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Cadastro', headerShown: false }} />
      <Stack.Screen name="create" options={{ title: 'Novo Cronograma', presentation: 'modal' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Editar Cronograma' }} />
      <Stack.Screen name="preview/[id]" options={{ title: 'Visualizar Cronograma' }} />
      <Stack.Screen name="atividades/[cronogramaId]" options={{ title: 'Atividades' }} />
      <Stack.Screen
        name="atividade/create/[cronogramaId]"
        options={{ title: 'Nova Atividade', presentation: 'modal' }}
      />
      <Stack.Screen
        name="atividade/edit/[id]"
        options={{ title: 'Editar Atividade', presentation: 'modal' }}
      />
    </Stack>
  );
}

const paperTheme = {
  colors: {
    primary: Colors.primary,
    onPrimary: Colors.text.white,
    primaryContainer: Colors.primaryLight,
    onPrimaryContainer: Colors.primaryDark,
    secondary: Colors.secondary,
    onSecondary: Colors.text.white,
    secondaryContainer: Colors.secondaryLight,
    onSecondaryContainer: Colors.secondaryDark,
    tertiary: Colors.accent,
    onTertiary: Colors.text.white,
    tertiaryContainer: '#FFE0B2',
    onTertiaryContainer: '#E65100',
    error: Colors.error,
    onError: Colors.text.white,
    errorContainer: '#FFEBEE',
    onErrorContainer: '#B71C1C',
    background: Colors.background,
    onBackground: Colors.text.primary,
    surface: Colors.surface,
    onSurface: Colors.text.primary,
    surfaceVariant: '#F5F5F5',
    onSurfaceVariant: Colors.text.secondary,
    outline: Colors.border,
    outlineVariant: Colors.divider,
    shadow: Colors.shadow,
    scrim: '#000000',
    inverseSurface: Colors.text.primary,
    inverseOnSurface: Colors.surface,
    inversePrimary: Colors.primaryLight,
    elevation: {
      level0: 'transparent',
      level1: Colors.surface,
      level2: '#F8F8F8',
      level3: '#F0F0F0',
      level4: '#EEEEEE',
      level5: '#E8E8E8',
    },
    surfaceDisabled: Colors.text.disabled,
    onSurfaceDisabled: Colors.text.hint,
    backdrop: 'rgba(0, 0, 0, 0.4)',
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add custom fonts here if needed
  });

  // Expo Router usa um Error Boundary para pegar erros na fase de renderização.
  // Se as fontes falharem ao carregar, ele vai lançar um erro.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Enquanto as fontes estiverem carregando, a tela de splash ficará visível
  // graças ao `SplashScreen.preventAutoHideAsync()`.
  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <AuthProvider>
            <SnackbarProvider>
              <StatusBar style="dark" backgroundColor={Colors.surface} />
              <RootLayoutNav />
            </SnackbarProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}