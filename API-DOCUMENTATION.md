# 📚 Documentação da API - Cronograma UBSF

## 🌐 Informações Gerais

**Base URL:** `https://drumblow.mooo.com`  
**Versão:** 1.0.0  
**Formato de Resposta:** JSON  
**Autenticação:** JWT Bearer Token  

### 📋 Estrutura de Resposta Padrão

Todas as respostas seguem o formato:

```json
{
  "success": boolean,
  "message": "string",
  "data": object | array | null,
  "timestamp": "ISO 8601 string"
}
```

### 🔐 Autenticação

A maioria das rotas requer autenticação via JWT Token no header:

```
Authorization: Bearer <seu_token_jwt>
```

### 🌍 CORS

Origens permitidas:
- `https://erika-frontend.vercel.app`
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:8080`
- `http://localhost:8081`
- `https://erika-ubsf.vercel.app`

---

## 🔍 Rotas Públicas (Sem Autenticação)

### 1. Health Check

**GET** `/api/health`

**Descrição:** Verifica o status da API e conexão com banco de dados.

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "API está funcionando",
  "data": {
    "status": "OK",
    "timestamp": "2024-12-20T15:30:00.000Z",
    "version": "1.0.0",
    "database": "Connected",
    "environment": "production"
  },
  "timestamp": "2024-12-20T15:30:00.000Z"
}
```

### 2. Status do PDF

**GET** `/api/pdf-status`

**Descrição:** Retorna informações sobre a implementação de geração de PDF.

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Status do PDF",
  "data": {
    "puppeteer": {
      "status": "ativo",
      "rota": "/api/cronogramas/{id}/pdf",
      "otimizado_para": "Vercel"
    },
    "pdfshift": {
      "status": "legado",
      "rota": "/api/cronogramas/{id}/pdf-pdfshift"
    },
    "migracao_concluida": true
  },
  "timestamp": "2024-12-20T15:30:00.000Z"
}
```

---

## 👤 Autenticação e Usuários

### 3. Cadastro de Usuário

**POST** `/api/auth/cadastro`

**Descrição:** Registra um novo usuário no sistema.

**Body (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha123",
  "nome": "Nome do Usuário",
  "cargo": "enfermeiro" // ou "medico"
}
```

**Validações:**
- `email`: obrigatório, formato de email válido, único
- `senha`: obrigatório, mínimo 6 caracteres
- `nome`: obrigatório
- `cargo`: obrigatório, valores aceitos: "enfermeiro", "medico"

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "message": "Usuário cadastrado com sucesso",
  "data": {
    "usuario": {
      "id": "clx1234567890",
      "email": "usuario@exemplo.com",
      "nome": "Nome do Usuário",
      "cargo": "enfermeiro",
      "criadoEm": "2024-12-20T15:30:00.000Z",
      "atualizadoEm": "2024-12-20T15:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-12-20T15:30:00.000Z"
}
```

**Erros Possíveis:**
- `400`: Dados obrigatórios não fornecidos
- `409`: Email já existe

### 4. Login

**POST** `/api/auth/login`

**Descrição:** Autentica um usuário e retorna token JWT.

