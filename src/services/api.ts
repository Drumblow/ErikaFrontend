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

const API_BASE_URL = 'https://erika-ubsf.vercel.app';

// Callback para logout automático
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

class ApiService {
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        // Se for erro 401 (não autorizado), chamar callback de logout
        if (response.status === 401 && logoutCallback) {
          logoutCallback();
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/api/health');
  }

  // Authentication
  async login(credentials: { email: string; senha: string }): Promise<ApiResponse<{ token: string; usuario: any }>> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async cadastro(userData: { nome: string; email: string; senha: string; cargo: string }): Promise<ApiResponse<{ token: string; usuario: any }>> {
    return this.request('/api/auth/cadastro', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
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
    return this.request(`/api/cronogramas/${id}`, {
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
    return this.request(`/api/atividades/${id}`, {
      method: 'DELETE',
    });
  }

  // PDF Generation
  async generatePDF(cronogramaId: string): Promise<ApiResponse<{ pdfUrl?: string; pdfBase64?: string }>> {
    return this.request(`/api/cronogramas/${cronogramaId}/pdf`, {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
export default api;