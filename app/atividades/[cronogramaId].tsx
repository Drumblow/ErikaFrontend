import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Searchbar,
  Chip,
  Text,
  ActivityIndicator,
  Button,
  Menu,
  Divider,
  Portal,
  Dialog,
} from 'react-native-paper';
import { router, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../src/services/api';
import { Cronograma, Atividade } from '../../src/types';
import { Colors, Spacing, Shadows } from '../../src/constants/theme';
import { formatDate, formatDiaSemana, formatPeriod, debounce, filterBySearch, DiaSemana } from '../../src/utils';
import { useSnackbar } from '../../src/contexts/SnackbarContext';
import { AuthGuard } from '../../src/components/AuthGuard';

function AtividadesScreen() {
  const { cronogramaId } = useLocalSearchParams<{ cronogramaId: string }>();
  
  const [cronograma, setCronograma] = useState<Cronograma | null>(null);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [filteredAtividades, setFilteredAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<DiaSemana | 'TODOS'>('TODOS');
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [atividadeToDelete, setAtividadeToDelete] = useState<Atividade | null>(null);

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      
      // Simplificado para uma única chamada de API
      const cronogramaResponse = await api.getCronograma(cronogramaId!);
      
      if (cronogramaResponse.success) {
        const cronogramaData = cronogramaResponse.data;
        setCronograma(cronogramaData);

        const atividadesData = cronogramaData.atividades || [];
        // Ordenar por data
        const atividadesOrdenadas = atividadesData.sort((a: Atividade, b: Atividade) => 
          new Date(a.data).getTime() - new Date(b.data).getTime()
        );
        setAtividades(atividadesOrdenadas);
        setFilteredAtividades(atividadesOrdenadas); // Inicializa a lista filtrada
      } else {
        setError(cronogramaResponse.message);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cronogramaId]);

  // Efeito para carregar os dados sempre que a tela estiver em foco
  useFocusEffect(
    useCallback(() => {
      if (cronogramaId) {
        loadData();
      }
    }, [cronogramaId])
  );

  const applyFilters = useCallback(() => {
    let filtered = atividades;
    
    // Filtro por dia da semana
    if (selectedFilter !== 'TODOS') {
      filtered = filtered.filter(atividade => atividade.diaSemana === selectedFilter);
    }
    
    // Filtro por busca
    if (searchQuery.trim()) {
      filtered = filterBySearch(filtered, searchQuery, ['descricao']);
    }
    
    setFilteredAtividades(filtered);
  }, [atividades, selectedFilter, searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [atividades, applyFilters]); // Adicionado 'atividades' para refiltrar quando os dados mudam

  const debouncedSearch = useCallback(
    debounce(() => applyFilters(), 300),
    [applyFilters]
  );

  useEffect(() => {
    debouncedSearch();
  }, [searchQuery, debouncedSearch]);

  const handleDeleteAtividade = (atividade: Atividade) => {
    setAtividadeToDelete(atividade);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setAtividadeToDelete(null);
  };

  const confirmDeletion = async () => {
    if (!atividadeToDelete) return;

    try {
      const response = await api.deleteAtividade(atividadeToDelete.id);
      if (response.success) {
        showSnackbar('Atividade excluída com sucesso!', 'success');
        loadData();
      } else {
        showSnackbar(response.message || 'Não foi possível excluir a atividade.', 'error');
      }
    } catch (err) {
      console.error('Erro ao excluir atividade:', err);
      const errorMessage = err instanceof Error ? err.message : 'Verifique sua conexão e tente novamente.';
      showSnackbar(`Erro ao excluir: ${errorMessage}`, 'error');
    } finally {
      hideDialog();
    }
  };

  const renderAtividade = ({ item }: { item: Atividade }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.date}>{formatDate(item.data)}</Text>
            <Chip 
              mode="outlined" 
              style={styles.diaSemanaChip}
              textStyle={styles.diaSemanaChipText}
            >
              {formatDiaSemana(item.diaSemana)}
            </Chip>
          </View>
        </View>
        
        <Paragraph style={styles.descricao}>
          {item.descricao}
        </Paragraph>
      </Card.Content>
      
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="outlined" 
          onPress={() => router.push(`/atividade/edit/${item.id}?cronogramaId=${cronogramaId}`)}
          style={styles.actionButton}
        >
          Editar
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => handleDeleteAtividade(item)}
          textColor={Colors.error}
          style={styles.actionButton}
        >
          Excluir
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color={Colors.text.disabled} />
      <Text style={styles.emptyTitle}>
        {searchQuery || selectedFilter !== 'TODOS' 
          ? 'Nenhuma atividade encontrada' 
          : 'Nenhuma atividade programada'
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedFilter !== 'TODOS'
          ? 'Tente ajustar os filtros de busca'
          : 'Adicione a primeira atividade para este cronograma'
        }
      </Text>
      {!searchQuery && selectedFilter === 'TODOS' && (
        <Button 
          mode="contained" 
          onPress={() => router.push(`/atividade/create/${cronogramaId}`)}
          style={styles.emptyButton}
        >
          Adicionar Atividade
        </Button>
      )}
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
      <Text style={styles.errorTitle}>Erro ao carregar</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <Button 
        mode="contained" 
        onPress={() => loadData()}
        style={styles.retryButton}
      >
        Tentar Novamente
      </Button>
    </View>
  );

  const filterOptions: { label: string; value: DiaSemana | 'TODOS' }[] = [
    { label: 'Todos os dias', value: 'TODOS' },
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando atividades...</Text>
      </View>
    );
  }

  if (error && !cronograma) {
    return (
      <SafeAreaView style={styles.container}>
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: cronograma ? `Atividades de ${formatPeriod(cronograma.mes, cronograma.ano)}` : 'Carregando...',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.text.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      {/* Header com informações do cronograma */}
      {cronograma && (
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.headerTitle}>
              {formatPeriod(cronograma.mes, cronograma.ano)}
            </Title>
            {cronograma.nomeUBSF && (
              <Text style={styles.headerSubtitle}>{cronograma.nomeUBSF}</Text>
            )}
            <View style={styles.statsContainer}>
              <Chip 
                icon="calendar-check" 
                style={styles.statsChip}
                textStyle={styles.statsChipText}
              >
                {atividades.length} atividades
              </Chip>
              {filteredAtividades.length !== atividades.length && (
                <Chip 
                  icon="filter" 
                  style={styles.filterChip}
                  textStyle={styles.filterChipText}
                >
                  {filteredAtividades.length} filtradas
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>
      )}
      
      {/* Controles de busca e filtro */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Buscar atividades..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
        </View>
        
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setFilterMenuVisible(true)}
              icon="filter"
              style={styles.filterButton}
            >
              {filterOptions.find(opt => opt.value === selectedFilter)?.label || 'Filtrar'}
            </Button>
          }
        >
          {filterOptions.map((option) => (
            <Menu.Item
              key={option.value}
              onPress={() => {
                setSelectedFilter(option.value);
                setFilterMenuVisible(false);
              }}
              title={option.label}
              leadingIcon={selectedFilter === option.value ? 'check' : undefined}
            />
          ))}
        </Menu>
      </View>
      
      <FlatList
        data={filteredAtividades}
        renderItem={renderAtividade}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
      
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Confirmar Exclusão</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {atividadeToDelete && `Deseja realmente excluir a atividade "${atividadeToDelete.descricao}"?`}
              {'\n\n'}Esta ação não pode ser desfeita.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancelar</Button>
            <Button onPress={confirmDeletion} textColor={Colors.error}>Excluir</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push(`/atividade/create/${cronogramaId}`)}
        label="Nova Atividade"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerCard: {
    margin: Spacing.md,
    marginBottom: 0,
    backgroundColor: Colors.surface,
    ...Shadows.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  statsChip: {
    backgroundColor: Colors.primaryLight,
  },
  statsChipText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  filterChip: {
    backgroundColor: Colors.secondaryLight,
  },
  filterChipText: {
    color: Colors.secondary,
    fontWeight: '500',
  },
  controlsContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  searchContainer: {
    marginBottom: Spacing.sm,
  },
  searchbar: {
    backgroundColor: Colors.background,
  },
  filterButton: {
    alignSelf: 'flex-start',
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  card: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.md,
  },
  cardHeader: {
    marginBottom: Spacing.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
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
  descricao: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
  },
  actionButton: {
    marginLeft: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: Spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
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
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: Spacing.lg,
  },
  errorState: {
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
  errorSubtitle: {
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

export default function ProtectedAtividadesScreen() {
  return (
    <AuthGuard>
      <AtividadesScreen />
    </AuthGuard>
  );
}