**Body (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "usuario": {
      "id": "clx1234567890",
      "email": "usuario@exemplo.com",
      "nome": "Nome do Usuário",
      "cargo": "enfermeiro",
      "criadoEm": "2024-12-20T15:30:00.000Z",
      "atualizadoEm": "2024-12-20T15:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-12-20T15:30:00.000Z"
}
```

**Erros Possíveis:**
- `400`: Email ou senha não fornecidos
- `401`: Credenciais inválidas

### 5. Atualizar Usuário

**PUT** `/api/auth/usuarios/{id}`

**Descrição:** Atualiza dados do usuário autenticado.

**Headers:** `Authorization: Bearer <token>`

**Body (JSON) - Todos os campos são opcionais:**
```json
{
  "nome": "Novo Nome",
  "cargo": "medico"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Usuário atualizado com sucesso",
  "data": {
    "id": "clx1234567890",
    "email": "usuario@exemplo.com",
    "nome": "Novo Nome",
    "cargo": "medico",
    "criadoEm": "2024-12-20T15:30:00.000Z",
    "atualizadoEm": "2024-12-20T15:35:00.000Z"
  },
  "timestamp": "2024-12-20T15:35:00.000Z"
}
```

### 6. Excluir Usuário

**DELETE** `/api/auth/usuarios/{id}`

**Descrição:** Exclui o usuário autenticado e todos os seus cronogramas.

**Headers:** `Authorization: Bearer <token>`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Usuário excluído com sucesso",
  "data": null,
  "timestamp": "2024-12-20T15:35:00.000Z"
}
```

---

## 📅 Cronogramas

### 7. Listar Cronogramas

**GET** `/api/cronogramas`

**Descrição:** Lista todos os cronogramas do usuário autenticado.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters (opcionais):**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 10, máximo: 50)
- `mes`: filtrar por mês (1-12)
- `ano`: filtrar por ano

**Exemplo:** `/api/cronogramas?page=1&limit=10&ano=2024`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Cronogramas listados com sucesso",
  "data": {
    "cronogramas": [
      {
        "id": "clx1234567890",
        "mes": 12,
        "ano": 2024,
        "nomeUBSF": "UBSF Centro",
        "enfermeiro": "João Silva",
        "medico": "Dr. Maria Santos",
        "usuarioId": "clx0987654321",
        "criadoEm": "2024-12-20T15:30:00.000Z",
        "atualizadoEm": "2024-12-20T15:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2024-12-20T15:30:00.000Z"
}
```

### 8. Criar Cronograma

**POST** `/api/cronogramas`

**Descrição:** Cria um novo cronograma para o usuário autenticado.

**Headers:** `Authorization: Bearer <token>`

**Body (JSON):**
```json
{
  "mes": 12,
  "ano": 2024,
  "nomeUBSF": "UBSF Centro",
  "enfermeiro": "João Silva",
  "medico": "Dr. Maria Santos"
}
```

**Validações:**
- `mes`: obrigatório, inteiro entre 1-12
- `ano`: obrigatório, inteiro entre 2020-2030
- `nomeUBSF`: opcional, máximo 255 caracteres
- `enfermeiro`: opcional, máximo 255 caracteres
- `medico`: opcional, máximo 255 caracteres

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "message": "Cronograma criado com sucesso",
  "data": {
    "id": "clx1234567890",
    "mes": 12,
    "ano": 2024,
    "nomeUBSF": "UBSF Centro",
    "enfermeiro": "João Silva",
    "medico": "Dr. Maria Santos",
    "usuarioId": "clx0987654321",
    "criadoEm": "2024-12-20T15:30:00.000Z",
    "atualizadoEm": "2024-12-20T15:30:00.000Z"
  },
  "timestamp": "2024-12-20T15:30:00.000Z"
}
```

**Erros Possíveis:**
- `400`: Dados inválidos ou cronograma já existe para o mês/ano
- `401`: Token não fornecido ou inválido

### 9. Buscar Cronograma por ID

**GET** `/api/cronogramas/{id}`

**Descrição:** Busca um cronograma específico com suas atividades.

**Headers:** `Authorization: Bearer <token>`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Cronograma encontrado com sucesso",
  "data": {
    "id": "clx1234567890",
    "mes": 12,
    "ano": 2024,
    "nomeUBSF": "UBSF Centro",
    "enfermeiro": "João Silva",
    "medico": "Dr. Maria Santos",
    "usuarioId": "clx0987654321",
    "criadoEm": "2024-12-20T15:30:00.000Z",
    "atualizadoEm": "2024-12-20T15:30:00.000Z",
    "atividades": [
      {
        "id": "clx1111111111",
        "cronogramaId": "clx1234567890",
        "data": "2024-12-02T00:00:00.000Z",
        "diaSemana": "SEGUNDA-MANHÃ",
        "descricao": "Consultas de rotina",
        "criadoEm": "2024-12-20T15:30:00.000Z"
      }
    ]
  },
  "timestamp": "2024-12-20T15:30:00.000Z"
}
```

**Erros Possíveis:**
- `400`: ID inválido
- `403`: Sem permissão para acessar este cronograma
- `404`: Cronograma não encontrado

### 10. Atualizar Cronograma

**PUT** `/api/cronogramas/{id}`

**Descrição:** Atualiza um cronograma existente.

**Headers:** `Authorization: Bearer <token>`

**Body (JSON) - Todos os campos são opcionais:**
```json
{
  "nomeUBSF": "UBSF Centro Atualizada",
  "enfermeiro": "João Silva Jr.",
  "medico": "Dra. Maria Santos"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Cronograma atualizado com sucesso",
  "data": {
    "id": "clx1234567890",
    "mes": 12,
    "ano": 2024,
    "nomeUBSF": "UBSF Centro Atualizada",
    "enfermeiro": "João Silva Jr.",
    "medico": "Dra. Maria Santos",
    "usuarioId": "clx0987654321",
    "criadoEm": "2024-12-20T15:30:00.000Z",
    "atualizadoEm": "2024-12-20T15:35:00.000Z",
    "atividades": []
  },
  "timestamp": "2024-12-20T15:35:00.000Z"
}
```

### 11. Excluir Cronograma

**DELETE** `/api/cronogramas/{id}`

**Descrição:** Exclui um cronograma e todas as suas atividades.

**Headers:** `Authorization: Bearer <token>`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Cronograma excluído com sucesso",
  "data": null,
  "timestamp": "2024-12-20T15:35:00.000Z"
}
```

---

## 📋 Atividades

### 12. Listar Atividades do Cronograma

**GET** `/api/cronogramas/{id}/atividades`

**Descrição:** Lista todas as atividades de um cronograma específico.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters (opcionais):**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 50, máximo: 50)
- `diaSemana`: filtrar por dia da semana
- `dataInicio`: filtrar por data inicial (formato: YYYY-MM-DD)
- `dataFim`: filtrar por data final (formato: YYYY-MM-DD)

