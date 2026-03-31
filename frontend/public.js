// ===============================
// Envio do formulário público
// ===============================
document.getElementById('formChamado').addEventListener('submit', async (e) => {
  e.preventDefault()

  const solicitante = document.getElementById('solicitante').value
  const email = document.getElementById('email').value
  const setor = document.getElementById('setor').value
  const descricao = document.getElementById('descricao').value

  const flags = [...document.querySelectorAll('.checkbox-group input:checked')].map((x) => x.value)
  const equipamento = document.querySelector('input[name="equip"]:checked').value

  const prioridade = document.getElementById('prioridade').value

  // Definir SLA baseado na prioridade
  let slaHoras
  switch (prioridade) {
    case 'baixa':
      slaHoras = 72
      break
    case 'media':
      slaHoras = 48
      break
    case 'alta':
      slaHoras = 24
      break
    default:
      slaHoras = 48
  }

  const chamado = {
    solicitante,
    email,
    setor,
    descricao,
    flags,
    equipamento,
    prioridade,
    slaHoras,
    status: 'aberto',
  }

  try {
    // Desabilita botão durante envio
    const btnSubmit = document.querySelector('.btn-submit')
    btnSubmit.disabled = true
    btnSubmit.innerHTML = '⏳ Enviando...'

    const response = await fetch('http://host67.expnac.local:3003/chamados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chamado),
    })

    if (response.ok) {
      const result = await response.json()
      mostrarSucesso(result.id)
    } else {
      throw new Error('Erro no servidor')
    }
  } catch (error) {
    alert('Erro ao enviar chamado. Tente novamente.')
    console.error('Erro:', error)
  } finally {
    // Reabilita botão
    const btnSubmit = document.querySelector('.btn-submit')
    btnSubmit.disabled = false
    btnSubmit.innerHTML = '🚀 Abrir Chamado'
  }
})

// ===============================
// Mostrar mensagem de sucesso
// ===============================
function mostrarSucesso(id) {
  const protocolo = `#${String(id).padStart(4, '0')}`
  const prioridade = document.getElementById('prioridade').value

  let slaTexto
  switch (prioridade) {
    case 'baixa':
      slaTexto = 'Até 72 horas'
      break
    case 'media':
      slaTexto = 'Até 48 horas'
      break
    case 'alta':
      slaTexto = 'Até 24 horas'
      break
    default:
      slaTexto = 'Até 48 horas'
  }

  document.getElementById('protocoloNumero').textContent = protocolo
  document.querySelector('.sla-info p').innerHTML =
    `🕰️ <strong>Tempo de resposta:</strong> ${slaTexto}`
  document.getElementById('successMessage').classList.remove('hidden')
}

// ===============================
// Funções Utilitárias
// ===============================
function novoChamado() {
  document.getElementById('formChamado').reset()
  document.getElementById('successMessage').classList.add('hidden')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function limparFormulario() {
  if (confirm('Tem certeza que deseja limpar todos os campos?')) {
    document.getElementById('formChamado').reset()
  }
}

function copiarProtocolo() {
  const protocolo = document.getElementById('protocoloNumero').textContent
  navigator.clipboard.writeText(protocolo).then(() => {
    const btn = document.querySelector('.btn-copy')
    const originalText = btn.innerHTML
    btn.innerHTML = '✅'
    setTimeout(() => (btn.innerHTML = originalText), 2000)
  })
}

function consultarChamado() {
  document.getElementById('consultaModal').classList.remove('hidden')
}

function fecharConsulta() {
  document.getElementById('consultaModal').classList.add('hidden')
  document.getElementById('resultadoConsulta').innerHTML = ''
}

async function buscarChamado() {
  const protocolo = document.getElementById('protocoloConsulta').value.replace('#', '')
  const resultado = document.getElementById('resultadoConsulta')

  if (!protocolo) {
    resultado.innerHTML = '<p class="error">Digite um número de protocolo</p>'
    return
  }

  try {
    const response = await fetch(`http://host67.expnac.local:3003/chamados/${protocolo}`)

    if (response.ok) {
      const chamado = await response.json()
      resultado.innerHTML = `
                <div class="chamado-info">
                    <h4>Status: ${chamado.status.toUpperCase()}</h4>
                    <p><strong>Solicitante:</strong> ${chamado.solicitante}</p>
                    <p><strong>Setor:</strong> ${chamado.setor}</p>
                    <p><strong>Descrição:</strong> ${chamado.descricao}</p>
                    <p><strong>Analista:</strong> ${chamado.analista || 'Não atribuído'}</p>
                </div>
            `
    } else {
      resultado.innerHTML = '<p class="error">Chamado não encontrado</p>'
    }
  } catch (error) {
    resultado.innerHTML = '<p class="error">Erro ao consultar chamado</p>'
  }
}

// ===============================
// Contador de caracteres
// ===============================
document.getElementById('descricao').addEventListener('input', (e) => {
  const count = e.target.value.length
  const counter = document.getElementById('charCount')
  counter.textContent = count

  if (count > 450) {
    counter.style.color = '#dc3545'
  } else if (count > 350) {
    counter.style.color = '#ffc107'
  } else {
    counter.style.color = '#6c757d'
  }
})

// ===============================
// Modo Escuro
// ===============================
function toggleThemePublic() {
  document.body.classList.toggle('dark-theme')
  const isDark = document.body.classList.contains('dark-theme')
  localStorage.setItem('darkThemePublic', isDark)

  const btn = document.getElementById('btnThemePublic')
  btn.innerHTML = isDark ? '🌞' : '🌙'
}

function loadThemePublic() {
  const isDark = localStorage.getItem('darkThemePublic') === 'true'
  if (isDark) {
    document.body.classList.add('dark-theme')
    document.getElementById('btnThemePublic').innerHTML = '🌞'
  }
}

// ===============================
// Validação em tempo real
// ===============================
function setupValidation() {
  const inputs = document.querySelectorAll('input[required], textarea[required], select[required]')

  inputs.forEach((input) => {
    input.addEventListener('blur', validateField)
    input.addEventListener('input', clearError)
  })
}

function validateField(e) {
  const field = e.target
  const value = field.value.trim()

  if (!value) {
    showFieldError(field, 'Este campo é obrigatório')
  } else if (field.type === 'email' && !isValidEmail(value)) {
    showFieldError(field, 'Digite um email válido')
  } else {
    clearFieldError(field)
  }
}

function showFieldError(field, message) {
  clearFieldError(field)
  field.classList.add('error')

  const errorDiv = document.createElement('div')
  errorDiv.className = 'field-error'
  errorDiv.textContent = message
  field.parentNode.appendChild(errorDiv)
}

function clearFieldError(field) {
  field.classList.remove('error')
  const errorDiv = field.parentNode.querySelector('.field-error')
  if (errorDiv) errorDiv.remove()
}

function clearError(e) {
  clearFieldError(e.target)
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ===============================
// Inicialização
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  loadThemePublic()
  setupValidation()

  // Fechar modal clicando fora
  document.getElementById('consultaModal').addEventListener('click', (e) => {
    if (e.target.id === 'consultaModal') {
      fecharConsulta()
    }
  })
})
