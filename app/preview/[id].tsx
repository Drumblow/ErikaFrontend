import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  Text,
  Chip,
  Divider,
  FAB,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import { api } from '../../src/services/api';
import { Cronograma, Atividade } from '../../src/types';
import { Colors, Spacing, Shadows } from '../../src/constants/theme';
import { formatPeriod, formatDate, formatDiaSemana, getDaysInMonth } from '../../src/utils';

export default function PreviewCronogramaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [cronograma, setCronograma] = useState<Cronograma | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setCronograma(response.data);
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

  const handleGeneratePDF = async () => {
    if (!cronograma) return;
    
    setGeneratingPDF(true);
    try {
      // 1. Chamar a API do backend
      const response = await api.generatePDF(cronograma.id);

      if (response.success && response.data.pdfBase64) {
        const pdfName = `cronograma-${cronograma.mes}-${cronograma.ano}.pdf`;
        if (Platform.OS === 'web') {
          // Web: baixar o PDF via link
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${response.data.pdfBase64}`;
          link.download = pdfName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          Alert.alert('PDF Gerado', 'O PDF foi baixado para seu computador.');
        } else {
          // Mobile: salvar e compartilhar
          const pdfUri = FileSystem.documentDirectory + pdfName;
          await FileSystem.writeAsStringAsync(pdfUri, response.data.pdfBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(pdfUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Cronograma ${formatPeriod(cronograma.mes, cronograma.ano)}`,
            });
          } else {
            Alert.alert('PDF Salvo', `O arquivo foi salvo em: ${pdfUri}`);
          }
        }
      } else {
        throw new Error(response.message || 'A API não retornou um PDF válido.');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      const message = error instanceof Error ? error.message : 'Tente novamente.';
      Alert.alert('Erro ao Gerar PDF', `Não foi possível gerar o relatório. ${message}`);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleShare = async () => {
    if (!cronograma) return;
    
    try {
      const shareContent = `
Cronograma UBSF - ${formatPeriod(cronograma.mes, cronograma.ano)}

UBSF: ${cronograma.nomeUBSF || 'Não informado'}
Enfermeiro(a): ${cronograma.enfermeiro || 'Não informado'}
Médico(a): ${cronograma.medico || 'Não informado'}
Total de Atividades: ${cronograma.atividades?.length || 0}

Gerado pelo App Cronograma UBSF
      `;
      
      await Share.share({
        message: shareContent,
        title: `Cronograma ${formatPeriod(cronograma.mes, cronograma.ano)}`,
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
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

  const atividades = cronograma.atividades || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.title}>
              {formatPeriod(cronograma.mes, cronograma.ano)}
            </Title>
            
            <View style={styles.statsContainer}>
              <Chip 
                icon="calendar-check" 
                style={styles.statsChip}
                textStyle={styles.statsChipText}
              >
                {atividades.length} atividades
              </Chip>
            </View>
            
            <Divider style={styles.divider} />
            
            {cronograma.nomeUBSF && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>{cronograma.nomeUBSF}</Text>
              </View>
            )}
            
            {cronograma.enfermeiro && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>Enfermeiro: {cronograma.enfermeiro}</Text>
              </View>
            )}
            
            {cronograma.medico && (
              <View style={styles.infoRow}>
                <Ionicons name="medical-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>Médico: {cronograma.medico}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Atividades */}
        {atividades.length > 0 ? (
          <Card style={styles.atividadesCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Atividades Programadas</Title>
              
              {atividades.map((atividade, index) => (
                <View key={atividade.id} style={styles.atividadeItem}>
                  <View style={styles.atividadeHeader}>
                    <Text style={styles.atividadeData}>
                      {formatDate(atividade.data)}
                    </Text>
                    <Chip 
                      mode="outlined" 
                      style={styles.diaSemanaChip}
                      textStyle={styles.diaSemanaChipText}
                    >
                      {formatDiaSemana(atividade.diaSemana)}
                    </Chip>
                  </View>
                  <Text style={styles.atividadeDescricao}>
                    {atividade.descricao}
                  </Text>
                  {index < atividades.length - 1 && <Divider style={styles.atividadeDivider} />}
                </View>
              ))}
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Ionicons name="calendar-outline" size={48} color={Colors.text.disabled} />
              <Text style={styles.emptyTitle}>Nenhuma atividade programada</Text>
              <Text style={styles.emptySubtitle}>
                Adicione atividades para este cronograma
              </Text>
              <Button 
                mode="contained" 
                onPress={() => router.push(`/atividades/${cronograma.id}`)}
                style={styles.addButton}
              >
                Adicionar Atividades
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            mode="outlined"
            onPress={() => router.push(`/atividades/${cronograma.id}`)}
            style={styles.actionButton}
            icon="calendar-edit"
          >
            Gerenciar Atividades
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleShare}
            style={styles.actionButton}
            icon="share-variant"
          >
            Compartilhar
          </Button>
          
          <Button
            mode="contained"
            onPress={handleGeneratePDF}
            style={styles.actionButton}
            icon="file-pdf-box"
            loading={generatingPDF}
            disabled={generatingPDF}
          >
            {generatingPDF ? 'Gerando PDF...' : 'Gerar PDF'}
          </Button>
        </View>
      </ScrollView>
      
      <FAB
        icon="pencil"
        style={styles.fab}
        onPress={() => router.push(`/edit/${cronograma.id}`)}
        label="Editar"
      />
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
    paddingBottom: 100,
  },
  headerCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statsChip: {
    backgroundColor: Colors.primaryLight,
  },
  statsChipText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  divider: {
    marginVertical: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  atividadesCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  atividadeItem: {
    marginBottom: Spacing.md,
  },
  atividadeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  atividadeData: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  diaSemanaChip: {
    backgroundColor: Colors.secondaryLight,
  },
  diaSemanaChipText: {
    color: Colors.secondary,
    fontSize: 12,
  },
  atividadeDescricao: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  atividadeDivider: {
    marginTop: Spacing.md,
  },
  emptyCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.md,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  addButton: {
    marginTop: Spacing.lg,
  },
  actionContainer: {
    gap: Spacing.sm,
  },
  actionButton: {
    marginBottom: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: Spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.secondary,
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