**Valores válidos para `diaSemana`:**
- `SEGUNDA-MANHÃ`, `SEGUNDA-TARDE`
- `TERÇA-MANHÃ`, `TERÇA-TARDE`
- `QUARTA-MANHÃ`, `QUARTA-TARDE`
- `QUINTA-MANHÃ`, `QUINTA-TARDE`
- `SEXTA-MANHÃ`, `SEXTA-TARDE`
- `SÁBADO-MANHÃ`, `SÁBADO-TARDE`

**Exemplo:** `/api/cronogramas/clx123/atividades?diaSemana=SEGUNDA-MANHÃ&dataInicio=2024-12-01&dataFim=2024-12-31`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Atividades listadas com sucesso",
  "data": {
    "atividades": [
      {
        "id": "clx1111111111",
        "cronogramaId": "clx1234567890",
        "data": "2024-12-02T00:00:00.000Z",
        "diaSemana": "SEGUNDA-MANHÃ",
        "descricao": "Consultas de rotina",
        "criadoEm": "2024-12-20T15:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "totalPages": 1
    }
  },
  "timestamp": "2024-12-20T15:30:00.000Z"
}
```

### 13. Criar Atividade

**POST** `/api/cronogramas/{id}/atividades`

**Descrição:** Cria uma nova atividade em um cronograma.

**Headers:** `Authorization: Bearer <token>`

**Body (JSON):**
```json
{
  "data": "2024-12-02T00:00:00.000Z",
  "diaSemana": "SEGUNDA-MANHÃ",
  "descricao": "Consultas de rotina"
}
```

**Validações:**
- `data`: obrigatório, formato de data válido
- `diaSemana`: obrigatório, um dos valores válidos listados acima
- `descricao`: obrigatório, máximo 500 caracteres

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "message": "Atividade criada com sucesso",
  "data": {
    "id": "clx1111111111",
    "cronogramaId": "clx1234567890",
    "data": "2024-12-02T00:00:00.000Z",
    "diaSemana": "SEGUNDA-MANHÃ",
    "descricao": "Consultas de rotina",
    "criadoEm": "2024-12-20T15:30:00.000Z"
  },
  "timestamp": "2024-12-20T15:30:00.000Z"
}
```

