import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { api, setLogoutCallback } from '../services/api';
import { UpdateUserData } from '../types';

// Storage adapter para web e nativo
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
};

// Tipos baseados na documentação da API
interface User {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  criadoEm: string;
  atualizadoEm: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  signUp: (nome: string, email: string, password: string, cargo: string) => Promise<void>;
  updateUser: (userData: UpdateUserData) => Promise<void>;
  deleteUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({
  user: null,
  token: null,
  isLoading: true,
  signIn: async () => {},
  signOut: () => {},
  signUp: async () => {},
  updateUser: async () => {},
  deleteUser: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const TOKEN_KEY = 'erik_app_auth_token';
  const USER_KEY = 'erik_app_auth_user';

  useEffect(() => {
    async function loadStoragedData() {
      try {
        console.log('🔍 Carregando dados de autenticação do storage...');
        const storagedToken = await storage.getItem(TOKEN_KEY);
        const storagedUser = await storage.getItem(USER_KEY);

        console.log('📦 Dados do storage:', { 
          hasToken: !!storagedToken, 
          hasUser: !!storagedUser,
          tokenPreview: storagedToken ? storagedToken.substring(0, 20) + '...' : null
        });

        if (storagedToken && storagedUser) {
          setToken(storagedToken);
          setUser(JSON.parse(storagedUser));
          api.setAuthToken(storagedToken);
          console.log('✅ Dados de autenticação carregados com sucesso');
        } else {
          console.log('❌ Nenhum dado de autenticação encontrado no storage');
        }
      } catch (e) {
        console.error("❌ Falha ao carregar dados de autenticação do storage", e);
      } finally {
        setIsLoading(false);
        console.log('🏁 Carregamento de autenticação finalizado');
      }
    }

    // Configurar callback para logout automático em caso de erro 401
    setLogoutCallback(() => {
      console.log('🚨 Logout automático por erro 401');
      signOut();
    });

    loadStoragedData();
  }, []);

  async function signIn(email: string, password: string) {
    try {
      console.log('Tentando fazer login com:', { email });
      
      const response = await api.login({
        email,
        senha: password,
      });
      
      console.log('Resposta do login:', response);
      
      if (response.success && response.data) {
        const { token, usuario } = response.data;
        setToken(token);
        setUser(usuario);
        api.setAuthToken(token);
        
        await storage.setItem(TOKEN_KEY, token);
        await storage.setItem(USER_KEY, JSON.stringify(usuario));
        
        console.log('Login realizado com sucesso!');
      } else {
        throw new Error(response.message || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }
  
  async function signUp(nome: string, email: string, password: string, cargo: string = 'enfermeiro') {
    try {
      console.log('Tentando fazer cadastro com:', { nome, email, cargo });
      
      const response = await api.cadastro({
        nome,
        email,
        senha: password,
        cargo,
      });
      
      console.log('Resposta do cadastro:', response);
      
      if (response.success && response.data) {
        const { token, usuario } = response.data;
        setToken(token);
        setUser(usuario);
        api.setAuthToken(token);
        
        await storage.setItem(TOKEN_KEY, token);
        await storage.setItem(USER_KEY, JSON.stringify(usuario));
        
        console.log('Cadastro realizado com sucesso!');
      } else {
        throw new Error(response.message || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  }

  async function signOut() {
    await storage.removeItem(TOKEN_KEY);
    await storage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
    api.setAuthToken(null);
  }

  async function updateUser(userData: UpdateUserData) {
    try {
      if (!user) {
        throw new Error('Usuário não está logado');
      }

      console.log('Atualizando usuário:', userData);
      
      const response = await api.updateUser(user.id, userData);
      
      console.log('Resposta da atualização:', response);
      
      if (response.success && response.data) {
        const updatedUser = response.data;
        setUser(updatedUser);
        
        await storage.setItem(USER_KEY, JSON.stringify(updatedUser));
        
        console.log('Usuário atualizado com sucesso!');
      } else {
        throw new Error(response.message || 'Erro ao atualizar usuário');
      }
    } catch (error) {
      console.error('Erro na atualização do usuário:', error);
      throw error;
    }
  }

  async function deleteUser() {
    try {
      if (!user) {
        throw new Error('Usuário não está logado');
      }

      console.log('Excluindo usuário:', user.id);
      
      const response = await api.deleteUser(user.id);
      
      console.log('Resposta da exclusão:', response);
      
      if (response.success) {
        // Fazer logout após exclusão
        await signOut();
        
        console.log('Usuário excluído com sucesso!');
      } else {
        throw new Error(response.message || 'Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('Erro na exclusão do usuário:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, signUp, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}