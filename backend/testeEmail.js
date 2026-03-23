const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔍 Testando configuração de email...');
console.log('📧 Email:', process.env.EMAIL_USER);
console.log('🔑 Senha configurada:', process.env.EMAIL_PASS ? 'SIM' : 'NÃO');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function testar() {
    try {
        console.log('⏳ Verificando conexão...');
        await transporter.verify();
        console.log('✅ Configuração válida! Email funcionando.');
        
        // Teste de envio
        console.log('📤 Enviando email de teste...');
        const result = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: 'murillo.azship@gmail.com', // Envia para você mesmo
            subject: '✅ Teste CRM - Email Funcionando',
            html: '<h2>🎉 Parabéns!</h2><p>O sistema de email do CRM está funcionando perfeitamente!</p>'
        });
        
        console.log('✅ Email enviado com sucesso! ID:', result.messageId);
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
        
        if (error.code === 'EAUTH') {
            console.log('🔧 Solução: Verifique se a senha de app está correta');
        } else if (error.code === 'ENOTFOUND') {
            console.log('🔧 Solução: Verifique sua conexão com a internet');
        }
    }
}

testar();