**Erros Possíveis:**
- `400`: Dados inválidos ou atividade duplicada
- `404`: Cronograma não encontrado

### 14. Buscar Atividade por ID

**GET** `/api/atividades/{id}`

**Descrição:** Busca uma atividade específica com informações do cronograma.

**Headers:** Não requer autenticação (mas recomendado para segurança)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Atividade encontrada com sucesso",
  "data": {
    "id": "clx1111111111",
    "cronogramaId": "clx1234567890",
    "data": "2024-12-02T00:00:00.000Z",
    "diaSemana": "SEGUNDA-MANHÃ",
    "descricao": "Consultas de rotina",
    "criadoEm": "2024-12-20T15:30:00.000Z",
    "cronograma": {
      "id": "clx1234567890",
      "mes": 12,
      "ano": 2024,
      "nomeUBSF": "UBSF Centro",
      "enfermeiro": "João Silva",
      "medico": "Dr. Maria Santos"
    }
  },
  "timestamp": "2024-12-20T15:30:00.000Z"
}
```

### 15. Atualizar Atividade

**PUT** `/api/atividades/{id}`

**Descrição:** Atualiza uma atividade existente.

**Headers:** Não requer autenticação (mas recomendado para segurança)

**Body (JSON) - Todos os campos são opcionais:**
```json
{
  "data": "2024-12-03T00:00:00.000Z",
  "diaSemana": "TERÇA-MANHÃ",
  "descricao": "Consultas de rotina - atualizada"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Atividade atualizada com sucesso",
  "data": {
    "id": "clx1111111111",
    "cronogramaId": "clx1234567890",
    "data": "2024-12-03T00:00:00.000Z",
    "diaSemana": "TERÇA-MANHÃ",
    "descricao": "Consultas de rotina - atualizada",
    "criadoEm": "2024-12-20T15:30:00.000Z",
    "cronograma": {
      "id": "clx1234567890",
      "mes": 12,
      "ano": 2024,
      "nomeUBSF": "UBSF Centro",
      "enfermeiro": "João Silva",
      "medico": "Dr. Maria Santos"
    }
  },
  "timestamp": "2024-12-20T15:35:00.000Z"
}
```

### 16. Excluir Atividade

**DELETE** `/api/atividades/{id}`

**Descrição:** Exclui uma atividade.

**Headers:** Não requer autenticação (mas recomendado para segurança)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Atividade excluída com sucesso",
  "data": null,
  "timestamp": "2024-12-20T15:35:00.000Z"
}
```

---

## 📄 Geração de PDF

### 17. Gerar PDF do Cronograma

**POST** `/api/cronogramas/{id}/pdf`

**Descrição:** Gera um PDF do cronograma com todas as suas atividades usando Puppeteer. O PDF é gerado automaticamente com base nos dados do cronograma e suas atividades cadastradas.

**Headers:** `Authorization: Bearer <token>`

**Parâmetros de URL:**
- `{id}`: ID do cronograma (string, obrigatório)

**Body:** Não é necessário enviar dados no body da requisição.

**Dados Necessários para Geração:**
Para que o PDF seja gerado corretamente, o cronograma deve conter:

