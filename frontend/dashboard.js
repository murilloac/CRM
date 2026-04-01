// ===============================
// 1. Carregar dados do backend
// ===============================
let dadosChamados = []

async function carregarDados() {
  try {
    const res = await fetch(`${API_CONFIG.baseURL}/chamados`)
    dadosChamados = await res.json()

    atualizarCards()
    criarGraficos()
    criarTabelas()
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
    document.getElementById('totalAberto').textContent = '0'
    document.getElementById('totalAtendimento').textContent = '0'
    document.getElementById('totalFinalizado').textContent = '0'
    document.getElementById('totalCancelado').textContent = '0'
  }
}

// ===============================
// 2. Atualizar cards de resumo
// ===============================
function atualizarCards() {
  const stats = {
    aberto: dadosChamados.filter((c) => c.status === 'aberto').length,
    atendimento: dadosChamados.filter((c) => c.status === 'atendimento').length,
    finalizado: dadosChamados.filter((c) => c.status === 'finalizado').length,
    cancelado: dadosChamados.filter((c) => c.status === 'cancelado').length,
  }

  document.getElementById('totalAberto').textContent = stats.aberto
  document.getElementById('totalAtendimento').textContent = stats.atendimento
  document.getElementById('totalFinalizado').textContent = stats.finalizado
  document.getElementById('totalCancelado').textContent = stats.cancelado

  atualizarMetricasSLA()
}

function atualizarMetricasSLA() {
  if (!dadosChamados || dadosChamados.length === 0) {
    document.getElementById('slaVencidos').textContent = '0'
    document.getElementById('slaProximos').textContent = '0'
    document.getElementById('tempoMedio').textContent = '0h'
    return
  }

  const agora = new Date()
  let vencidos = 0
  let proximos = 0

  const chamadosAtivos = dadosChamados.filter(
    (c) => c.status !== 'finalizado' && c.status !== 'cancelado',
  )

  chamadosAtivos.forEach((chamado) => {
    const prioridade = chamado.prioridade || 'media'
    const slaHoras = prioridade === 'alta' ? 24 : prioridade === 'baixa' ? 72 : 48

    const criadoEm = chamado.created_at ? new Date(chamado.created_at) : agora
    const horasDecorridas = (agora - criadoEm) / (1000 * 60 * 60)

    if (horasDecorridas > slaHoras) {
      vencidos++
    } else if (horasDecorridas > slaHoras - 4) {
      proximos++
    }
  })

  const chamadosComFinalizacao = dadosChamados.filter(
    (c) => c.status === 'finalizado' && c.created_at && c.finished_at,
  )
  let tempoMedio = 0

  if (chamadosComFinalizacao.length > 0) {
    const temposResolucao = []

    chamadosComFinalizacao.forEach((c) => {
      const criado = new Date(c.created_at)
      const finalizado = new Date(c.finished_at)
      const tempoHoras = (finalizado - criado) / (1000 * 60 * 60)

      if (tempoHoras > 0) {
        temposResolucao.push(tempoHoras)
      }
    })

    if (temposResolucao.length > 0) {
      const somaTempos = temposResolucao.reduce((acc, tempo) => acc + tempo, 0)
      tempoMedio = Math.round(somaTempos / temposResolucao.length)
    }
  }

  document.getElementById('slaVencidos').textContent = vencidos
  document.getElementById('slaProximos').textContent = proximos
  document.getElementById('tempoMedio').textContent = tempoMedio + 'h'
}

// ===============================
// 3. Criar gráficos
// ===============================
let graficos = {}
let graficosInicializados = false

function criarGraficos() {
  if (!graficosInicializados) {
    try {
      criarGraficoStatus()
      criarGraficoAnalistas()
      criarGraficoSetores()
      criarGraficoAcessos()
      criarGraficoTendencia()
      graficosInicializados = true
    } catch (error) {
      console.error('Erro ao criar gráficos:', error)
    }
  } else {
    atualizarGraficos()
  }
}

function atualizarGraficos() {
  atualizarGraficoStatus()
  atualizarGraficoAnalistas()
  atualizarGraficoSetores()
  atualizarGraficoAcessos()
  atualizarGraficoTendencia()
}

