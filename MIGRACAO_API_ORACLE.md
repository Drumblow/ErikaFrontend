# 🚀 Migração da API - Vercel para Oracle Cloud

## 📋 Resumo das Alterações

A API foi migrada do Vercel para o Oracle Cloud Free Tier. Todas as configurações do frontend foram atualizadas para apontar para o novo servidor.

### 🔧 Alterações Realizadas

#### 1. **Configuração Principal da API**
- **Arquivo:** `src/services/api.ts`
- **Mudança:** 
  - ❌ Antes: `https://erika-ubsf.vercel.app`
  - ✅ Agora: `http://152.70.219.71:8080`

#### 2. **Documentação Atualizada**
- **Arquivo:** `FRONTEND_GUIDE.md`
- **Mudanças:** Todas as referências da API foram atualizadas para o novo endereço

#### 3. **Configuração Android**
- **Arquivo:** `android/app/src/main/AndroidManifest.xml`
- **Mudança:** Adicionado `android:usesCleartextTraffic="true"`
- **Motivo:** Necessário para permitir conexões HTTP (não HTTPS) no Android

## 🌐 Novo Endereço da API

```
Servidor: 152.70.219.71
Porta: 8080
URL Base: http://152.70.219.71:8080
Aplicação: cronograma-ubsf-8080
```

## ⚠️ Considerações Importantes

### 1. **Segurança**
- A API agora usa HTTP em vez de HTTPS
- Para produção, recomenda-se configurar HTTPS no servidor Oracle

### 2. **Android**
- Adicionada configuração `usesCleartextTraffic="true"` para permitir HTTP
- Esta configuração é necessária para Android API 28+

### 3. **Testes Necessários**
Após a migração, teste os seguintes fluxos:
- [ ] Cadastro de usuário
- [ ] Login
- [ ] Listagem de cronogramas
- [ ] Criação de cronograma
- [ ] Edição de cronograma
- [ ] Geração de PDF

## 🔄 Como Reverter (se necessário)

Se precisar reverter para o Vercel:

1. **Alterar API_BASE_URL em `src/services/api.ts`:**
   ```typescript
   const API_BASE_URL = 'https://erika-ubsf.vercel.app';
   ```

2. **Remover configuração Android:**
   ```xml
   <!-- Remover android:usesCleartextTraffic="true" -->
   ```

## 📱 Próximos Passos

1. **Testar a aplicação** em desenvolvimento
2. **Verificar conectividade** com o servidor Oracle
3. **Monitorar logs** para identificar possíveis problemas
4. **Considerar implementar HTTPS** no servidor Oracle para produção

## 🆘 Troubleshooting

### Problema: "Network request failed"
- **Causa:** Servidor Oracle pode estar offline
- **Solução:** Verificar se o servidor está rodando na porta 8080

### Problema: "Connection refused"
- **Causa:** Firewall ou porta bloqueada
- **Solução:** Verificar configurações de firewall no Oracle Cloud

### Problema: App não conecta no Android
- **Causa:** Configuração de cleartext traffic
- **Solução:** Verificar se `android:usesCleartextTraffic="true"` está presente

---

**Data da Migração:** $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Responsável:** Sistema automatizado