**Dados Obrigatórios do Cronograma:**
```json
{
  "id": "clx1234567890",
  "mes": 1,           // Número de 1 a 12
  "ano": 2024,        // Ano completo
  "nomeUBSF": "UBSF Centro",  // Nome da unidade (string não vazia)
  "enfermeiro": "Dr. João Silva",  // Nome do enfermeiro (string não vazia)
  "medico": "Dra. Maria Santos",   // Nome do médico (string não vazia)
  "usuarioId": "clx0987654321"    // ID do usuário proprietário
}
```

**Dados das Atividades Associadas:**
 ```json
 [
   {
     "id": "clx1111111111",
     "cronogramaId": "clx1234567890",
     "data": "2024-01-15T00:00:00.000Z",  // Data ISO 8601
     "diaSemana": "SEGUNDA-MANHÃ",  // Valores válidos listados abaixo
     "descricao": "Consultas de rotina"  // Descrição da atividade (string não vazia)
   },
   {
     "id": "clx2222222222",
     "cronogramaId": "clx1234567890",
     "data": "2024-01-15T00:00:00.000Z",
     "diaSemana": "SEGUNDA-TARDE",
     "descricao": "Vacinação infantil"
   }
 ]
```

**Valores Válidos para `diaSemana`:**
 ```
 SEGUNDA-MANHÃ    SEGUNDA-TARDE
 TERÇA-MANHÃ      TERÇA-TARDE
 QUARTA-MANHÃ     QUARTA-TARDE
 QUINTA-MANHÃ     QUINTA-TARDE
 SEXTA-MANHÃ      SEXTA-TARDE
 SÁBADO-MANHÃ     SÁBADO-TARDE
 ```
 
 **Validações Importantes:**
 
 1. **Cronograma deve existir** e pertencer ao usuário autenticado
 2. **Campos obrigatórios** não podem estar vazios ou nulos:
    - `mes`: obrigatório (1-12)
    - `ano`: obrigatório (2020-2030)
    - `data`: obrigatório (formato ISO 8601)
    - `diaSemana`: obrigatório (um dos valores listados acima)
    - `descricao`: obrigatório (máximo 500 caracteres)
 3. **Data das atividades** deve estar no formato ISO 8601 (ex: "2024-01-15T00:00:00.000Z")
 4. **Dia da semana** deve corresponder exatamente a um dos valores válidos
 5. **Apenas dias úteis** são processados no PDF (Segunda a Sexta-feira)
 6. **Campos opcionais** do cronograma podem estar vazios: `nomeUBSF`, `enfermeiro`, `medico`

**Cenários de Erro:**
- Cronograma não encontrado → 404
- Cronograma sem permissão → 403  
- Dados inválidos → 400
- Erro na geração → 500

**Requisitos Mínimos para Geração de PDF:**

1. **Cronograma válido** com `mes` e `ano` definidos
2. **Autenticação** válida (token JWT)
3. **Permissão** do usuário sobre o cronograma
4. **Pelo menos uma atividade** é recomendada (PDF pode ser gerado sem atividades, mas ficará vazio)

**Recomendações para Melhor Resultado:**

- Preencher `nomeUBSF`, `enfermeiro` e `medico` para cabeçalho completo
- Adicionar atividades com descrições claras e objetivas
- Usar datas dentro do mês/ano do cronograma
- Distribuir atividades ao longo do mês para melhor visualização