function criarGraficoStatus() {
  if (graficos.status) return
  const ctx = document.getElementById('graficoStatus').getContext('2d')

  const stats = {
    aberto: dadosChamados.filter((c) => c.status === 'aberto').length,
    atendimento: dadosChamados.filter((c) => c.status === 'atendimento').length,
    finalizado: dadosChamados.filter((c) => c.status === 'finalizado').length,
    cancelado: dadosChamados.filter((c) => c.status === 'cancelado').length,
  }

  graficos.status = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Aberto', 'Em Atendimento', 'Finalizado', 'Cancelado'],
      datasets: [
        {
          data: [stats.aberto, stats.atendimento, stats.finalizado, stats.cancelado],
          backgroundColor: ['#ffc107', '#dc3545', '#28a745', '#6c757d'],
          borderWidth: 3,
          borderColor: '#fff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: { size: 12, weight: 'bold' },
          },
        },
      },
    },
  })
}

function criarGraficoAnalistas() {
  if (graficos.analistas) return
  const ctx = document.getElementById('graficoAnalistas').getContext('2d')

  const analistas = ['Dayane', 'Felipe', 'Rafael', 'Yul']
  const dados = analistas.map(
    (analista) => dadosChamados.filter((c) => c.analista === analista).length,
  )

  graficos.analistas = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: analistas,
      datasets: [
        {
          label: 'Chamados Atribuídos',
          data: dados,
          backgroundColor: ['#f40f2b', '#cd1040', '#a41056', '#821068'],
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  })
}

function criarGraficoSetores() {
  if (graficos.setores) return
  const ctx = document.getElementById('graficoSetores').getContext('2d')

  const setores = [...new Set(dadosChamados.map((c) => c.setor))]
  const dados = setores.map((setor) => dadosChamados.filter((c) => c.setor === setor).length)

  graficos.setores = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: setores,
      datasets: [
        {
          label: 'Chamados por Setor',
          data: dados,
          backgroundColor: '#5e117b',
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  })
}

function criarGraficoAcessos() {
  if (graficos.acessos) return
  const ctx = document.getElementById('graficoAcessos').getContext('2d')

  const todosAcessos = dadosChamados.flatMap((c) => c.flags || [])
  const acessosUnicos = [...new Set(todosAcessos)]
  const dados = acessosUnicos.map((acesso) => todosAcessos.filter((a) => a === acesso).length)

  graficos.acessos = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: acessosUnicos,
      datasets: [
        {
          data: dados,
          backgroundColor: ['#f40f2b', '#cd1040', '#a41056', '#821068', '#5e117b'],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: { size: 11 },
          },
        },
      },
    },
  })
}

function atualizarGraficoStatus() {
  if (!graficos.status) return
  const stats = {
    aberto: dadosChamados.filter((c) => c.status === 'aberto').length,
    atendimento: dadosChamados.filter((c) => c.status === 'atendimento').length,
    finalizado: dadosChamados.filter((c) => c.status === 'finalizado').length,
    cancelado: dadosChamados.filter((c) => c.status === 'cancelado').length,
  }

  graficos.status.data.datasets[0].data = [
    stats.aberto,
    stats.atendimento,
    stats.finalizado,
    stats.cancelado,
  ]
  graficos.status.update()
}

function atualizarGraficoAnalistas() {
  if (!graficos.analistas) return
  const analistas = ['Dayane', 'Felipe', 'Rafael', 'Yul']
  const dados = analistas.map(
    (analista) => dadosChamados.filter((c) => c.analista === analista).length,
  )

  graficos.analistas.data.datasets[0].data = dados
  graficos.analistas.update()
}

function atualizarGraficoSetores() {
  if (!graficos.setores) return
  const setores = [...new Set(dadosChamados.map((c) => c.setor))]
  const dados = setores.map((setor) => dadosChamados.filter((c) => c.setor === setor).length)

  graficos.setores.data.labels = setores
  graficos.setores.data.datasets[0].data = dados
  graficos.setores.update()
}

