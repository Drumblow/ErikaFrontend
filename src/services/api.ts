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

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('API Request:', config.method || 'GET', url);
      console.log('API Config:', config);
      
      const response = await fetch(url, config);
      
      console.log('API Response Status:', response.status);

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
      console.error('API Request Error:', error);
      throw error;
    }
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