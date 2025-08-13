import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Card, Title, Subheading } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../src/contexts/AuthContext';
import { Colors, Spacing, Shadows } from '../src/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
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
      Alert.alert('Erro de Login', 'As credenciais estão incorretas ou o usuário não existe.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    console.log('🧪 Iniciando login de teste...');
    setEmail('teste@exemplo.com');
    setPassword('123456');
    setLoading(true);
    try {
      await signIn('teste@exemplo.com', '123456');
      console.log('✅ Login de teste realizado com sucesso!');
    } catch (error) {
      console.error('❌ Erro no login de teste:', error);
      Alert.alert('Erro de Login de Teste', 'Falha no login de teste.');
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
                disabled={loading}
                style={styles.button}
              >
                Entrar
              </Button>
              
              <Button
                mode="outlined"
                onPress={handleTestLogin}
                loading={loading}
                disabled={loading}
                style={[styles.button, { marginTop: Spacing.sm }]}
              >
                🧪 Login de Teste
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