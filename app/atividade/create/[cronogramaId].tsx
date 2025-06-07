import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  HelperText,
  ToggleButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../../src/services/api';
import { Cronograma, CreateAtividadeData } from '../../../src/types';
import { Colors, Spacing } from '../../../src/constants/theme';
import { formatPeriod, getDaysInMonth, getDayName, getDiaSemanaEnum, formatDate } from '../../../src/utils';
import { useSnackbar } from '../../../src/contexts/SnackbarContext';

export default function CreateAtividadeScreen() {
  const { cronogramaId } = useLocalSearchParams<{ cronogramaId: string }>();
  
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

  useEffect(() => {
    const loadCronograma = async () => {
      try {
        setLoading(true);
        const response = await api.getCronograma(cronogramaId!);
        if (response.success) {
          const data = response.data;
          setCronograma(data);
          setDiasDoMes(getDaysInMonth(data.mes, data.ano));
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError('Erro ao carregar cronograma.');
      } finally {
        setLoading(false);
      }
    };
    loadCronograma();
  }, [cronogramaId]);

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
      const atividadeData: CreateAtividadeData = {
        cronogramaId: cronogramaId!,
        data: selectedDate.toISOString().split('T')[0],
        diaSemana: getDiaSemanaEnum(selectedDate, periodo),
        descricao: descricao.trim(),
      };
      
      const response = await api.createAtividade(cronogramaId!, atividadeData);
      
      if (response.success) {
        showSnackbar('Atividade criada com sucesso!', 'success');
        if (router.canGoBack()) router.back();
        else router.replace(`/atividades/${cronogramaId}`);
      } else {
        showSnackbar(response.message || 'Erro ao criar atividade', 'error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verifique sua conexão.';
      showSnackbar(`Erro ao criar a atividade: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator /></View>;
  if (error) return <View style={styles.errorContainer}><Text>{error}</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cronograma && (
          <Card style={styles.headerCard}>
            <Card.Content>
              <Title style={styles.headerTitle}>Nova Atividade</Title>
              <Text style={styles.headerSubtitle}>{formatPeriod(cronograma.mes, cronograma.ano)}</Text>
            </Card.Content>
          </Card>
        )}
        
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
            {errors.descricao && <HelperText type="error">{errors.descricao}</HelperText>}
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
            >
              Salvar Atividade
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.md },
  headerCard: { marginBottom: Spacing.md },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 18, color: Colors.text.secondary },
  formCard: { },
  fieldLabel: { fontSize: 16, fontWeight: '600', marginTop: Spacing.lg, marginBottom: Spacing.md },
  selectButton: {
    justifyContent: 'center',
    paddingVertical: 8,
  },
  selectButtonContent: {
    justifyContent: 'flex-start',
  },
  toggleRow: { justifyContent: 'center', marginBottom: Spacing.md },
  toggleButton: { flex: 1 },
  input: { marginBottom: Spacing.md },
  saveButton: { marginTop: Spacing.lg, paddingVertical: Spacing.sm },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
});