**Processamento Automático:**
- Apenas dias úteis (segunda a sexta) são incluídos no calendário
- Atividades do mesmo dia são automaticamente combinadas quando apropriado
- O layout é otimizado automaticamente baseado na quantidade de atividades
- Imagens e logos são incluídos automaticamente se disponíveis
- Sábados são incluídos no processamento mas podem não aparecer no PDF final

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "PDF gerado com sucesso",
  "data": {
    "pdfBase64": "JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihIZWxsbyBXb3JsZCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago..."
  },
  "timestamp": "2024-12-20T15:30:00.000Z"
}
```

**Formato da Resposta:**
- O PDF é retornado como uma string Base64 no campo `data.pdfBase64`
- Para usar o PDF, você deve decodificar a string Base64
- O arquivo gerado é um PDF completo com layout profissional

**Erros Possíveis:**
- `400`: ID do cronograma inválido
- `401`: Token não fornecido ou inválido
- `403`: Sem permissão para acessar este cronograma
- `404`: Cronograma não encontrado
- `405`: Método não permitido (deve ser POST)
- `500`: Erro na geração do PDF

**Características do PDF Gerado:**
- **Formato:** A4 (210 x 297 mm)
- **Orientação:** Retrato
- **Layout:** Calendário mensal com grade de dias úteis
- **Conteúdo:**
  - Cabeçalho com nome da UBSF
  - Mês e ano do cronograma
  - Nomes do enfermeiro e médico (se fornecidos)
  - Grade de calendário com atividades organizadas por data
  - Formatação automática baseada na quantidade de atividades

**Tempo de Processamento:**
- Esta rota pode demorar 5-15 segundos para responder
- O tempo varia baseado na complexidade do cronograma
- Recomenda-se implementar timeout de pelo menos 30 segundos no frontend

---

## ❌ Códigos de Erro Comuns

### Autenticação
- **401 Unauthorized:**
  - Token não fornecido
  - Token inválido ou expirado
  - Usuário não encontrado

### Validação
- **400 Bad Request:**
  - Dados obrigatórios não fornecidos
  - Formato de dados inválido
  - Violação de regras de negócio

### Permissões
- **403 Forbidden:**
  - Sem permissão para acessar o recurso
  - Tentativa de acessar dados de outro usuário

### Recursos
- **404 Not Found:**
  - Recurso não encontrado
  - Rota inexistente

### Conflitos
- **409 Conflict:**
  - Email já existe (cadastro)
  - Cronograma já existe para o mês/ano
  - Atividade duplicada

### Servidor
- **500 Internal Server Error:**
  - Erro interno do servidor
  - Falha na conexão com banco de dados

---

## 🔧 Exemplos de Uso com JavaScript

### Configuração Base

```javascript
const API_BASE_URL = 'https://drumblow.mooo.com';

// Função para fazer requisições autenticadas
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Erro na requisição');
  }
  
  return data;
}
```

### Exemplo: Login

```javascript
async function login(email, senha) {
  try {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    
    // Salvar token
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.usuario));
    
    return response.data;
  } catch (error) {
    console.error('Erro no login:', error.message);
    throw error;
  }
}
```

### Exemplo: Criar Cronograma

```javascript
async function criarCronograma(dadosCronograma) {
  try {
    const response = await apiRequest('/api/cronogramas', {
      method: 'POST',
      body: JSON.stringify(dadosCronograma)
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao criar cronograma:', error.message);
    throw error;
  }
}

// Uso
const novoCronograma = await criarCronograma({
  mes: 12,
  ano: 2024,
  nomeUBSF: 'UBSF Centro',
  enfermeiro: 'João Silva',
  medico: 'Dr. Maria Santos'
});
```

### Exemplo: Listar Cronogramas com Filtros

```javascript
async function listarCronogramas(filtros = {}) {
  const params = new URLSearchParams();
  
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  const endpoint = `/api/cronogramas${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await apiRequest(endpoint);
    return response.data;
  } catch (error) {
    console.error('Erro ao listar cronogramas:', error.message);
    throw error;
  }
}

// Uso
const cronogramas = await listarCronogramas({
  page: 1,
  limit: 10,
  ano: 2024
});
```

### Exemplo: Download de PDF

```javascript
async function downloadPDF(cronogramaId) {
  const token = localStorage.getItem('authToken');
  
  try {
    // Fazer requisição para gerar PDF
    const response = await fetch(`${API_BASE_URL}/api/cronogramas/${cronogramaId}/pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao gerar PDF');
    }
    
    // Obter resposta JSON com PDF em Base64
    const data = await response.json();
    
    if (!data.success || !data.data.pdfBase64) {
      throw new Error('PDF não foi gerado corretamente');
    }
    
    // Converter Base64 para Blob
    const pdfBase64 = data.data.pdfBase64;
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    // Criar URL e fazer download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cronograma-${cronogramaId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return data;
    
  } catch (error) {
    console.error('Erro ao baixar PDF:', error.message);
    throw error;
  }
}