function atualizarGraficoAcessos() {
  if (!graficos.acessos) return
  const todosAcessos = dadosChamados.flatMap((c) => c.flags || [])
  const acessosUnicos = [...new Set(todosAcessos)]
  const dados = acessosUnicos.map((acesso) => todosAcessos.filter((a) => a === acesso).length)

  graficos.acessos.data.labels = acessosUnicos
  graficos.acessos.data.datasets[0].data = dados
  graficos.acessos.update()
}

function criarGraficoTendencia() {
  if (graficos.tendencia) return
  const ctx = document.getElementById('graficoTendencia').getContext('2d')

  const dadosTendencia = calcularDadosTendencia()

  graficos.tendencia = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dadosTendencia.labels,
      datasets: [
        {
          label: 'Abertos',
          data: dadosTendencia.abertos,
          borderColor: '#ffc107',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Finalizados',
          data: dadosTendencia.finalizados,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  })
}

function atualizarGraficoTendencia() {
  if (!graficos.tendencia) return

  const dadosTendencia = calcularDadosTendencia()

  graficos.tendencia.data.labels = dadosTendencia.labels
  graficos.tendencia.data.datasets[0].data = dadosTendencia.abertos
  graficos.tendencia.data.datasets[1].data = dadosTendencia.finalizados
  graficos.tendencia.update()
}

function calcularDadosTendencia() {
  const agora = new Date()
  const mesesNomes = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ]

  const mesAtual = agora.getMonth()
  const anoAtual = agora.getFullYear()
  const mesAno = `${mesesNomes[mesAtual]}/${anoAtual.toString().slice(-2)}`

  let totalCriados = dadosChamados ? dadosChamados.length : 0
  let totalFinalizados = dadosChamados
    ? dadosChamados.filter((c) => c.status === 'finalizado').length
    : 0

  return {
    labels: [mesAno],
    abertos: [totalCriados],
    finalizados: [totalFinalizados],
  }
}

// ===============================
// 4. Criar tabelas de relatórios
// ===============================
function criarTabelas() {
  criarTabelaAnalistas()
  criarTabelaSetores()
  criarTabelaHistorico()
}

function criarTabelaAnalistas() {
  const tbody = document.querySelector('#tabelaAnalistas tbody')
  const analistas = ['Dayane', 'Felipe', 'Rafael', 'Yul']

  tbody.innerHTML = ''

  analistas.forEach((analista) => {
    const chamadosAnalista = dadosChamados.filter((c) => c.analista === analista)

    const stats = {
      aberto: chamadosAnalista.filter((c) => c.status === 'aberto').length,
      atendimento: chamadosAnalista.filter((c) => c.status === 'atendimento').length,
      finalizado: chamadosAnalista.filter((c) => c.status === 'finalizado').length,
      total: chamadosAnalista.length,
    }

    const row = tbody.insertRow()
    row.innerHTML = `
            <td><strong>${analista}</strong></td>
            <td>${stats.aberto}</td>
            <td>${stats.atendimento}</td>
            <td>${stats.finalizado}</td>
            <td><strong>${stats.total}</strong></td>
        `
  })
}

function criarTabelaSetores() {
  const tbody = document.querySelector('#tabelaSetores tbody')
  const setores = [...new Set(dadosChamados.map((c) => c.setor))]

  tbody.innerHTML = ''

  setores.forEach((setor) => {
    const chamadosSetor = dadosChamados.filter((c) => c.setor === setor)
    const finalizados = chamadosSetor.filter((c) => c.status === 'finalizado').length
    const total = chamadosSetor.length
    const taxa = total > 0 ? ((finalizados / total) * 100).toFixed(1) : 0

    const row = tbody.insertRow()
    row.innerHTML = `
            <td><strong>${setor}</strong></td>
            <td>${total}</td>
            <td>${finalizados}</td>
            <td>${taxa}%</td>
        `
  })
}

