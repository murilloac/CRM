# Sistema CRM

## Configuração Inicial

### 1. Configurar URL da API

Copie o arquivo de exemplo e configure a URL do seu servidor:

```bash
cd frontend
copy config.example.js config.js
```

Edite o arquivo `config.js` e defina a URL do seu servidor:

```javascript
const API_CONFIG = {
  baseURL: 'http://localhost:6000',
  // ou
  // baseURL: 'http://192.168.1.100:6000',
  // baseURL: 'http://seu-servidor.local:6000',
}
```

### 2. Configurar Credenciais do Frontend

Copie o arquivo de exemplo e configure suas credenciais:

```bash
cd frontend
copy credentials.example.js credentials.js
```

Edite o arquivo `credentials.js` e adicione suas credenciais:

```javascript
const credentials = {
  admin: 'sua_senha_segura',
  usuario1: 'senha1',
  usuario2: 'senha2',
}
```

### 2. Configurar Variáveis de Ambiente do Backend

O arquivo `.env` já está configurado no backend. Verifique as configurações de email se necessário.

### 3. Instalar Dependências

```bash
cd backend
npm install
```

### 4. Iniciar o Servidor

```bash
cd backend
npm start
```

O servidor estará disponível em: http://host67:6000/

## Segurança

- ⚠️ **NUNCA** commite o arquivo `credentials.js`
- ⚠️ **NUNCA** commite o arquivo `.env`
- ⚠️ **NUNCA** commite o banco de dados `crm.db`

Estes arquivos estão protegidos pelo `.gitignore`
