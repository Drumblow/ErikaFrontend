import React, { useState, useEffect, useCallback } from 'react';
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
import { Asset } from 'expo-asset';

import { api } from '../../src/services/api';
import { Cronograma, Atividade } from '../../src/types';
import { Colors, Spacing, Shadows } from '../../src/constants/theme';
import { formatPeriod, formatDate, formatDiaSemana, getMonthName } from '../../src/utils';
import { AuthGuard } from '../../src/components/AuthGuard';

// --- Funções de Geração de HTML movidas do Backend ---

// Carrega as imagens e converte para Base64
const imageToBase64 = async (assetModule: number): Promise<string> => {
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new Error('Failed to download asset');
  }
  return FileSystem.readAsStringAsync(asset.localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
};

// Gera o corpo do calendário
function generateCalendarBody(ano: number, mes: number, atividades: Atividade[]) {
  const activitiesMap = new Map<string, Atividade[]>();
  const diasDaSemana = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];

  atividades.forEach(ativ => {
    const dataAtividade = new Date(ativ.data);
    const dateKey = `${dataAtividade.getUTCDate().toString().padStart(2, '0')}/${(dataAtividade.getUTCMonth() + 1).toString().padStart(2, '0')}/${dataAtividade.getUTCFullYear()}`;
    const mapKey = `${dateKey}_${ativ.diaSemana}`;
    if (!activitiesMap.has(mapKey)) {
        activitiesMap.set(mapKey, []);
    }
    activitiesMap.get(mapKey)?.push(ativ);
  });

  const firstDayOfMonth = new Date(Date.UTC(ano, mes - 1, 1));
  const lastDayOfMonth = new Date(Date.UTC(ano, mes, 0));
  let currentDay = new Date(firstDayOfMonth);
  const weeks: Record<string, { date: string; atividades: Atividade[] }>[] = [];
  
  // Ajusta para o início da primeira semana (Segunda-feira)
  const dayOfWeek = currentDay.getUTCDay();
  if (dayOfWeek !== 1) {
    const adjustment = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
    currentDay.setUTCDate(currentDay.getUTCDate() + adjustment);
  }

  while (currentDay <= lastDayOfMonth || weeks.length < 5) {
    const week: Record<string, { date: string; atividades: Atividade[] }> = {};
    const daysOrder = ['SEGUNDA-MANHÃ', 'TERÇA-MANHÃ', 'QUARTA-MANHÃ', 'QUINTA-MANHÃ', 'SEXTA-MANHÃ'];
    
    for (let i = 0; i < 5; i++) {
        const dayKey = daysOrder[i];
        if (currentDay.getUTCMonth() + 1 === mes) {
            const dateKey = `${currentDay.getUTCDate().toString().padStart(2, '0')}/${(currentDay.getUTCMonth() + 1).toString().padStart(2, '0')}/${currentDay.getUTCFullYear()}`;
            const mapKey = `${dateKey}_${dayKey}`;
            week[dayKey] = {
                date: dateKey,
                atividades: activitiesMap.get(mapKey) || []
            };
        } else {
            week[dayKey] = { date: '', atividades: [] };
        }
        currentDay.setUTCDate(currentDay.getUTCDate() + 1);
    }
    weeks.push(week);
     // Pula fim de semana
    currentDay.setUTCDate(currentDay.getUTCDate() + 2);
  }
  
  let tableBodyHtml = '';
  const filteredWeeks = weeks.filter(week => 
    Object.values(week).some(dayData => dayData.date !== '')
  );

  filteredWeeks.forEach((week, weekIndex) => {
    let dateRow = '<tr>';
    let activityRow = '<tr>';
    const daysOrder = ['SEGUNDA-MANHÃ', 'TERÇA-MANHÃ', 'QUARTA-MANHÃ', 'QUINTA-MANHÃ', 'SEXTA-MANHÃ'];
    
    daysOrder.forEach(dayKey => {
        const dayData = week[dayKey];
        dateRow += `<td class="date-cell">${dayData.date}</td>`;
        
        const activitiesHtml = (dayData.atividades || []).map(ativ => 
            ativ.descricao.split('\n').map(line => line.trim()).join('<br>')
        ).join('<br><br>');
        
        activityRow += `<td class="activity-cell">${activitiesHtml}</td>`;
    });

    dateRow += '</tr>';
    activityRow += '</tr>';
    tableBodyHtml += dateRow + activityRow;
  });

  return { tableBodyHtml, weekCount: filteredWeeks.length };
}

