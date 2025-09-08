import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  Menu,
  Divider,
  HelperText,
  ToggleButton,
  Portal,
  Dialog,
  Paragraph,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

import { api } from '../../../src/services/api';
import { Atividade, Cronograma, UpdateAtividadeData } from '../../../src/types';
import { Colors, Spacing, Shadows } from '../../../src/constants/theme';
import { DiaSemana, formatPeriod, getDaysInMonth, isValidDate, getDayName, getDiaSemanaEnum, formatDate, formatDateISO } from '../../../src/utils';
import { useSnackbar } from '../../../src/contexts/SnackbarContext';
import { AuthGuard } from '../../../src/components/AuthGuard';

const DIAS_SEMANA_OPTIONS: { label: string; value: DiaSemana }[] = [
  { label: 'Segunda - Manhã', value: 'SEGUNDA-MANHÃ' },
  { label: 'Segunda - Tarde', value: 'SEGUNDA-TARDE' },
  { label: 'Terça - Manhã', value: 'TERÇA-MANHÃ' },
  { label: 'Terça - Tarde', value: 'TERÇA-TARDE' },
  { label: 'Quarta - Manhã', value: 'QUARTA-MANHÃ' },
  { label: 'Quarta - Tarde', value: 'QUARTA-TARDE' },
  { label: 'Quinta - Manhã', value: 'QUINTA-MANHÃ' },
  { label: 'Quinta - Tarde', value: 'QUINTA-TARDE' },
  { label: 'Sexta - Manhã', value: 'SEXTA-MANHÃ' },
  { label: 'Sexta - Tarde', value: 'SEXTA-TARDE' },
  { label: 'Sábado - Manhã', value: 'SABADO-MANHÃ' },
  { label: 'Sábado - Tarde', value: 'SABADO-TARDE' },
];

