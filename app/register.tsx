import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Subheading, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../src/contexts/AuthContext';
import { useSnackbar } from '../src/contexts/SnackbarContext';
import { Colors, Spacing, Shadows } from '../src/constants/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargo, setCargo] = useState('enfermeiro');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { showSnackbar } = useSnackbar();

  const handleRegister = async () => {
    if (!name || !email || !password || !cargo) {
      showSnackbar('Por favor, preencha todos os campos.', 'error');
      return;
    }

    setLoading(true);
    try {
      await signUp(name, email, password, cargo);
      showSnackbar('✅ Conta criada com sucesso! Bem-vindo!', 'success');
      
      // Pequeno delay para mostrar o feedback antes de redirecionar
      setTimeout(() => {
        router.replace('/');
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível criar a conta.';
      showSnackbar(`❌ ${errorMessage}`, 'error');
      console.error(error);
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
            <Title style={styles.title}>Crie sua Conta</Title>
            <Subheading style={styles.subtitle}>É rápido e fácil</Subheading>
          </View>

          <Card style={styles.card}>
            <Card.Content>
               <TextInput
                label="Nome Completo"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                autoCapitalize="words"
              />
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
              
              <View style={styles.cargoContainer}>
                <Subheading style={styles.cargoLabel}>Cargo:</Subheading>
                <SegmentedButtons
                  value={cargo}
                  onValueChange={setCargo}
                  buttons={[
                    {
                      value: 'enfermeiro',
                      label: 'Enfermeiro',
                    },
                    {
                      value: 'medico',
                      label: 'Médico',
                    },
                  ]}
                  style={styles.segmentedButtons}
                />
              </View>
              
              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                Cadastrar
              </Button>
            </Card.Content>
          </Card>
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
  cargoContainer: {
    marginBottom: Spacing.md,
  },
  cargoLabel: {
    marginBottom: Spacing.sm,
    color: Colors.text.primary,
  },
  segmentedButtons: {
    marginBottom: Spacing.md,
  },
  button: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
}); 