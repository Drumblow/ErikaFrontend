import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, Title, Subheading } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../src/contexts/AuthContext';
import { useSnackbar } from '../src/contexts/SnackbarContext';
import { Colors, Spacing, Shadows } from '../src/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { showSnackbar } = useSnackbar();

  const handleLogin = async () => {
    if (!email || !password) {
      showSnackbar('Por favor, preencha seu email e senha.', 'error');
      return;
    }

    if (!email.includes('@')) {
      showSnackbar('Por favor, digite um email válido.', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Iniciando processo de login...');
      await signIn(email, password);
      console.log('✅ Login realizado com sucesso!');
      // O redirecionamento será tratado pelo RootLayout
    } catch (error) {
      console.error('❌ Erro no login:', error);
      
      let errorMessage = 'Ocorreu um erro inesperado. Tente novamente.';
      
      if (error instanceof Error) {
         const message = error.message.toLowerCase();
         
         if (message.includes('credenciais') || message.includes('inválidas') || message.includes('senha') || message.includes('email') || message.includes('incorret')) {
           errorMessage = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
         } else if (message.includes('usuário') || message.includes('user') || message.includes('não encontrado')) {
           errorMessage = 'Usuário não encontrado. Verifique seu email ou cadastre-se.';
         } else if (message.includes('rede') || message.includes('network') || message.includes('conexão')) {
           errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
         } else if (message.includes('servidor') || message.includes('server')) {
           errorMessage = 'Servidor temporariamente indisponível. Tente novamente em alguns minutos.';
         }
       }
      
       showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Title style={styles.title}>Bem-vindo!</Title>
            <Subheading style={styles.subtitle}>Faça login para continuar</Subheading>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                label="Senha"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry
              />
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading || !email || !password}
                style={styles.button}
              >
                Entrar
              </Button>
            </Card.Content>
          </Card>

          <View style={styles.footer}>
            <Link href="/register" asChild>
              <Button mode="text" disabled={loading}>
                Não tem uma conta? Cadastre-se
              </Button>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.text.secondary,
  },
  card: {
    ...Shadows.md,
  },
  input: {
    marginBottom: Spacing.md,
  },
  button: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  footer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
});