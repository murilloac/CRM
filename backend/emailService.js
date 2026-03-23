const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuração do transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Template de email para chamado finalizado
function gerarTemplateFinalizacao(chamado) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; }
            .header { background: #f40f2b; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 10px; }
            .protocol { font-size: 20px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>✅ Chamado Finalizado</h2>
                <div class="protocol">#${String(chamado.id).padStart(4, '0')}</div>
            </div>
            
            <div class="content">
                <p>Olá <strong>${chamado.solicitante}</strong>,</p>
                
                <p>Seu chamado foi <strong>FINALIZADO</strong> com sucesso!</p>
                
                <p><strong>Número do Chamado:</strong> #${String(chamado.id).padStart(4, '0')}</p>
                <p><strong>Descrição:</strong> ${chamado.descricao}</p>
                
                <p>Atenciosamente,<br><strong>Equipe de Suporte TI - AzShip</strong></p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Função para enviar email de finalização
async function enviarEmailFinalizacao(chamado) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: chamado.email,
            subject: `✅ Chamado Finalizado - Protocolo #${String(chamado.id).padStart(4, '0')}`,
            html: gerarTemplateFinalizacao(chamado)
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`📧 Email enviado para ${chamado.email} - ID: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
        
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        return { success: false, error: error.message };
    }
}

// Função para testar configuração de email
async function testarConfiguracao() {
    try {
        await transporter.verify();
        console.log('✅ Configuração de email válida');
        return true;
    } catch (error) {
        console.error('❌ Erro na configuração de email:', error);
        return false;
    }
}

module.exports = {
    enviarEmailFinalizacao,
    testarConfiguracao
};