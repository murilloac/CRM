# 🚀 Guia Rápido de Configuração

## Arquivos de Configuração

### 📁 Frontend

#### 1. config.js (URL da API)
```javascript
const API_CONFIG = {
  baseURL: 'http://localhost:6000'
}
```

**Como configurar:**
```bash
cd frontend
copy config.example.js config.js
# Edite config.js com a URL do seu servidor
```

#### 2. credentials.js (Credenciais de Login)
```javascript
const credentials = {
  admin: 'admin2025',
  usuario1: 'senha1',
}
```

**Como configurar:**
```bash
cd frontend
copy credentials.example.js credentials.js
# Edite credentials.js com suas credenciais
```

### 📁 Backend

#### 3. .env (Configurações de Email)
Já existe no backend. Verifique as configurações de SMTP se necessário.

## 🔒 Segurança

Estes arquivos estão protegidos pelo `.gitignore`:
- ✅ `frontend/config.js`
- ✅ `frontend/credentials.js`
- ✅ `backend/.env`
- ✅ `backend/crm.db`

## 📝 Checklist de Instalação

- [ ] Copiar `config.example.js` para `config.js`
- [ ] Configurar URL da API no `config.js`
- [ ] Copiar `credentials.example.js` para `credentials.js`
- [ ] Configurar usuários e senhas no `credentials.js`
- [ ] Instalar dependências: `cd backend && npm install`
- [ ] Iniciar servidor: `npm start`
- [ ] Acessar: http://localhost:6000 (ou sua URL configurada)

## 🌐 Exemplos de URLs

**Desenvolvimento Local:**
```javascript
baseURL: 'http://localhost:6000'
```

**Rede Local:**
```javascript
baseURL: 'http://192.168.1.100:6000'
```

**Servidor Interno:**
```javascript
baseURL: 'http://host67.expnac.local:6000'
```

## ⚠️ Importante

Nunca commite os arquivos:
- `config.js`
- `credentials.js`
- `.env`
- `crm.db`

Eles contêm informações sensíveis e específicas do seu ambiente!
