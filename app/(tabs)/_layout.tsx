import React from 'react';
import { Tabs, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';

import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

export default function TabLayout() {
  const { signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    // O redirecionamento para /login é tratado pelo RootLayout principal
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.text.white,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cronogramas',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month" color={color} size={size} />
          ),
          headerRight: () => (
            <Button
              onPress={handleLogout}
              textColor={Colors.text.white}
              icon="logout"
            >
              Sair
            </Button>
          ),
        }}
      />
      <Tabs.Screen
        name="pdf-status"
        options={{
          title: 'Status PDF',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-pdf-box" color={color} size={size} />
          ),
          headerRight: () => (
            <Button
              onPress={handleLogout}
              textColor={Colors.text.white}
              icon="logout"
            >
              Sair
            </Button>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Meu Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
           headerRight: () => (
            <Button
              onPress={handleLogout}
              textColor={Colors.text.white}
              icon="logout"
            >
              Sair
            </Button>
          ),
        }}
      />
    </Tabs>
  );
}