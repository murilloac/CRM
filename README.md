# Sistema CRM

## Configuração Inicial

### 1. Configurar Credenciais do Frontend

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

O servidor estará disponível em: http://host67.expnac.local:6000/

## Segurança

- ⚠️ **NUNCA** commite o arquivo `credentials.js`
- ⚠️ **NUNCA** commite o arquivo `.env`
- ⚠️ **NUNCA** commite o banco de dados `crm.db`

Estes arquivos estão protegidos pelo `.gitignore`
