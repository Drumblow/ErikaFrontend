import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { api, setLogoutCallback } from '../services/api';

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
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const TOKEN_KEY = 'erik_app_auth_token';
  const USER_KEY = 'erik_app_auth_user';

  useEffect(() => {
    async function loadStoragedData() {
      try {
        const storagedToken = await storage.getItem(TOKEN_KEY);
        const storagedUser = await storage.getItem(USER_KEY);

        if (storagedToken && storagedUser) {
          setToken(storagedToken);
          setUser(JSON.parse(storagedUser));
          api.setAuthToken(storagedToken);
        }
      } catch (e) {
        console.error("Failed to load auth data from storage", e);
      } finally {
        setIsLoading(false);
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

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
} 