function EditAtividadeScreen() {
  const { id, cronogramaId } = useLocalSearchParams<{ id: string; cronogramaId?: string }>();
  
  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [cronograma, setCronograma] = useState<Cronograma | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  // Form fields
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [periodo, setPeriodo] = useState<'MANHÃ' | 'TARDE'>('MANHÃ');
  const [descricao, setDescricao] = useState('');
  
  // UI state
  const [diasDoMes, setDiasDoMes] = useState<Date[]>([]);
  const [dayMenuVisible, setDayMenuVisible] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<{ data?: string; descricao?: string;}>({});

  // Dialog state for deletion confirmation
  const [dialogVisible, setDialogVisible] = useState(false);
  const showDialog = () => setDialogVisible(true);
  const hideDialog = () => setDialogVisible(false);

  const loadData = useCallback(async () => {
    try {
      if (!id) return;
      setLoading(true);

      let atividadeData: Atividade | null = null;

      // Tentar primeiro a rota aninhada quando cronogramaId estiver disponível
      if (cronogramaId) {
        try {
          const nestedResp = await api.getAtividadeNested(cronogramaId, id);
          if (nestedResp.success) {
            atividadeData = nestedResp.data;
          }
        } catch (nestedErr) {
          // Fallback: rota direta /api/atividades/:id
          try {
            const atividadeResponse = await api.getAtividade(id);
            if (atividadeResponse.success) {
              atividadeData = atividadeResponse.data;
            }
          } catch (primaryErr) {
            throw primaryErr;
          }
        }
      } else {
        // Sem cronogramaId, usar rota direta
        try {
          const atividadeResponse = await api.getAtividade(id);
          if (atividadeResponse.success) {
            atividadeData = atividadeResponse.data;
          }
        } catch (primaryErr) {
          throw primaryErr;
        }
      }

      if (!atividadeData) {
        setError('Atividade não encontrada.');
        return;
      }

      setAtividade(atividadeData);

      const cronogramaResponse = await api.getCronograma(atividadeData.cronogramaId);
      if (cronogramaResponse.success) {
        const cronogramaData = cronogramaResponse.data;
        setCronograma(cronogramaData);
        setDiasDoMes(getDaysInMonth(cronogramaData.mes, cronogramaData.ano));
        
        // Preencher formulário
        const date = new Date(atividadeData.data);
        date.setUTCHours(12);
        setSelectedDate(date);
        setPeriodo(atividadeData.diaSemana.includes('MANHÃ') ? 'MANHÃ' : 'TARDE');
        setDescricao(atividadeData.descricao);
      } else {
        setError(cronogramaResponse.message);
      }
    } catch (err) {
      setError('Erro ao carregar dados da atividade.');
    } finally {
      setLoading(false);
    }
  }, [id, cronogramaId]);

  useEffect(() => {
    loadData();
  }, [id, loadData]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!selectedDate) newErrors.data = 'Selecione um dia';
    if (!descricao.trim() || descricao.trim().length < 3) {
      newErrors.descricao = 'Descrição deve ter pelo menos 3 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedDate) return;
    
    setSaving(true);
    
    try {
      const atividadeData: UpdateAtividadeData = {
        data: formatDateISO(selectedDate),
        diaSemana: getDiaSemanaEnum(selectedDate, periodo),
        descricao: descricao.trim(),
      };
      
      try {
        const response = await api.updateAtividade(id!, atividadeData);
        if (response.success) {
          showSnackbar('Atividade atualizada com sucesso!', 'success');
          if (router.canGoBack()) router.back();
          else router.replace(`/atividades/${atividade?.cronogramaId ?? cronogramaId}`);
          return;
        } else {
          showSnackbar(response.message || 'Erro ao atualizar atividade', 'error');
          return;
        }
      } catch (primaryErr) {
        // Fallback para rota aninhada
        const nestedCronogramaId = (cronogramaId || atividade?.cronogramaId);
        if (!nestedCronogramaId) throw primaryErr;
        const nestedResp = await api.updateAtividadeNested(nestedCronogramaId as string, id!, atividadeData);
        if (nestedResp.success) {
          showSnackbar('Atividade atualizada com sucesso!', 'success');
          if (router.canGoBack()) router.back();
          else router.replace(`/atividades/${nestedCronogramaId}`);
        } else {
          showSnackbar(nestedResp.message || 'Erro ao atualizar atividade', 'error');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verifique sua conexão.';
      showSnackbar(`Erro ao atualizar a atividade: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Extract deletion logic into a function used by Dialog confirm action
  const confirmDeletion = async () => {
    if (!atividade) return;
    try {
      setSaving(true);
      try {
        await api.deleteAtividade(atividade.id);
      } catch (primaryErr) {
        const nestedCronogramaId = (cronogramaId || atividade.cronogramaId);
        if (!nestedCronogramaId) throw primaryErr;
        await api.deleteAtividadeNested(nestedCronogramaId as string, atividade.id);
      }

      hideDialog();
      showSnackbar('Atividade excluída com sucesso!', 'success');
      if (router.canGoBack()) router.back();
      else router.replace(`/atividades/${atividade.cronogramaId ?? cronogramaId}`);
    } catch (err) {
      hideDialog();
      showSnackbar('Não foi possível excluir a atividade.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Show dialog instead of native Alert
  const handleDelete = () => {
    if (!atividade) return;
    showDialog();
  };

  const getMinDate = (): Date => {
    if (!cronograma) return new Date();
    return new Date(cronograma.ano, cronograma.mes - 1, 1);
  };

  const getMaxDate = (): Date => {
    if (!cronograma) return new Date();
    const daysInMonth = getDaysInMonth(cronograma.mes, cronograma.ano).length;
    return new Date(cronograma.ano, cronograma.mes - 1, daysInMonth);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando atividade...</Text>
      </View>
    );
  }

  if (error || !atividade) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Erro ao carregar</Text>
          <Text style={styles.errorMessage}>{error || 'Atividade não encontrada'}</Text>
          <Button 
            mode="contained" 
            onPress={loadData}
            style={styles.retryButton}
          >
            Tentar Novamente
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        {cronograma && (
          <Card style={styles.headerCard}>
            <Card.Content>
              <Title style={styles.headerTitle}>Editar Atividade</Title>
              <Text style={styles.headerSubtitle}>
                {formatPeriod(cronograma.mes, cronograma.ano)}
              </Text>
              {cronograma.nomeUBSF && (
                <Text style={styles.headerUBSF}>{cronograma.nomeUBSF}</Text>
              )}
            </Card.Content>
          </Card>
        )}
        
        {/* Form */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.fieldLabel}>1. Selecione o dia *</Text>
            <Menu
              visible={dayMenuVisible}
              onDismiss={() => setDayMenuVisible(false)}
              anchor={
                <Button
                  onPress={() => setDayMenuVisible(true)}
                  mode="outlined"
                  icon="calendar"
                  style={[styles.selectButton, !!errors.data && { borderColor: Colors.error }]}
                  contentStyle={styles.selectButtonContent}
                  textColor={!!errors.data ? Colors.error : Colors.text.primary}
                >
                  {selectedDate 
                    ? `${formatDate(selectedDate)} - ${getDayName(selectedDate)}`
                    : 'Clique para selecionar um dia'}
                </Button>
              }
            >
              <ScrollView style={{ maxHeight: 300 }}>
                {diasDoMes.map((dia, index) => (
                  <React.Fragment key={dia.toISOString()}>
                    <Menu.Item
                      onPress={() => {
                        setSelectedDate(dia);
                        setDayMenuVisible(false);
                      }}
                      title={`${formatDate(dia)} - ${getDayName(dia)}`}
                    />
                    {index < diasDoMes.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </ScrollView>
            </Menu>
            {errors.data && <HelperText type="error" visible={!!errors.data}>{errors.data}</HelperText>}

            <Text style={styles.fieldLabel}>2. Selecione o período *</Text>
            <ToggleButton.Row
              onValueChange={value => setPeriodo(value as any)}
              value={periodo}
              style={styles.toggleRow}
            >
              <ToggleButton icon="weather-sunny" value="MANHÃ" style={styles.toggleButton} />
              <ToggleButton icon="weather-night" value="TARDE" style={styles.toggleButton} />
            </ToggleButton.Row>

            <Text style={styles.fieldLabel}>3. Descreva a atividade *</Text>
            <TextInput
              label="Descrição"
              value={descricao}
              onChangeText={setDescricao}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={4}
              error={!!errors.descricao}
            />
            {errors.descricao && <HelperText type="error" visible={!!errors.descricao}>{errors.descricao}</HelperText>}
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
            >
              Salvar Alterações
            </Button>
          </Card.Content>
        </Card>
        
        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.cancelButton}
            disabled={saving}
          >
            Cancelar
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleDelete}
            style={styles.deleteButton}
            textColor={Colors.error}
            disabled={saving}
          >
            Excluir
          </Button>
        </View>
      </ScrollView>
      {/* Deletion Confirmation Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Confirmar Exclusão</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {atividade && `Deseja realmente excluir a atividade "${atividade.descricao}"?`}
              {'\n\n'}Esta ação não pode ser desfeita.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog} disabled={saving}>Cancelar</Button>
            <Button onPress={confirmDeletion} textColor={Colors.error} disabled={saving}>Excluir</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      </SafeAreaView>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  headerCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 18,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  headerUBSF: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.surface,
    ...Shadows.md,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  selectButton: {
    justifyContent: 'center',
    paddingVertical: 8,
  },
  selectButtonContent: {
    justifyContent: 'flex-start',
  },
  toggleRow: {
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  toggleButton: {
    flex: 1,
  },
  input: {
    marginBottom: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
    borderColor: Colors.error,
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
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    marginTop: Spacing.md,
  },
});

export default function ProtectedEditAtividadeScreen() {
  return (
    <AuthGuard>
      <EditAtividadeScreen />
    </AuthGuard>
  );
}