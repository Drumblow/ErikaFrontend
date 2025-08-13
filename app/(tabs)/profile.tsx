import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Title, Card, Avatar, Button, Dialog, Portal, TextInput, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSnackbar } from '../../src/contexts/SnackbarContext';
import { Colors, Spacing } from '../../src/constants/theme';
import { UpdateUserData } from '../../src/types';

export default function ProfileScreen() {
  const { user, updateUser, deleteUser, signOut } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState<UpdateUserData>({
    nome: user?.nome || '',
    cargo: user?.cargo || 'enfermeiro'
  });

  const handleEditUser = async () => {
    if (!editData.nome?.trim()) {
      showSnackbar('Nome é obrigatório', 'error');
      return;
    }

    try {
      setLoading(true);
      await updateUser(editData);
      setEditDialogVisible(false);
      showSnackbar('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita e todos os seus cronogramas serão perdidos.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: confirmDeleteUser,
        },
      ]
    );
  };

  const confirmDeleteUser = async () => {
    try {
      setLoading(true);
      await deleteUser();
      showSnackbar('Conta excluída com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir conta';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = () => {
    setEditData({
      nome: user?.nome || '',
      cargo: user?.cargo || 'enfermeiro'
    });
    setEditDialogVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.title}>Meu Perfil</Title>
        {user && (
          <>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Avatar.Icon size={80} icon="account-circle" />
                <Title style={styles.userName}>{user.nome}</Title>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.chipContainer}>
                  <Chip icon="account-tie" mode="outlined">
                    {user.cargo === 'enfermeiro' ? 'Enfermeiro(a)' : 'Médico(a)'}
                  </Chip>
                </View>
                <Text style={styles.dateText}>
                  Membro desde {new Date(user.criadoEm).toLocaleDateString('pt-BR')}
                </Text>
              </Card.Content>
            </Card>

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={openEditDialog}
                style={styles.editButton}
                icon="pencil"
                disabled={loading}
              >
                Editar Perfil
              </Button>
              
              <Button
                mode="outlined"
                onPress={signOut}
                style={styles.logoutButton}
                icon="logout"
                disabled={loading}
              >
                Sair
              </Button>
              
              <Button
                mode="outlined"
                onPress={handleDeleteUser}
                style={styles.deleteButton}
                buttonColor={Colors.error}
                textColor="white"
                icon="delete"
                disabled={loading}
              >
                Excluir Conta
              </Button>
            </View>
          </>
        )}

        {/* Dialog de Edição */}
        <Portal>
          <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
            <Dialog.Title>Editar Perfil</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Nome"
                value={editData.nome}
                onChangeText={(text) => setEditData({ ...editData, nome: text })}
                style={styles.input}
                disabled={loading}
              />
              
              <Text style={styles.cargoLabel}>Cargo:</Text>
              <View style={styles.cargoContainer}>
                <Chip
                  selected={editData.cargo === 'enfermeiro'}
                  onPress={() => setEditData({ ...editData, cargo: 'enfermeiro' })}
                  style={styles.cargoChip}
                  disabled={loading}
                >
                  Enfermeiro(a)
                </Chip>
                <Chip
                  selected={editData.cargo === 'medico'}
                  onPress={() => setEditData({ ...editData, cargo: 'medico' })}
                  style={styles.cargoChip}
                  disabled={loading}
                >
                  Médico(a)
                </Chip>
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setEditDialogVisible(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onPress={handleEditUser} loading={loading} disabled={loading}>
                Salvar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
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
  },
  chipContainer: {
    marginTop: Spacing.md,
  },
  dateText: {
    marginTop: Spacing.sm,
    color: Colors.text.secondary,
    fontSize: 12,
  },
  buttonContainer: {
    width: '100%',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  editButton: {
    marginBottom: Spacing.sm,
  },
  logoutButton: {
    marginBottom: Spacing.sm,
  },
  deleteButton: {
    marginBottom: Spacing.sm,
  },
  input: {
    marginBottom: Spacing.md,
  },
  cargoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  cargoContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cargoChip: {
    flex: 1,
  },
});