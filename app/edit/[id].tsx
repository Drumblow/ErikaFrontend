import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  HelperText,
  ActivityIndicator,
  Text,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../src/services/api';
import { Cronograma, UpdateCronogramaData } from '../../src/types';
import { Colors, Spacing, Shadows } from '../../src/constants/theme';
import { formatPeriod } from '../../src/utils';
import { useSnackbar } from '../../src/contexts/SnackbarContext';
import { AuthGuard } from '../../src/components/AuthGuard';

interface FormData {
  nomeUBSF: string;
  enfermeiro: string;
  medico: string;
}

interface FormErrors {
  nomeUBSF?: string;
  enfermeiro?: string;
  medico?: string;
}

function EditCronogramaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [cronograma, setCronograma] = useState<Cronograma | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nomeUBSF: '',
    enfermeiro: '',
    medico: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (id) {
      loadCronograma();
    }
  }, [id]);

  const loadCronograma = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getCronograma(id!);
      
      if (response.success) {
        const cronogramaData = response.data;
        setCronograma(cronogramaData);
        setFormData({
          nomeUBSF: cronogramaData.nomeUBSF || '',
          enfermeiro: cronogramaData.enfermeiro || '',
          medico: cronogramaData.medico || '',
        });
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Erro ao carregar cronograma:', err);
      setError('Erro ao carregar cronograma. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.nomeUBSF.trim().length < 3) {
      newErrors.nomeUBSF = 'Nome da UBSF deve ter pelo menos 3 caracteres';
    }

    if (formData.enfermeiro.trim().length < 3) {
      newErrors.enfermeiro = 'Nome do enfermeiro deve ter pelo menos 3 caracteres';
    }

    if (formData.medico.trim().length < 3) {
      newErrors.medico = 'Nome do médico deve ter pelo menos 3 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      const updateData: UpdateCronogramaData = {
        nomeUBSF: formData.nomeUBSF.trim(),
        enfermeiro: formData.enfermeiro.trim(),
        medico: formData.medico.trim(),
      };

      const response = await api.updateCronograma(id!, updateData);
      
      if (response.success) {
        showSnackbar('Cronograma atualizado com sucesso!', 'success');
        router.push('/');
      } else {
        showSnackbar(response.message || 'Erro ao atualizar cronograma', 'error');
      }
    } catch (error) {
      console.error('Erro ao atualizar cronograma:', error);
      const errorMessage = error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.';
      showSnackbar(`Erro ao atualizar o cronograma: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando cronograma...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Erro ao carregar</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={loadCronograma}
            style={styles.retryButton}
          >
            Tentar Novamente
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!cronograma) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={64} color={Colors.text.disabled} />
          <Text style={styles.errorTitle}>Cronograma não encontrado</Text>
          <Button 
            mode="contained" 
            onPress={() => router.back()}
            style={styles.retryButton}
          >
            Voltar
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>Editar Cronograma</Title>
              
              {/* Período (não editável) */}
              <View style={styles.periodContainer}>
                <Text style={styles.periodLabel}>Período:</Text>
                <Text style={styles.periodValue}>
                  {formatPeriod(cronograma.mes, cronograma.ano)}
                </Text>
              </View>

              {/* Nome da UBSF */}
              <TextInput
                label="Nome da UBSF *"
                value={formData.nomeUBSF}
                onChangeText={(text) => updateFormData('nomeUBSF', text)}
                mode="outlined"
                style={styles.input}
                error={!!errors.nomeUBSF}
                placeholder="Ex: UBSF Centro"
              />
              {errors.nomeUBSF && (
                <HelperText type="error" visible={!!errors.nomeUBSF}>
                  {errors.nomeUBSF}
                </HelperText>
              )}

              {/* Enfermeiro */}
              <TextInput
                label="Nome do Enfermeiro *"
                value={formData.enfermeiro}
                onChangeText={(text) => updateFormData('enfermeiro', text)}
                mode="outlined"
                style={styles.input}
                error={!!errors.enfermeiro}
                placeholder="Ex: Maria Silva Santos"
              />
              {errors.enfermeiro && (
                <HelperText type="error" visible={!!errors.enfermeiro}>
                  {errors.enfermeiro}
                </HelperText>
              )}

              {/* Médico */}
              <TextInput
                label="Nome do Médico *"
                value={formData.medico}
                onChangeText={(text) => updateFormData('medico', text)}
                mode="outlined"
                style={styles.input}
                error={!!errors.medico}
                placeholder="Ex: Dr. João Carlos Oliveira"
              />
              {errors.medico && (
                <HelperText type="error" visible={!!errors.medico}>
                  {errors.medico}
                </HelperText>
              )}
            </Card.Content>
          </Card>
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => router.push('/')}
            style={styles.cancelButton}
            disabled={saving}
          >
            Cancelar
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={saving}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    ...Shadows.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  periodValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  input: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  submitButton: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.error,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: Spacing.lg,
  },
});

export default function ProtectedEditCronogramaScreen() {
  return (
    <AuthGuard>
      <EditCronogramaScreen />
    </AuthGuard>
  );
}