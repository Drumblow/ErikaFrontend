import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Title, ActivityIndicator, Card, Button, Paragraph } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../../src/contexts/AuthContext';
import { Colors } from '../../src/constants/theme';
import api from '../../src/services/api';
import type { Cronograma } from '../../src/types';
import { MESES } from '../../src/types';

export default function TabIndexScreen() {
  const { user } = useAuth();
  const [cronogramas, setCronogramas] = useState<Cronograma[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCronogramas = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.getCronogramas();
      
      if (response.success && response.data) {
        const scheduleList = response.data.cronogramas || response.data.items || [];
        setCronogramas(scheduleList);
        console.log(`✅ Cronogramas carregados: ${scheduleList.length}`);
      } else {
        setError(response.message || "Não foi possível carregar os cronogramas.");
        setCronogramas([]);
      }
    } catch (err) {
      setError("Ocorreu um erro de rede. Tente novamente.");
      setCronogramas([]);
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchCronogramas();
    }, [fetchCronogramas])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCronogramas();
  }, [fetchCronogramas]);
  
  const getMesNome = (mesNumero: number) => {
    const mes = MESES.find(m => m.value === mesNumero);
    return mes ? mes.label : 'Mês desconhecido';
  }

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator animating={true} size="large" style={styles.centered} />;
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Paragraph>{error}</Paragraph>
          <Button onPress={fetchCronogramas}>Tentar Novamente</Button>
        </View>
      );
    }

    if (cronogramas.length === 0) {
      return (
        <View style={styles.centered}>
          <Paragraph>Nenhum cronograma encontrado.</Paragraph>
           <Button onPress={fetchCronogramas}>Verificar novamente</Button>
        </View>
      );
    }

    return (
      <FlatList
        data={cronogramas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title 
              title={`Cronograma de ${getMesNome(item.mes)}/${item.ano}`}
              subtitle={item.nomeUBSF || 'UBSF não informada'}
            />
            <Card.Content>
              <Paragraph>Enfermeiro(a): {item.enfermeiro || 'Não informado'}</Paragraph>
              <Paragraph>Médico(a): {item.medico || 'Não informado'}</Paragraph>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Meus Cronogramas</Title>
        <Text>Bem-vindo(a), {user?.nome || 'Usuário'}!</Text>
      </View>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  card: {
    marginVertical: 8,
  }
}); 