function criarTabelaHistorico() {
  const tbody = document.querySelector('#tabelaHistorico tbody')
  if (!tbody) return

  tbody.innerHTML = ''

  dadosChamados.forEach((chamado) => {
    const dataFormatada = new Date(chamado.created_at).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const statusClass = `status-${chamado.status}`
    const statusText =
      {
        aberto: 'Aberto',
        atendimento: 'Em Atendimento',
        finalizado: 'Finalizado',
        cancelado: 'Cancelado',
      }[chamado.status] || chamado.status

    const row = tbody.insertRow()
    row.innerHTML = `
            <td><strong>#${String(chamado.id).padStart(4, '0')}</strong></td>
            <td>${chamado.solicitante}</td>
            <td>${chamado.setor}</td>
            <td class="descricao-resumo" title="${chamado.descricao}">${chamado.descricao.length > 50 ? chamado.descricao.substring(0, 50) + '...' : chamado.descricao}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${chamado.analista || 'Não atribuído'}</td>
            <td>${dataFormatada}</td>
            <td><button class="btn-ver-detalhes" onclick="abrirDetalhesHistorico(${chamado.id})">👁️ Ver</button></td>
        `
  })

  configurarFiltrosHistorico()
}

function configurarFiltrosHistorico() {
  const filtroTexto = document.getElementById('filtroHistorico')
  const filtroStatus = document.getElementById('filtroStatus')

  if (filtroTexto) {
    filtroTexto.addEventListener('input', filtrarHistorico)
  }

  if (filtroStatus) {
    filtroStatus.addEventListener('change', filtrarHistorico)
  }
}

function filtrarHistorico() {
  const filtroTexto = document.getElementById('filtroHistorico').value.toLowerCase()
  const filtroStatus = document.getElementById('filtroStatus').value
  const linhas = document.querySelectorAll('#tabelaHistorico tbody tr')

  linhas.forEach((linha) => {
    const texto = linha.textContent.toLowerCase()
    const statusBadge = linha.querySelector('.status-badge')
    const status = statusBadge ? statusBadge.className.split(' ')[1].replace('status-', '') : ''

    const matchTexto = !filtroTexto || texto.includes(filtroTexto)
    const matchStatus = !filtroStatus || status === filtroStatus

    linha.style.display = matchTexto && matchStatus ? '' : 'none'
  })
}

async function abrirDetalhesHistorico(chamadoId) {
  try {
    const chamado = dadosChamados.find((c) => c.id === chamadoId)
    if (!chamado) return

    const html = `
            <div class="detalhes-grid">
                <div class="detalhes-coluna">
                    <div class="info-card">
                        <h4>📋 Informações Básicas</h4>
                        <div class="info-item">
                            <label>ID:</label>
                            <span><strong>#${String(chamado.id).padStart(4, '0')}</strong></span>
                        </div>
                        <div class="info-item">
                            <label>Solicitante:</label>
                            <span>${chamado.solicitante}</span>
                        </div>
                        <div class="info-item">
                            <label>Email:</label>
                            <span>${chamado.email || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <label>Setor:</label>
                            <span>${chamado.setor}</span>
                        </div>
                        <div class="info-item">
                            <label>Prioridade:</label>
                            <span class="prioridade-${chamado.prioridade}">${chamado.prioridade}</span>
                        </div>
                        <div class="info-item">
                            <label>Status:</label>
                            <span class="status-badge status-${chamado.status}">${
                              {
                                aberto: 'Aberto',
                                atendimento: 'Em Atendimento',
                                finalizado: 'Finalizado',
                                cancelado: 'Cancelado',
                              }[chamado.status]
                            }</span>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <h4>🔧 Detalhes</h4>
                        <div class="info-item">
                            <label>Descrição:</label>
                            <div class="descricao-completa">${chamado.descricao}</div>
                        </div>
                        <div class="info-item">
                            <label>Acessos:</label>
                            <div class="acessos-list">
                                ${
                                  chamado.flags && chamado.flags.length > 0
                                    ? chamado.flags
                                        .map((flag) => `<span class="acesso-tag">${flag}</span>`)
                                        .join('')
                                    : '<span class="sem-acessos">Nenhum acesso solicitado</span>'
                                }
                            </div>
                        </div>
                        <div class="info-item">
                            <label>Equipamento:</label>
                            <span class="equipamento-${chamado.equipamento}">
                                ${chamado.equipamento === 'sim' ? '💻 Sim' : '❌ Não'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="detalhes-coluna">
                    <div class="info-card">
                        <h4>👥 Atribuição</h4>
                        <div class="info-item">
                            <label>Responsável:</label>
                            <span>${chamado.analista || 'Não atribuído'}</span>
                        </div>
                        <div class="info-item">
                            <label>Criado em:</label>
                            <span>${new Date(chamado.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                        ${
                          chamado.finished_at
                            ? `
                        <div class="info-item">
                            <label>Finalizado em:</label>
                            <span>${new Date(chamado.finished_at).toLocaleString('pt-BR')}</span>
                        </div>
                        `
                            : ''
                        }
                    </div>
                    
                    <div class="logs-section">
                        <h4>📅 Histórico de Ações</h4>
                        <div id="logsContainerHistorico" class="logs-container">
                            <div class="loading-logs">⏳ Carregando histórico...</div>
                        </div>
                    </div>
                </div>
            </div>
        `

    document.getElementById('detalhesConteudoHistorico').innerHTML = html
    document.getElementById('modalDetalhesHistorico').classList.remove('hidden')

    // Carrega logs
    setTimeout(() => carregarLogsHistorico(chamadoId), 100)
  } catch (error) {
    console.error('Erro ao abrir detalhes:', error)
  }
}

