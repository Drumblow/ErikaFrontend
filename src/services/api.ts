import { 
  Cronograma, 
  Atividade, 
  ApiResponse, 
  PaginatedResponse,
  CreateCronogramaData,
  UpdateCronogramaData,
  CreateAtividadeData,
  UpdateAtividadeData
} from '../types';
import { router } from 'expo-router';

// Configuração da URL da API 
// Backend agora tem CORS configurado para localhost
const API_BASE_URL = 'https://erika-ubsf.vercel.app';

// Verificação para debug
console.log('🔗 API_BASE_URL configurada:', API_BASE_URL);
console.log('🔧 __DEV__:', __DEV__);

// Função para lidar com logout quando token expira
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Tipos para autenticação
interface LoginData {
  email: string;
  senha: string;
}

interface CadastroData {
  email: string;
  nome: string;
  senha: string;
  cargo: string;
}

interface AuthResponse {
  usuario: {
    id: string;
    email: string;
    nome: string;
    cargo: string;
    criadoEm: string;
    atualizadoEm: string;
  };
  token: string;
}

class ApiService {
  private authToken: string | null = null;

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add authorization header if token exists
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    const config: RequestInit = {
      headers,
      ...options,
    };

    try {
      console.log('🚀 API Request:', config.method || 'GET', url);
      console.log('📋 API Config:', config);
      console.log('🔗 API_BASE_URL:', API_BASE_URL);
      
      const response = await fetch(url, config);
      
      console.log('API Response Status:', response.status);

      // Tratamento específico para erro 401 (Não autorizado)
      if (response.status === 401) {
        console.error('🚨 Token inválido ou expirado (401)');
        if (logoutCallback) {
          logoutCallback();
        }
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        console.log('API Response: Empty body (204 No Content)');
        // Para DELETE, uma resposta 204 é um sucesso, mas não tem corpo.
        // Retornamos um objeto de sucesso padrão que a aplicação espera.
        return { success: true, message: 'Operação realizada com sucesso' } as ApiResponse<T>;
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      
      // A API pode retornar success: false no corpo, mesmo com status 200.
      if (!response.ok && !data.success) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ API Request Error:', error);
      console.error('❌ Failed URL:', url);
      console.error('❌ Request config:', config);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('❌ Network error - possível problema de CORS ou URL inválida');
        throw new Error('Erro de conexão com o servidor. Verifique sua internet e tente novamente.');
      }
      
      throw error;
    }
  }

  // --- MÉTODOS DE AUTENTICAÇÃO ---

  // Cadastro de usuário
  async cadastro(data: CadastroData): Promise<ApiResponse<AuthResponse>> {
    return this.request('/api/auth/cadastro', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Login
  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/api/health');
  }

  // Cronogramas
  async getCronogramas(params: {
    page?: number;
    limit?: number;
    mes?: number;
    ano?: number;
  } = {}): Promise<ApiResponse<PaginatedResponse<Cronograma>>> {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();
    
    const endpoint = `/api/cronogramas${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getCronograma(id: string): Promise<ApiResponse<Cronograma>> {
    return this.request(`/api/cronogramas/${id}`);
  }

  async createCronograma(data: CreateCronogramaData): Promise<ApiResponse<Cronograma>> {
    return this.request('/api/cronogramas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCronograma(
    id: string, 
    data: UpdateCronogramaData
  ): Promise<ApiResponse<Cronograma>> {
    return this.request(`/api/cronogramas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCronograma(id: string): Promise<ApiResponse<null>> {
    // O tipo de retorno genérico é ajustado para corresponder ao que `request` pode retornar
    return this.request<null>(`/api/cronogramas/${id}`, {
      method: 'DELETE',
    });
  }

  // Atividades
  async getAtividades(
    cronogramaId: string,
    params: {
      page?: number;
      limit?: number;
      diaSemana?: string;
      dataInicio?: string;
      dataFim?: string;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<Atividade>>> {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();
    
    const endpoint = `/api/cronogramas/${cronogramaId}/atividades${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getAtividade(id: string): Promise<ApiResponse<Atividade>> {
    return this.request(`/api/atividades/${id}`);
  }

  async createAtividade(
    cronogramaId: string,
    data: CreateAtividadeData
  ): Promise<ApiResponse<Atividade>> {
    return this.request(`/api/cronogramas/${cronogramaId}/atividades`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Overload para compatibilidade com chamadas que passam apenas cronogramaId
  async createAtividadeCompat(cronogramaId: string): Promise<ApiResponse<Atividade>> {
    throw new Error('createAtividade requires both cronogramaId and data parameters');
  }

  async updateAtividade(
    id: string,
    data: UpdateAtividadeData
  ): Promise<ApiResponse<Atividade>> {
    return this.request(`/api/atividades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAtividade(id: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/api/atividades/${id}`, {
      method: 'DELETE',
    });
  }

  // PDF Generation
  async generatePDF(cronogramaId: string): Promise<ApiResponse<{ pdfBase64: string }>> {
    return this.request(`/api/cronogramas/${cronogramaId}/pdf`, {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
export default api;