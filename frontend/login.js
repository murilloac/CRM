// ===============================
// Credenciais de acesso (apenas padrão)
// ===============================
const credenciaisPadrao = {
    'admin': 'admin2025',
    'dayane': 'dayane123',
    'felipe': 'felipe123',
    'rafael': 'rafael123',
    'yul': 'yul123',
    'alex': 'alex123'
};

// ===============================
// Gerar token de sessão
// ===============================
function gerarToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ===============================
// Verificar se já está logado
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    const loggedIn = localStorage.getItem('crmLoggedIn');
    const token = sessionStorage.getItem('crmToken');
    const usuario = sessionStorage.getItem('crmUser');
    
    if (loggedIn === 'true' && token && usuario) {
        window.location.href = 'index.html';
    }
});

// ===============================
// Processar login
// ===============================
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const usuario = document.getElementById('usuario').value.toLowerCase();
    const senha = document.getElementById('senha').value;
    const errorDiv = document.getElementById('errorMessage');
    const btnLogin = document.querySelector('.btn-login');
    
    // Feedback visual
    btnLogin.disabled = true;
    btnLogin.innerHTML = '⏳ Verificando...';
    
    // Simula delay de verificação
    setTimeout(async () => {
        // Verifica senha com hash
        // Verifica senha personalizada ou padrão
        const credenciaisLocal = JSON.parse(localStorage.getItem('credenciaisPersonalizadas') || '{}');
        const senhaCorreta = credenciaisLocal[usuario] || credenciaisPadrao[usuario];
        const senhaValida = senhaCorreta && senhaCorreta === senha;
        
        if (senhaValida) {
            // Login bem-sucedido
            const token = gerarToken();
            
            // Limpa dados anteriores
            localStorage.removeItem('crmLoggedIn');
            sessionStorage.clear();
            
            // Define novos dados
            sessionStorage.setItem('crmToken', token);
            sessionStorage.setItem('crmUser', usuario);
            localStorage.setItem('crmLoggedIn', 'true');
            
            btnLogin.innerHTML = '✅ Acesso Liberado!';
            btnLogin.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } else {
            // Login falhou
            errorDiv.classList.remove('hidden');
            btnLogin.disabled = false;
            btnLogin.innerHTML = '🚀 Entrar no Sistema';
            
            // Remove erro após 3 segundos
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 3000);
        }
    }, 1000);
});