async function carregarLogsHistorico(chamadoId) {
  try {
    const res = await fetch(`${API_CONFIG.baseURL}/chamados/${chamadoId}/logs`)
    const logs = await res.json()
    const container = document.getElementById('logsContainerHistorico')

    if (!logs || logs.length === 0) {
      container.innerHTML = '<div class="no-logs">📄 Nenhuma ação registrada</div>'
      return
    }

    const logsHtml = logs
      .map((log) => {
        const data = new Date(log.timestamp + 'Z').toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        const icones = {
          STATUS_ALTERADO: '🔄',
          ANALISTA_ALTERADO: '👥',
          CANCELADO: '❌',
          CRIADO: '➕',
          NOTA_ADICIONADA: '💬',
        }

        return `
                <div class="log-item">
                    <div class="log-icon">${icones[log.acao] || '📅'}</div>
                    <div class="log-content">
                        <div class="log-header">
                            <strong>${log.acao.replace('_', ' ')}</strong>
                            <span class="log-time">${data}</span>
                        </div>
                        <div class="log-details">${log.detalhes}</div>
                        <div class="log-user">👤 ${log.usuario}</div>
                    </div>
                </div>
            `
      })
      .join('')

    container.innerHTML = logsHtml
  } catch (error) {
    console.error('Erro ao carregar logs:', error)
    const container = document.getElementById('logsContainerHistorico')
    if (container) {
      container.innerHTML = '<div class="error-logs">❌ Erro ao carregar histórico</div>'
    }
  }
}

// ===============================
// 5. Auto-refresh dos dados
// ===============================
function iniciarAutoRefresh() {
  setInterval(carregarDados, 30000)
}

// ===============================
// Verificação de login
// ===============================
function verificarLogin() {
  if (localStorage.getItem('crmLoggedIn') !== 'true') {
    window.location.href = 'login.html'
    return false
  }
  return true
}

// ===============================
// Inicialização
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  if (verificarLogin()) {
    aplicarTemaSalvo()
    carregarDados()
    iniciarAutoRefresh()
  }
})

window.addEventListener('focus', carregarDados)

// Fechar modal de detalhes do histórico
document.addEventListener('DOMContentLoaded', () => {
  const btnFechar = document.getElementById('btnFecharDetalhesHistorico')
  if (btnFechar) {
    btnFechar.onclick = () => {
      document.getElementById('modalDetalhesHistorico').classList.add('hidden')
    }
  }
})

// Função para alternar tema
function toggleThemeDashboard() {
  const body = document.body
  const btn = document.getElementById('btnThemeDashboard')

  body.classList.toggle('dark-theme')

  if (body.classList.contains('dark-theme')) {
    btn.textContent = '☀️'
    localStorage.setItem('dashboardTheme', 'dark')
  } else {
    btn.textContent = '🌙'
    localStorage.setItem('dashboardTheme', 'light')
  }
}

// Aplicar tema salvo
function aplicarTemaSalvo() {
  const temaSalvo = localStorage.getItem('dashboardTheme')
  const btn = document.getElementById('btnThemeDashboard')

  if (temaSalvo === 'dark') {
    document.body.classList.add('dark-theme')
    if (btn) btn.textContent = '☀️'
  }
}
