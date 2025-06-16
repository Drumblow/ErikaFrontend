import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Title, Card, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors, Spacing } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.title}>Meu Perfil</Title>
        {user && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Avatar.Icon size={80} icon="account-circle" />
              <Title style={styles.userName}>{user.nome}</Title>
              <Text style={styles.userEmail}>{user.email}</Text>
            </Card.Content>
          </Card>
        )}
      </View>
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
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: 24,
    marginBottom: Spacing.lg,
  },
  card: {
    width: '100%',
  },
  cardContent: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  userName: {
    marginTop: Spacing.md,
    fontSize: 20,
  },
  userEmail: {
    marginTop: Spacing.sm,
    color: Colors.text.secondary,
  }
}); 