import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/theme';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, token, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/login');
    }
  }, [isLoading, token]);

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: Colors.background 
      }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 16, color: Colors.text.secondary }}>
          Verificando autenticação...
        </Text>
      </View>
    );
  }

  if (!token || !user) {
    return null; // Será redirecionado para login
  }

  return <>{children}</>;
};