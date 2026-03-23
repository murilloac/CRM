# Configuração do Sistema de Email

##  Passos para Ativar o Email Automático

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Configurar Gmail - Senha de App
1. Acesse: https://myaccount.google.com/security
2. Ative a **Verificação em 2 etapas**
3. Vá em **Senhas de app**
4. Selecione **Outro (nome personalizado)**
5. Digite: "CRM Sistema"
6. Copie a senha gerada (16 caracteres)

### 3. Configurar Arquivo .env
Edite o arquivo `.env` e substitua:
```
EMAIL_PASS=SUA_SENHA_DE_APP_AQUI
```
Por:
```
EMAIL_PASS=sua_senha_de_16_caracteres_aqui
```

### 4. Testar Configuração
Execute no terminal do backend:
```bash
node -e "require('./emailService').testarConfiguracao()"
```

### 5. Reiniciar Servidor
```bash
npm start
```

##  Como Funciona

- Quando um chamado é alterado para status **"finalizado"**
- O sistema automaticamente envia um email para o solicitante
- Email contém: protocolo, detalhes do chamado, analista responsável
- Template profissional com cores da AzShip

##  Troubleshooting

**Erro "Invalid login":**
- Verifique se a verificação em 2 etapas está ativa
- Confirme se usou a senha de app (não a senha normal)

**Email não enviado:**
- Verifique logs do servidor
- Confirme se o chamado tem email cadastrado
- Teste a configuração com o comando acima

##  Logs
O sistema registra no console:
- ✅ Email enviado com sucesso
- ❌ Erros de envio
- 📧 ID da mensagem enviada