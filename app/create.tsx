import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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
} from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNPickerSelect from 'react-native-picker-select';

import { api } from '../src/services/api';
import { CreateCronogramaData, MESES } from '../src/types';
import { Colors, Spacing, Shadows } from '../src/constants/theme';
import { useSnackbar } from '../src/contexts/SnackbarContext';

interface FormData {
  mes: number | undefined;
  ano: number;
  nomeUBSF: string;
  enfermeiro: string;
  medico: string;
}

interface FormErrors {
  mes?: string;
  ano?: string;
  nomeUBSF?: string;
  enfermeiro?: string;
  medico?: string;
}

export default function CreateCronogramaScreen() {
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState<FormData>({
    mes: undefined,
    ano: currentYear,
    nomeUBSF: '',
    enfermeiro: '',
    medico: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.mes) {
      newErrors.mes = 'Selecione um mês';
    }

    if (!formData.ano || formData.ano < 2020 || formData.ano > 2030) {
      newErrors.ano = 'Ano deve estar entre 2020 e 2030';
    }

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

  const resetForm = () => {
    setFormData({
      mes: undefined,
      ano: currentYear,
      nomeUBSF: '',
      enfermeiro: '',
      medico: '',
    });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const createData: CreateCronogramaData = {
        mes: formData.mes!,
        ano: formData.ano,
        nomeUBSF: formData.nomeUBSF.trim(),
        enfermeiro: formData.enfermeiro.trim(),
        medico: formData.medico.trim(),
      };

      const response = await api.createCronograma(createData);
      
      if (response.success) {
        showSnackbar('Cronograma criado com sucesso!', 'success');
        router.push(`/atividades/${response.data.id}`);
      } else {
        showSnackbar(response.message || 'Erro ao criar cronograma', 'error');
      }
    } catch (error) {
      console.error('Erro ao criar cronograma:', error);
      const errorMessage = error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.';
      showSnackbar(`Erro ao criar o cronograma: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const yearOptions = Array.from({ length: 11 }, (_, i) => ({
    label: String(currentYear - 5 + i),
    value: currentYear - 5 + i,
  }));

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
              <Title style={styles.title}>Novo Cronograma</Title>
              
              {/* Período */}
              <View style={styles.periodContainer}>
                <View style={styles.periodField}>
                  <Title style={styles.fieldTitle}>Mês *</Title>
                  <View style={styles.pickerContainer}>
                    <RNPickerSelect
                      onValueChange={(value) => updateFormData('mes', value)}
                      items={MESES.map(mes => ({
                        label: mes.label,
                        value: mes.value,
                      }))}
                      value={formData.mes}
                      placeholder={{
                        label: 'Selecione o mês...',
                        value: undefined,
                      }}
                      style={pickerSelectStyles}
                    />
                  </View>
                  {errors.mes && (
                    <HelperText type="error" visible={!!errors.mes}>
                      {errors.mes}
                    </HelperText>
                  )}
                </View>
                
                <View style={styles.periodField}>
                  <Title style={styles.fieldTitle}>Ano *</Title>
                  <View style={styles.pickerContainer}>
                    <RNPickerSelect
                      onValueChange={(value) => updateFormData('ano', value)}
                      items={yearOptions}
                      value={formData.ano}
                      style={pickerSelectStyles}
                    />
                  </View>
                  {errors.ano && (
                    <HelperText type="error" visible={!!errors.ano}>
                      {errors.ano}
                    </HelperText>
                  )}
                </View>
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
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar Cronograma'}
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
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  periodField: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  fieldTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    backgroundColor: Colors.surface,
    minHeight: 56,
    justifyContent: 'center',
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
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: Colors.text.primary,
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.text.primary,
    paddingRight: 30,
  },
  placeholder: {
    color: Colors.text.hint,
  },
});