// Gera o HTML completo
async function generateFullHtml(cronograma: Cronograma) {
    if (!cronograma.atividades) {
      cronograma.atividades = [];
    }
    const { tableBodyHtml, weekCount } = generateCalendarBody(cronograma.ano, cronograma.mes, cronograma.atividades);
    const monthName = getMonthName(cronograma.mes).toUpperCase();

    let leftLogoBase64 = '';
    let rightLogoBase64 = '';
    let headerTitleImageBase64 = '';
    
    try {
        leftLogoBase64 = await imageToBase64(require('../../assets/pdf/image3.png'));
        rightLogoBase64 = await imageToBase64(require('../../assets/pdf/image2.jpg'));
        headerTitleImageBase64 = await imageToBase64(require('../../assets/pdf/image1.png'));
    } catch (error) {
        console.warn('[WARNING] Erro ao carregar imagens para o PDF:', error instanceof Error ? error.message : String(error));
    }

    let sizeClass = 'size-normal'; // 5 semanas
    if (weekCount <= 4) { // Ajustado para 4 ou menos
        sizeClass = 'size-large'; // 4 semanas - texto médio/grande
    } else if (weekCount >= 6) {
        sizeClass = 'size-small'; // 6+ semanas - texto bem pequeno
    }
    
    // O restante do HTML e CSS do backend é colado aqui.
    // É muito longo para mostrar na íntegra, mas a lógica é a mesma.
    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Cronograma de Atendimento - ${monthName}/${cronograma.ano}</title>
            <style>
                :root {
                    --font-base: 14px; --font-header: 15px; --font-cell: 13px; --logo-height: 62px;
                    --title-img-height: 72px; --date-cell-height: 22px; --activity-cell-height: 85px; --padding-base: 5px;
                }
                body.size-large {
                    --font-base: 16px; --font-header: 17px; --font-cell: 15px; --logo-height: 72px;
                    --title-img-height: 85px; --date-cell-height: 25px; --activity-cell-height: 110px; --padding-base: 6px;
                }
                body.size-small {
                    --font-base: 11px; --font-header: 12px; --font-cell: 10px; --logo-height: 50px;
                    --title-img-height: 55px; --date-cell-height: 18px; --activity-cell-height: 65px; --padding-base: 3px;
                }
                body { font-family: Arial, sans-serif; margin: 0; padding: 6px; font-size: var(--font-base); }
                @page {
                  size: landscape;
                  margin: 10mm;
                }
                .header { text-align: center; margin-bottom: 6px; }
                .header img.logo { height: var(--logo-height); margin: 0 8px; }
                .header img.header-title-img { height: var(--title-img-height); }
                .info-row { display: flex; justify-content: space-between; margin: 3px 0; padding: 0 16px; font-size: var(--font-header); }
                table { width: 100%; border-collapse: collapse; margin-top: 6px; table-layout: fixed; }
                th, td { border: 1px solid black; padding: var(--padding-base); text-align: center; vertical-align: top; word-wrap: break-word; }
                th { background-color: #ffff00; font-weight: bold; }
                .date-cell { background-color: #ffff00; font-weight: bold; font-size: var(--font-cell); padding: 2px; height: var(--date-cell-height); }
                .activity-cell { height: var(--activity-cell-height); font-size: var(--font-cell); padding: 4px; text-align: center; vertical-align: middle; }
            </style>
        </head>
        <body class="${sizeClass}">
            <div class="header">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    ${leftLogoBase64 ? `<img src="data:image/png;base64,${leftLogoBase64}" alt="Logo Saúde" class="logo">` : '<div style="width: 62px;"></div>'}
                    <div style="flex: 1; text-align: center;">
                        ${headerTitleImageBase64 ? `<img src="data:image/png;base64,${headerTitleImageBase64}" alt="Título" class="header-title-img">` : ''}
                    </div>
                    ${rightLogoBase64 ? `<img src="data:image/jpeg;base64,${rightLogoBase64}" alt="Logo Tutóia" class="logo">` : '<div style="width: 62px;"></div>'}
                </div>
            </div>
            <div class="info-row">
                <div>UBSF: ${cronograma.nomeUBSF || ''}</div>
                <div>Enfermeira(o): ${cronograma.enfermeiro || ''}</div>
                <div>Médico(a): ${cronograma.medico || ''}</div>
            </div>
            <div style="text-align: center; margin: 3px 0; font-weight: bold; font-size: var(--font-header);">
                CRONOGRAMA DE ATENDIMENTO ${monthName}/${cronograma.ano}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>SEGUNDA – MANHÃ</th><th>TERÇA – MANHÃ</th><th>QUARTA – MANHÃ</th><th>QUINTA – MANHÃ</th><th>SEXTA – MANHÃ</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableBodyHtml}
                </tbody>
            </table>
        </body>
        </html>
    `;
}

function PreviewCronogramaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [cronograma, setCronograma] = useState<Cronograma | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCronograma = useCallback(async () => {
    if (!id) {
      setError("ID do cronograma não foi encontrado na rota.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await api.getCronograma(id);
      if (response.success) {
        // Ordena as atividades pela data antes de definir o estado
        const sortedActivities = (response.data.atividades || []).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
        setCronograma({ ...response.data, atividades: sortedActivities });
      } else {
        setError(response.message);
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar cronograma:', err);
      setError('Erro ao carregar cronograma. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCronograma();
  }, [loadCronograma]);

  const handleGeneratePDF = async () => {
    if (!cronograma) return;
    
    setGeneratingPDF(true);
    try {
      console.log('🔄 Gerando PDF via API para cronograma:', cronograma.id);
      
      // Chama a API para gerar o PDF
      const response = await api.generatePDF(cronograma.id);
      
      if (response.success && response.data?.pdfBase64) {
        console.log('✅ PDF gerado com sucesso via API');
        
        if (Platform.OS === 'web') {
           // Para web, converte base64 para blob e faz download direto
           const byteCharacters = atob(response.data.pdfBase64);
           const byteNumbers = new Array(byteCharacters.length);
           for (let i = 0; i < byteCharacters.length; i++) {
             byteNumbers[i] = byteCharacters.charCodeAt(i);
           }
           const byteArray = new Uint8Array(byteNumbers);
           const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
           
           // Cria um link temporário para download
           const url = URL.createObjectURL(pdfBlob);
           const link = document.createElement('a');
           link.href = url;
           link.download = `cronograma_${formatPeriod(cronograma.mes, cronograma.ano).replace('/', '_')}.pdf`;
           
           // Adiciona o link ao DOM, clica e remove
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
           
           // Limpa a URL para liberar memória
           URL.revokeObjectURL(url);
           
           Alert.alert('Sucesso', 'PDF baixado com sucesso!');
          
        } else {
           // Para mobile, salva o arquivo e compartilha
           console.log('📱 Processando PDF para mobile...');
           const fileName = `cronograma_${formatPeriod(cronograma.mes, cronograma.ano).replace('/', '_')}.pdf`;
           const fileUri = `${FileSystem.documentDirectory}${fileName}`;
           
           console.log('💾 Salvando arquivo em:', fileUri);
           await FileSystem.writeAsStringAsync(fileUri, response.data.pdfBase64, {
             encoding: FileSystem.EncodingType.Base64,
           });
           
           console.log('✅ Arquivo salvo com sucesso');
           
           // Verifica se o compartilhamento está disponível
           const sharingAvailable = await Sharing.isAvailableAsync();
           console.log('🔗 Compartilhamento disponível:', sharingAvailable);
           
           if (sharingAvailable) {
             console.log('📤 Iniciando compartilhamento...');
             try {
               await Sharing.shareAsync(fileUri, {
                 mimeType: 'application/pdf',
                 dialogTitle: `Cronograma ${formatPeriod(cronograma.mes, cronograma.ano)}`,
                 UTI: 'com.adobe.pdf',
               });
               console.log('✅ Compartilhamento concluído');
             } catch (shareError) {
               console.error('❌ Erro no compartilhamento:', shareError);
               Alert.alert(
                 'PDF Gerado', 
                 `O PDF foi salvo com sucesso!\n\nLocalização: ${fileUri}\n\nVocê pode encontrá-lo na pasta de documentos do aplicativo.`,
                 [{ text: 'OK' }]
               );
             }
           } else {
             Alert.alert(
               'PDF Salvo', 
               `O arquivo foi salvo em: ${fileUri}\n\nVocê pode acessá-lo através do gerenciador de arquivos.`,
               [{ text: 'OK' }]
             );
           }
         }
      } else {
        throw new Error(response.message || 'Erro ao gerar PDF');
      }

    } catch (err: unknown) {
      console.error('❌ Erro ao gerar PDF via API:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      Alert.alert('Erro', 'Não foi possível gerar o PDF. ' + errorMessage);
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

  const { mes, ano, nomeUBSF, enfermeiro, medico, atividades = [] } = cronograma;

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
              {formatPeriod(mes, ano)}
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
            
            {nomeUBSF && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>{nomeUBSF}</Text>
              </View>
            )}
            
            {enfermeiro && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>Enfermeiro: {enfermeiro}</Text>
              </View>
            )}
            
            {medico && (
              <View style={styles.infoRow}>
                <Ionicons name="medical-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>Médico: {medico}</Text>
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

export default function ProtectedPreviewCronogramaScreen() {
  return (
    <AuthGuard>
      <PreviewCronogramaScreen />
    </AuthGuard>
  );
}