// Exemplo com loading e tratamento de erro
async function downloadPDFWithLoading(cronogramaId) {
  // Mostrar loading
  const loadingElement = document.getElementById('pdf-loading');
  if (loadingElement) loadingElement.style.display = 'block';
  
  try {
    await downloadPDF(cronogramaId);
    
    // Mostrar sucesso
    alert('PDF baixado com sucesso!');
    
  } catch (error) {
    // Mostrar erro
    alert(`Erro ao gerar PDF: ${error.message}`);
    
  } finally {
    // Esconder loading
    if (loadingElement) loadingElement.style.display = 'none';
  }
}

// Exemplo para visualizar PDF em nova aba
async function viewPDFInNewTab(cronogramaId) {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/cronogramas/${cronogramaId}/pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success && data.data.pdfBase64) {
      // Converter Base64 para Blob
      const byteCharacters = atob(data.data.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Abrir em nova aba
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Limpar URL após um tempo
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    }
    
  } catch (error) {
    console.error('Erro ao visualizar PDF:', error.message);
    throw error;
  }
}
```

---

## 📱 Considerações para Frontend

### Gerenciamento de Estado

1. **Token JWT:**
   - Armazenar no localStorage ou sessionStorage
   - Verificar expiração (24h)
   - Implementar refresh automático ou logout

2. **Dados do Usuário:**
   - Manter informações básicas em contexto/store
   - Atualizar após mudanças no perfil

### Tratamento de Erros

1. **Interceptadores:**
   - Implementar interceptador para respostas 401 (logout automático)
   - Tratar erros de rede
   - Mostrar mensagens amigáveis ao usuário

2. **Validação:**
   - Validar dados no frontend antes de enviar
   - Usar os mesmos critérios da API
   - Feedback visual para campos inválidos

### Performance

1. **Paginação:**
   - Implementar scroll infinito ou paginação tradicional
   - Cache de páginas já carregadas

2. **Filtros:**
   - Debounce em campos de busca
   - Persistir filtros na URL

3. **PDF:**
   - Mostrar loading durante geração
   - Implementar timeout adequado

### UX/UI

1. **Loading States:**
   - Skeleton screens para listas
   - Spinners para ações
   - Disable buttons durante requisições

2. **Feedback:**
   - Toast notifications para sucesso/erro
   - Confirmações para ações destrutivas
   - Indicadores visuais de estado

---

## 🔒 Segurança

### Headers Recomendados

```javascript
// Headers de segurança para todas as requisições
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
};
```

### Validação de Dados

1. **Sanitização:**
   - Escapar HTML em campos de texto
   - Validar formatos de data
   - Limitar tamanho de strings

2. **Autorização:**
   - Verificar permissões antes de mostrar ações
   - Não confiar apenas na UI para segurança

---

## 📞 Suporte

Para dúvidas ou problemas:

1. **Health Check:** Sempre verificar `/api/health` primeiro
2. **Logs:** Verificar console do navegador para erros
3. **Status Codes:** Usar códigos HTTP para diagnóstico
4. **Documentação:** Esta documentação é a fonte oficial

---

**Última atualização:** 20 de dezembro de 2024  
**Versão da API:** 1.0.0  
**Ambiente:** Produção (https://drumblow.mooo.com)