import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../src/constants/theme';
import { AuthProvider } from '../src/contexts/AuthContext';
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
              name="index" 
              options={{ 
                title: 'Cronogramas UBSF',
                headerLargeTitle: true,
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
              </Stack>
            </SnackbarProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}