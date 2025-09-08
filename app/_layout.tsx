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

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const paperTheme = {
  colors: {
    primary: Colors.primary,
    secondary: Colors.secondary,
    surface: Colors.surface,
    background: Colors.background,
    error: Colors.error,
    onSurface: Colors.text.primary,
    onBackground: Colors.text.primary,
    // Cores adicionais necessárias para o Material Design 3
    primaryContainer: 'rgba(33, 150, 243, 0.12)', // primary com 12% opacity
    onPrimary: Colors.text.white,
    onPrimaryContainer: Colors.text.primary,
    secondaryContainer: 'rgba(76, 175, 80, 0.12)', // secondary com 12% opacity
    onSecondary: Colors.text.white,
    onSecondaryContainer: Colors.text.primary,
    tertiary: Colors.primary,
    onTertiary: Colors.text.white,
    tertiaryContainer: 'rgba(33, 150, 243, 0.12)',
    onTertiaryContainer: Colors.text.primary,
    surfaceVariant: '#F5F5F5',
    onSurfaceVariant: Colors.text.secondary,
    outline: 'rgba(117, 117, 117, 0.5)',
    shadow: '#000000',
    inverseSurface: Colors.text.primary,
    inverseOnSurface: Colors.surface,
    inversePrimary: Colors.primary,
    backdrop: 'rgba(0, 0, 0, 0.7)',
    surfaceDisabled: 'rgba(255, 255, 255, 0.6)',
    onSurfaceDisabled: 'rgba(33, 33, 33, 0.6)',
    errorContainer: 'rgba(244, 67, 54, 0.12)',
    onError: Colors.text.white,
    onErrorContainer: Colors.text.primary,
    // Propriedade elevation necessária para o Searchbar
    elevation: {
      level0: 'transparent',
      level1: 'rgba(255, 255, 255, 0.05)', // 5% opacity
      level2: 'rgba(255, 255, 255, 0.08)', // 8% opacity
      level3: 'rgba(255, 255, 255, 0.11)', // 11% opacity
      level4: 'rgba(255, 255, 255, 0.12)', // 12% opacity
      level5: 'rgba(255, 255, 255, 0.14)', // 14% opacity
    },
  },
};

// Componente interno que tem acesso ao contexto de autenticação
function RootLayoutNav() {
  const { user, token, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return; // Aguarda o carregamento da autenticação

    const inAuthGroup = segments.length > 0 && segments[0] === '(tabs)';
    const inAuthPages = segments.length > 0 && (segments[0] === 'login' || segments[0] === 'register');
    const inRootPage = !segments.length;

    console.log('🔍 Auth check:', { user: !!user, token: !!token, segments, inAuthGroup, inAuthPages, inRootPage });

    if (!token || !user) {
      // Usuário não autenticado - redirecionar para login
      if (inAuthGroup || inRootPage) {
        console.log('🚨 Redirecionando para login - usuário não autenticado');
        router.replace('/login');
      }
    } else {
      // Usuário autenticado - redirecionar para área protegida
      if (inAuthPages || inRootPage) {
        console.log('✅ Redirecionando para área protegida - usuário autenticado');
        router.replace('/(tabs)');
      }
    }
  }, [user, token, isLoading, segments]);

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
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="create" 
        options={{ 
          title: 'Novo Cronograma',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="edit/[id]" 
        options={{ 
          title: 'Editar Cronograma',
        }} 
      />
      <Stack.Screen 
        name="preview/[id]" 
        options={{ 
          title: 'Visualizar Cronograma',
        }} 
      />
      <Stack.Screen 
        name="atividades/[cronogramaId]" 
        options={{ 
          title: 'Atividades',
        }} 
      />
      <Stack.Screen 
        name="atividade/create/[cronogramaId]" 
        options={{ 
          title: 'Nova Atividade',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="atividade/edit/[id]" 
        options={{ 
          title: 'Editar Atividade',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Login',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Cadastro',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add custom fonts here if needed
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
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