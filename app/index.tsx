import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
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
  Portal,
  Dialog,
} from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { api } from '../src/services/api';
import { Cronograma } from '../src/types';
import { Colors, Spacing, Shadows } from '../src/constants/theme';
import { formatPeriod, debounce, filterBySearch } from '../src/utils';
import { useSnackbar } from '../src/contexts/SnackbarContext';
import { useAuth } from '../src/contexts/AuthContext';

export default function HomeScreen() {
  const [cronogramas, setCronogramas] = useState<Cronograma[]>([]);
  const [filteredCronogramas, setFilteredCronogramas] = useState<Cronograma[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [cronogramaToDelete, setCronogramaToDelete] = useState<Cronograma | null>(null);
  
  // Hooks devem sempre ser chamados na mesma ordem
  const { showSnackbar } = useSnackbar();
  const { user, token, isLoading: authLoading, signOut } = useAuth();

  // Efeito para redirecionamento de autenticação
  useEffect(() => {
    if (!authLoading && !token) {
      console.log('Usuário não autenticado, redirecionando para login');
      router.replace('/login');
    }
  }, [authLoading, token]);

  // Callbacks e outras funções
  const loadCronogramas = useCallback(async (showRefresh = false) => {
    try {
      console.log('🔄 Iniciando carregamento de cronogramas...');
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      const response = await api.getCronogramas({ limit: 50 });
      console.log('📡 Resposta da API:', response);
      
      if (response.success) {
        console.log('✅ Cronogramas carregados:', response.data.cronogramas?.length || 0);
        setCronogramas(response.data.cronogramas || []);
        setFilteredCronogramas(response.data.cronogramas || []);
      } else {
        console.log('❌ Erro na resposta:', response.message);
        setError(response.message);
      }
    } catch (err) {
      console.error('💥 Erro ao carregar cronogramas:', err);
      setError('Erro ao carregar cronogramas. Verifique sua conexão.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        setFilteredCronogramas(cronogramas);
      } else {
        const filtered = filterBySearch(
          cronogramas,
          query,
          ['nomeUBSF', 'enfermeiro', 'medico']
        );
        setFilteredCronogramas(filtered);
      }
    }, 300),
    [cronogramas]
  );

  // Efeitos para carregamento e busca
  useEffect(() => {
    if (token && user) {
      loadCronogramas();
    }
  }, [loadCronogramas, token, user]);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Estado de carregamento da autenticação
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  // Se não autenticado, retorna null (redirecionamento acontece no useEffect)
  if (!token || !user) {
    return null;
  }

  const handleDeleteCronograma = (cronograma: Cronograma) => {
    console.log('Abrindo diálogo de exclusão para:', cronograma.id);
    setCronogramaToDelete(cronograma);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setCronogramaToDelete(null);
  };

  const confirmDeletion = async () => {
    if (!cronogramaToDelete) return;

    console.log('Usuário confirmou exclusão, iniciando processo para:', cronogramaToDelete.id);
    try {
      const response = await api.deleteCronograma(cronogramaToDelete.id);
      if (response.success) {
        showSnackbar('Cronograma excluído com sucesso!', 'success');
        loadCronogramas();
      } else {
        showSnackbar(response.message || 'Não foi possível excluir o cronograma.', 'error');
      }
    } catch (err) {
      console.error('Erro ao excluir cronograma:', err);
      const errorMessage = err instanceof Error ? err.message : 'Verifique sua conexão e tente novamente.';
      showSnackbar(`Erro ao excluir: ${errorMessage}`, 'error');
    } finally {
      hideDialog();
    }
  };

  const renderCronograma = ({ item }: { item: Cronograma }) => (
    <Card style={styles.card} onPress={() => router.push(`/preview/${item.id}`)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Title style={styles.title}>
              {formatPeriod(item.mes, item.ano)}
            </Title>
            <Chip 
              mode="outlined" 
              style={styles.chip}
              textStyle={styles.chipText}
            >
              {item.atividades?.length || 0} atividades
            </Chip>
          </View>
        </View>
        
        {item.nomeUBSF && (
          <Paragraph style={styles.ubsf}>
            <Ionicons name="location-outline" size={16} color={Colors.text.secondary} />
            {' '}{item.nomeUBSF}
          </Paragraph>
        )}
        
        {item.enfermeiro && (
          <Paragraph style={styles.professional}>
            <Ionicons name="person-outline" size={16} color={Colors.text.secondary} />
            {' '}Enfermeiro: {item.enfermeiro}
          </Paragraph>
        )}
        
        {item.medico && (
          <Paragraph style={styles.professional}>
            <Ionicons name="medical-outline" size={16} color={Colors.text.secondary} />
            {' '}Médico: {item.medico}
          </Paragraph>
        )}
      </Card.Content>
      
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="outlined" 
          onPress={() => router.push(`/atividades/${item.id}`)}
          style={styles.actionButton}
        >
          Atividades
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => router.push(`/edit/${item.id}`)}
          style={styles.actionButton}
        >
          Editar
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => {
            console.log('Botão Excluir clicado! Item:', item);
            handleDeleteCronograma(item);
          }}
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
      <Text style={styles.emptyTitle}>Nenhum cronograma encontrado</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Tente ajustar sua pesquisa' : 'Crie seu primeiro cronograma'}
      </Text>
      {!searchQuery && (
        <Button 
          mode="contained" 
          onPress={() => router.push('/create')}
          style={styles.emptyButton}
        >
          Criar Cronograma
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
        onPress={() => loadCronogramas()}
        style={styles.retryButton}
      >
        Tentar Novamente
      </Button>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando cronogramas...</Text>
      </View>
    );
  }

  if (error && cronogramas.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.userInfo}>
        <Text style={styles.welcomeText}>
          Olá, {user?.nome}! 👋
        </Text>
        <Text style={styles.userDetails}>
          {user?.cargo} | {cronogramas.length} cronograma{cronogramas.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por UBSF, enfermeiro ou médico..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>
      
      {error && !refreshing && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}
      
      <FlatList
        data={filteredCronogramas}
        renderItem={renderCronograma}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadCronogramas(true)}
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
              {cronogramaToDelete && `Deseja realmente excluir o cronograma de ${formatPeriod(cronogramaToDelete.mes, cronogramaToDelete.ano)}?`}
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
        onPress={() => router.push('/create')}
        label="Novo Cronograma"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  searchbar: {
    backgroundColor: Colors.background,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  chip: {
    backgroundColor: Colors.primaryLight,
  },
  chipText: {
    fontSize: 12,
    color: Colors.primary,
  },
  ubsf: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  professional: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
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
  errorBanner: {
    padding: Spacing.md,
    backgroundColor: Colors.error,
  },
  errorBannerText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  userInfo: {
    padding: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '20',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  userDetails: {
    fontSize: 14,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
});