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

function AuthGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    // Se ainda está autenticando, não fazemos nada até que se resolva.
    if (isLoading) {
      return;
    }

    const rootSegment = segments[0];
    const isAuthRoute = rootSegment === 'login' || rootSegment === 'register';

    // Se o usuário está logado e tenta acessar as rotas de login/cadastro,
    // o redirecionamos para a tela principal.
    if (user && isAuthRoute) {
      router.replace('/(tabs)');
    } 
    // Se o usuário NÃO está logado e tenta acessar qualquer rota que NÃO seja
    // de login/cadastro, o redirecionamos para a tela de login.
    else if (!user && !isAuthRoute) {
      router.replace('/login');
    }
  }, [user, isLoading, segments]);

  // Enquanto carrega, podemos mostrar a SplashScreen ou null para evitar piscar a tela
  return <Stack
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
              options={{ headerShown: false }}
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
            {/* A rota de index é removida pois (tabs) se torna a nova rota principal */}
          </Stack>;
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
              <AuthGuard />
            </SnackbarProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}