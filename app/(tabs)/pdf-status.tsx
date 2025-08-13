import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Title, Card, ActivityIndicator, Chip, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { api } from '../../src/services/api';
import { useSnackbar } from '../../src/contexts/SnackbarContext';
import { Colors, Spacing } from '../../src/constants/theme';

interface PdfStatusData {
  puppeteer: {
    status: string;
    rota: string;
    otimizado_para: string;
  };
  pdfshift: {
    status: string;
    rota: string;
  };
  migracao_concluida: boolean;
}

export default function PdfStatusScreen() {
  const [loading, setLoading] = useState(true);
  const [pdfStatus, setPdfStatus] = useState<PdfStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const loadPdfStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPdfStatus();
      
      if (response.success) {
        setPdfStatus(response.data);
      } else {
        setError(response.message || 'Erro ao carregar status do PDF');
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar status do PDF:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro de conexão';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPdfStatus();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo':
        return Colors.success;
      case 'legado':
        return Colors.warning;
      default:
        return Colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo':
        return 'check-circle';
      case 'legado':
        return 'clock';
      default:
        return 'help-circle';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Carregando status do PDF...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={loadPdfStatus} style={styles.retryButton}>
            Tentar Novamente
          </Button>
          <Button mode="outlined" onPress={() => router.back()} style={styles.backButton}>
            Voltar
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Title style={styles.title}>Status do Sistema PDF</Title>
        
        {pdfStatus && (
          <>
            {/* Status da Migração */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Status da Migração</Title>
                <View style={styles.statusRow}>
                  <Chip 
                    icon={pdfStatus.migracao_concluida ? 'check-circle' : 'clock'}
                    style={[
                      styles.statusChip,
                      { backgroundColor: pdfStatus.migracao_concluida ? Colors.success : Colors.warning }
                    ]}
                    textStyle={{ color: 'white' }}
                  >
                    {pdfStatus.migracao_concluida ? 'Concluída' : 'Em Andamento'}
                  </Chip>
                </View>
              </Card.Content>
            </Card>

            {/* Status do Puppeteer */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Puppeteer (Atual)</Title>
                <View style={styles.statusRow}>
                  <Text style={styles.label}>Status:</Text>
                  <Chip 
                    icon={getStatusIcon(pdfStatus.puppeteer.status)}
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(pdfStatus.puppeteer.status) }
                    ]}
                    textStyle={{ color: 'white' }}
                  >
                    {pdfStatus.puppeteer.status}
                  </Chip>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Rota:</Text>
                  <Text style={styles.value}>{pdfStatus.puppeteer.rota}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Otimizado para:</Text>
                  <Text style={styles.value}>{pdfStatus.puppeteer.otimizado_para}</Text>
                </View>
              </Card.Content>
            </Card>

            {/* Status do PDFShift */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>PDFShift (Legado)</Title>
                <View style={styles.statusRow}>
                  <Text style={styles.label}>Status:</Text>
                  <Chip 
                    icon={getStatusIcon(pdfStatus.pdfshift.status)}
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(pdfStatus.pdfshift.status) }
                    ]}
                    textStyle={{ color: 'white' }}
                  >
                    {pdfStatus.pdfshift.status}
                  </Chip>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Rota:</Text>
                  <Text style={styles.value}>{pdfStatus.pdfshift.rota}</Text>
                </View>
              </Card.Content>
            </Card>

            {/* Informações Adicionais */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Informações</Title>
                <Text style={styles.infoText}>
                  • O sistema atual utiliza Puppeteer para geração de PDFs{"\n"}
                  • PDFShift é mantido como sistema legado{"\n"}
                  • A migração foi concluída com sucesso{"\n"}
                  • Todos os novos PDFs são gerados via Puppeteer
                </Text>
              </Card.Content>
            </Card>
          </>
        )}

        <View style={styles.buttonContainer}>
          <Button 
            mode="outlined" 
            onPress={() => router.back()} 
            style={styles.backButton}
            icon="arrow-left"
          >
            Voltar
          </Button>
          
          <Button 
            mode="contained" 
            onPress={loadPdfStatus} 
            style={styles.refreshButton}
            icon="refresh"
          >
            Atualizar
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    color: Colors.error,
  },
  title: {
    fontSize: 24,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: Spacing.sm,
    minWidth: 100,
  },
  value: {
    fontSize: 14,
    flex: 1,
    fontFamily: 'monospace',
  },
  statusChip: {
    marginLeft: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
  },
  refreshButton: {
    flex: 1,
  },
  retryButton: {
    marginBottom: Spacing.md,
  },
});