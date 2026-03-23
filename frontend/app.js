// ===============================
// 1. Carregar chamados do backend
// ===============================
let todosOsChamados = [];

async function carregarChamados() {
    try {
        console.log('Carregando chamados...');
        const res = await fetch("http://host67.expnac.local:5000/chamados");
        todosOsChamados = await res.json();
        
        console.log('Chamados carregados:', todosOsChamados.length);
        
        // Atualiza o hash inicial
        ultimoHashDados = gerarHashDados(todosOsChamados);
        
        aplicarFiltros();
    } catch (error) {
        console.error('Erro ao carregar chamados:', error);
    }
}

function aplicarFiltros() {
    console.log('Aplicando filtros com', todosOsChamados.length, 'chamados');
    
    const busca = document.getElementById('filtroBusca').value.toLowerCase();
    const setor = document.getElementById('filtroSetor').value.toLowerCase();
    const solicitante = document.getElementById('filtroSolicitante').value.toLowerCase();
    
    // Limpa as colunas
    document.querySelectorAll(".lista").forEach(lista => lista.innerHTML = "");
    
    // Função para normalizar texto (remove acentos e pontuações)
    function normalizarTexto(texto) {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9\s]/g, '') // Remove pontuações
            .trim();
    }
    
    const chamadosFiltrados = todosOsChamados.filter(chamado => {
        // Não mostra chamados cancelados no kanban
        if (chamado.status === 'cancelado') return false;
        
        const buscaNormalizada = normalizarTexto(busca);
        const setorNormalizado = normalizarTexto(setor);
        const solicitanteNormalizado = normalizarTexto(solicitante);
        
        const matchBusca = !busca || 
            normalizarTexto(chamado.solicitante).includes(buscaNormalizada) ||
            normalizarTexto(chamado.setor).includes(buscaNormalizada) ||
            normalizarTexto(chamado.descricao).includes(buscaNormalizada) ||
            (chamado.analista && normalizarTexto(chamado.analista).includes(buscaNormalizada)) ||
            chamado.id.toString().includes(buscaNormalizada);
            
        const matchSetor = !setor || normalizarTexto(chamado.setor).includes(setorNormalizado);
        const matchSolicitante = !solicitante || normalizarTexto(chamado.solicitante).includes(solicitanteNormalizado);
        
        return matchBusca && matchSetor && matchSolicitante;
    });
    
    // Separa finalizados dos demais
    const finalizados = chamadosFiltrados.filter(c => c.status === 'finalizado');
    const outrosStatus = chamadosFiltrados.filter(c => c.status !== 'finalizado');
    
    console.log('Chamados por status:');
    console.log('- Aberto:', chamadosFiltrados.filter(c => c.status === 'aberto').length);
    console.log('- Atendimento:', chamadosFiltrados.filter(c => c.status === 'atendimento').length);
    console.log('- Finalizado:', finalizados.length);
    console.log('- Outros status:', outrosStatus.length);
    
    // Mostra skeleton loading
    mostrarSkeletonLoading();
    
    setTimeout(() => {
        // Limpa as colunas mantendo skeleton
        document.querySelectorAll(".lista").forEach(lista => {
            const skeleton = lista.querySelector('.skeleton-loader');
            lista.innerHTML = "";
            if (skeleton) lista.appendChild(skeleton);
        });
        
        // Mostra todos os outros status com animação
        console.log('Criando cards para outros status:', outrosStatus.length);
        outrosStatus.forEach((chamado, index) => {
            console.log(`Processando chamado #${chamado.id} - Status: ${chamado.status}`);
            setTimeout(() => criarCard(chamado), index * 50);
        });
        
        // Mostra apenas os últimos 10 finalizados
        finalizados.slice(-10).forEach((chamado, index) => {
            setTimeout(() => criarCard(chamado), (outrosStatus.length + index) * 50);
        });
        
        // Atualiza contadores
        atualizarContadores([...outrosStatus, ...finalizados.slice(-10)]);
        
        // Esconde skeleton loading
        setTimeout(() => esconderSkeletonLoading(), 500);
        
        // Adiciona efeitos de drag melhorados
        setTimeout(() => addDragEffects(), 600);
    }, 300);
}

// ===============================
// 2. Criar card e adicionar no DOM
// ===============================
function criarCard(chamado) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.classList.add(`status-${chamado.status}`);
    card.draggable = true;

    card.dataset.id = chamado.id;

    // Debug detalhado
    console.log(`Criando card #${chamado.id} - Status: ${chamado.status}, Prioridade: ${chamado.prioridade || 'media'}`);
    console.log(`Dados do chamado #${chamado.id}:`, {
        id: chamado.id,
        created_at: chamado.created_at,
        status: chamado.status,
        prioridade: chamado.prioridade
    });
    
    // Verifica se o elemento da coluna existe
    const colunaElement = document.getElementById(chamado.status);
    if (!colunaElement) {
        console.error(`❌ Coluna não encontrada para status: ${chamado.status}`);
        return;
    }

    const tempoDecorrido = calcularTempoDecorrido(chamado.created_at);
    const slaInfo = calcularSLA(chamado.created_at, chamado.status, chamado.prioridade, chamado.finished_at);
    
    // Ícone por tipo de problema
    const tipoIcon = getTipoIcon(chamado.flags);
    
    // Badge SLA
    const slaBadge = getSLABadge(slaInfo);
    
    // Usuário atual
    const usuarioAtual = sessionStorage.getItem('crmUser');

    card.innerHTML = `
        <div class="card-badges">
            <span class="card-id">#${String(chamado.id).padStart(4, '0')}</span>
            <span class="card-prioridade prioridade-${chamado.prioridade || 'media'}">
                ${chamado.prioridade || 'Média'}
            </span>
        </div>
        <div class="card-header">
            <strong class="card-solicitante">${chamado.solicitante}</strong>
        </div>
        <div class="card-tipo">${tipoIcon}</div>
        <div class="card-tempo">${tempoDecorrido}</div>
        ${slaBadge}
        <small class="card-setor">${chamado.setor}</small>
        <p class="card-descricao">${chamado.descricao}</p>
        ${chamado.analista ? `<div class="card-responsavel">
            <span class="responsavel-icon">👤</span>
            <span class="responsavel-nome">${chamado.analista}</span>
        </div>` : '<div class="card-sem-responsavel">📋 Não atribuído</div>'}
        <div class="card-sla">
            <div class="sla-label">SLA: ${slaInfo.tempo}</div>
            <div class="sla-progress">
                <div class="sla-bar ${slaInfo.classe}" style="width: ${Math.min(slaInfo.progresso, 100)}%"></div>
            </div>
        </div>
        <div class="card-actions">
            ${!chamado.analista ? `<button class="action-btn" onclick="atribuirParaMim('${chamado.id}', event)">🙋 Pegar</button>` : ''}
            ${chamado.prioridade !== 'alta' ? `<button class="action-btn" onclick="marcarUrgente('${chamado.id}', event)">🔥 Urgente</button>` : ''}
            <button class="action-btn" onclick="adicionarComentario('${chamado.id}', event)">💬 Nota</button>
        </div>
    `;

    // ➔ Clique abre detalhes
    card.addEventListener("click", (e) => {
        if (!e.target.classList.contains('action-btn')) {
            abrirDetalhes(chamado.id);
        }
    });

    // ➔ Drag & Drop
    card.addEventListener("dragstart", dragStart);
    card.addEventListener("dragend", dragEnd);

    // Adiciona o card à coluna correta
    try {
        colunaElement.appendChild(card);
        console.log(`✅ Card #${chamado.id} adicionado à coluna ${chamado.status}`);
    } catch (error) {
        console.error(`❌ Erro ao adicionar card #${chamado.id}:`, error);
    }
}

function getTipoIcon(flags) {
    if (!flags || !Array.isArray(flags)) return '🔧';
    if (flags.includes('AzShip') || flags.includes('Bsoft')) return '💻';
    if (flags.includes('Email')) return '📧';
    if (flags.includes('Dominio')) return '🏢';
    if (flags.includes('Assinatura')) return '✍️';
    return '🔧';
}

function getSLABadge(slaInfo) {
    if (slaInfo.progresso > 100) return '<div class="sla-badge danger">🔥</div>';
    if (slaInfo.progresso > 90) return '<div class="sla-badge">⚠️</div>';
    if (slaInfo.progresso > 80) return '<div class="sla-badge warning">⏰</div>';
    return '<div class="sla-badge ok"></div>';
}

// ===============================
// 3. Drag & Drop
// ===============================
let draggedCard = null;

function dragStart(e) {
    draggedCard = e.target;
    e.target.style.opacity = 0.5;
}

function dragEnd(e) {
    e.target.style.opacity = "";
    draggedCard = null;
}

// ===============================
// 4. Eventos nas colunas
// ===============================
document.querySelectorAll(".lista").forEach(lista => {
    lista.addEventListener("dragover", e => e.preventDefault());

    lista.addEventListener("drop", async e => {
        e.preventDefault();

        const newStatus = lista.id; // id da coluna
        const originalStatus = draggedCard.className.match(/status-(\w+)/)?.[1];
        const originalParent = draggedCard.parentNode;
        
        lista.appendChild(draggedCard);

        // Remove classes de status antigas
        draggedCard.classList.remove('status-aberto', 'status-atendimento', 'status-finalizado');
        // Adiciona nova classe de status
        draggedCard.classList.add(`status-${newStatus}`);

        // Atualiza status no backend
        const id = draggedCard.dataset.id;
        
        // Verifica se é equipamento e está tentando finalizar
        if (newStatus === 'finalizado') {
            const chamado = todosOsChamados.find(c => c.id == id);
            if (chamado && chamado.equipamento === 'sim') {
                const confirmacao = confirm('💻 O equipamento foi levado ao suporte para configuração?\n\nClique OK se SIM ou Cancelar se NÃO.');
                if (!confirmacao) {
                    await carregarChamados();
                    alert('⚠️ O chamado não pode ser finalizado até que o equipamento seja configurado.');
                    return;
                }
            }
        }
        const usuario = sessionStorage.getItem('crmUser');
        
        try {
            const response = await fetch(`http://host67.expnac.local:5000/chamados/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, usuario })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            } else {
                // Notificação de mudança de status
                const chamado = todosOsChamados.find(c => c.id == id);
                if (chamado) {
                    notifications.showStatusChange(chamado, newStatus);
                }
            }
        } catch (error) {
            // Recarrega os dados para reverter a posição
            await carregarChamados();
            alert(`⚠️ ${error.message}`);
        }
    });
});

// ===============================
// 5. Modal de novo chamado
// ===============================
document.getElementById("btnNovo").onclick = () => {
    chamadoAtual = null;
    document.querySelector("#modal .modal-header h2").textContent = "Novo Chamado";
    document.getElementById("modal").classList.remove("hidden");
};

document.getElementById("btnFechar").onclick = () => {
    document.getElementById("modal").classList.add("hidden");
    chamadoAtual = null;
    document.querySelector("#modal .modal-header h2").textContent = "Novo Chamado";
};

document.getElementById("btnSalvar").onclick = async () => {
    const btn = document.getElementById('btnSalvar');
    addLoadingState(btn);
    const solicitante = document.getElementById("solicitante").value;
    const email = document.getElementById("email").value;
    const setor = document.getElementById("setor").value;
    const prioridade = document.getElementById("prioridadeModal").value;
    const descricao = document.getElementById("descricao").value;

    const flags = [...document.querySelectorAll(".flags input:checked")].map(x => x.value);

    const equipamento = document.querySelector("input[name='equip']:checked").value;

    const chamado = {
        solicitante,
        email,
        setor,
        prioridade,
        descricao,
        flags,
        equipamento,
        status: chamadoAtual ? chamadoAtual.status : "aberto"
    };
    
    console.log('Enviando chamado com prioridade:', chamado);
    console.log('Campo prioridade do select:', document.getElementById('prioridadeModal').value);

    if (chamadoAtual) {
        // Editando chamado existente
        await fetch(`http://host67.expnac.local:5000/chamados/${chamadoAtual.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(chamado)
        });
    } else {
        // Criando novo chamado
        const response = await fetch("http://host67.expnac.local:5000/chamados", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(chamado)
        });
        
        if (response.ok) {
            const novoChamado = await response.json();
            notifications.showNewTicket(novoChamado);
        }
    }

    // Limpa formulário e fecha modal
    document.getElementById("modal").classList.add("hidden");
    document.querySelector("#modal .modal-header h2").textContent = "Novo Chamado";
    chamadoAtual = null;
    
    // Limpa campos
    document.getElementById("solicitante").value = "";
    document.getElementById("email").value = "";
    document.getElementById("setor").value = "";
    document.getElementById("prioridadeModal").value = "media";
    document.getElementById("descricao").value = "";
    document.querySelectorAll(".flags input").forEach(cb => cb.checked = false);
    document.querySelector("input[name='equip'][value='nao']").checked = true;

    await carregarChamados();
    removeLoadingState(btn);
};

// ===============================
// 6. Modal de DETALHES do chamado
// ===============================
async function abrirDetalhes(id) {
    const res = await fetch(`http://host67.expnac.local:5000/chamados/${id}`);
    const c = await res.json();
    
    // Armazena chamado atual para edição
    chamadoAtual = c;

    const analistas = ['', 'Dayane', 'Felipe', 'Rafael', 'Yul', 'Alex'];
    const statusOrder = ['aberto', 'atendimento', 'finalizado'];
    const currentIndex = statusOrder.indexOf(c.status);
    
    const dataFormatada = c.created_at ? new Date(c.created_at).toLocaleString('pt-BR') : 'N/A';
    const prioridadeClass = c.prioridade || 'media';
    const prioridadeTexto = c.prioridade === 'alta' ? '🔥 Alta' : c.prioridade === 'baixa' ? '🟢 Baixa' : '🟡 Média';
    
    const html = `
        <div class="detalhes-header">
            <div class="chamado-info">
                <h2>📋 Chamado #${String(c.id).padStart(4, '0')}</h2>
                <div class="prioridade-badge prioridade-${prioridadeClass}">${prioridadeTexto}</div>
            </div>
            <div class="chamado-meta">
                <span class="data-criacao">📅 ${dataFormatada}</span>
                <span class="status-badge status-${c.status}">${c.status.toUpperCase()}</span>
            </div>
        </div>
        
        <div class="detalhes-grid">
            <div class="detalhes-coluna">
                <div class="info-card">
                    <h4>👤 Informações do Solicitante</h4>
                    <div class="info-item">
                        <label>Nome:</label>
                        <span>${c.solicitante}</span>
                    </div>
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${c.email || 'Não informado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Setor:</label>
                        <span>${c.setor}</span>
                    </div>
                </div>
                
                <div class="info-card">
                    <h4>🔧 Detalhes do Chamado</h4>
                    <div class="info-item">
                        <label>Descrição:</label>
                        <div class="descricao-completa">${c.descricao}</div>
                    </div>
                    <div class="info-item">
                        <label>Acessos Solicitados:</label>
                        <div class="acessos-list">
                            ${c.flags.map(flag => `<span class="acesso-tag">${flag}</span>`).join('')}
                        </div>
                    </div>
                    <div class="info-item">
                        <label>Equipamento:</label>
                        <span class="equipamento-${c.equipamento}">
                            ${c.equipamento === 'sim' ? '💻 Sim' : '❌ Não'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="detalhes-coluna">
                <div class="info-card">
                    <h4>👥 Atribuição</h4>
                    <div class="analista-section">
                        <label>Responsável:</label>
                        <select id="selectAnalista">
                            ${!c.analista ? '<option value="">🔄 Selecionar responsável...</option>' : ''}
                            ${analistas.slice(1).map(a => `<option value="${a}" ${a === c.analista ? 'selected' : ''}>
                                👤 ${a}
                            </option>`).join('')}
                        </select>
                        <span id="analistaStatus" class="status-feedback"></span>
                    </div>
                </div>
                
                <div class="info-card">
                    <h4>⚡ Ações</h4>
                    <div class="status-section">
                        <button class="btn-status voltar" onclick="alterarStatus('${c.id}', '${statusOrder[currentIndex - 1]}')" ${currentIndex <= 0 ? 'disabled' : ''}>
                            ← Voltar
                        </button>
                        
                        <button class="btn-status" onclick="alterarStatus('${c.id}', '${statusOrder[currentIndex + 1]}')" ${currentIndex >= statusOrder.length - 1 ? 'disabled' : ''}>
                            Avançar →
                        </button>
                        
                        <button class="btn-cancelar" onclick="cancelarChamado('${c.id}')" ${c.status === 'cancelado' ? 'disabled' : ''}>
                            ❌ Cancelar
                        </button>
                    </div>
                </div>
                
                <div class="logs-section">
                    <h4>📅 Histórico de Ações</h4>
                    <div id="logsContainer" class="logs-container">
                        <div class="loading-logs">⏳ Carregando histórico...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById("detalhesConteudo").innerHTML = html;
    
    // Evento para alterar analista com feedback
    const selectAnalista = document.getElementById('selectAnalista');
    if (selectAnalista) {
        selectAnalista.onchange = async (e) => {
            const statusEl = document.getElementById('analistaStatus');
            const selectEl = e.target;
            const chamadoId = chamadoAtual.id;
            
            try {
                // Feedback visual de carregamento
                statusEl.innerHTML = '⏳ Atribuindo...';
                statusEl.className = 'status-feedback loading';
                selectEl.disabled = true;
                
                const usuario = sessionStorage.getItem('crmUser');
                const response = await fetch(`http://host67.expnac.local:5000/chamados/${chamadoId}/analista`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ analista: e.target.value, usuario })
                });
                
                if (response.ok) {
                    // Sucesso
                    statusEl.innerHTML = e.target.value ? `✅ Atribuído para ${e.target.value}` : '✅ Responsável removido';
                    statusEl.className = 'status-feedback success';
                    
                    // Atualiza o chamado atual
                    chamadoAtual.analista = e.target.value;
                    
                    // Recarrega os dados
                    await carregarChamados();
                    
                    // Remove feedback após 3 segundos
                    setTimeout(() => {
                        statusEl.innerHTML = '';
                        statusEl.className = 'status-feedback';
                    }, 3000);
                } else {
                    throw new Error('Erro na requisição');
                }
            } catch (error) {
                console.error('Erro ao atribuir analista:', error);
                // Erro
                statusEl.innerHTML = '❌ Erro ao atribuir';
                statusEl.className = 'status-feedback error';
                
                // Reverte seleção
                selectEl.value = chamadoAtual.analista || '';
                
                setTimeout(() => {
                    statusEl.innerHTML = '';
                    statusEl.className = 'status-feedback';
                }, 3000);
            } finally {
                selectEl.disabled = false;
            }
        };
    }
    
    // Carrega logs de auditoria após um pequeno delay para garantir que o DOM foi atualizado
    setTimeout(() => carregarLogs(c.id), 100);
    
    document.getElementById("modalDetalhes").classList.remove("hidden");
}

async function carregarLogs(chamadoId) {
    try {
        const res = await fetch(`http://host67.expnac.local:5000/chamados/${chamadoId}/logs`);
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const logs = await res.json();
        const container = document.getElementById('logsContainer');
        
        if (!logs || logs.length === 0) {
            container.innerHTML = '<div class="no-logs">📄 Nenhuma ação registrada</div>';
            return;
        }
        
        const logsHtml = logs.map(log => {
            const data = new Date(log.timestamp + 'Z').toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const icone = getIconeAcao(log.acao);
            
            return `
                <div class="log-item">
                    <div class="log-icon">${icone}</div>
                    <div class="log-content">
                        <div class="log-header">
                            <strong>${log.acao.replace('_', ' ')}</strong>
                            <span class="log-time">${data}</span>
                        </div>
                        <div class="log-details">${log.detalhes}</div>
                        <div class="log-user">👤 ${log.usuario}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = logsHtml;
        
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        const container = document.getElementById('logsContainer');
        if (container) {
            container.innerHTML = `<div class="error-logs">❌ Erro ao carregar histórico: ${error.message}</div>`;
        }
    }
}

function getIconeAcao(acao) {
    const icones = {
        'STATUS_ALTERADO': '🔄',
        'ANALISTA_ALTERADO': '👥',
        'CANCELADO': '❌',
        'CRIADO': '➕',
        'NOTA_ADICIONADA': '💬'
    };
    return icones[acao] || '📅';
}

document.getElementById("btnFecharDetalhes").onclick = () =>
    document.getElementById("modalDetalhes").classList.add("hidden");

// ===============================
// 7. Botão Editar do modal de detalhes
// ===============================
let chamadoAtual = null;

document.getElementById("btnEditar").onclick = () => {
    if (chamadoAtual) {
        // Fecha modal de detalhes
        document.getElementById("modalDetalhes").classList.add("hidden");
        
        // Preenche formulário com dados atuais
        document.getElementById("solicitante").value = chamadoAtual.solicitante;
        document.getElementById("email").value = chamadoAtual.email || '';
        document.getElementById("setor").value = chamadoAtual.setor;
        document.getElementById("prioridadeModal").value = chamadoAtual.prioridade || 'media';
        document.getElementById("descricao").value = chamadoAtual.descricao;
        
        // Marca checkboxes dos acessos
        document.querySelectorAll(".flags input").forEach(cb => {
            cb.checked = chamadoAtual.flags.includes(cb.value);
        });
        
        // Marca radio do equipamento
        document.querySelector(`input[name='equip'][value='${chamadoAtual.equipamento}']`).checked = true;
        
        // Muda título do modal
        document.querySelector("#modal .modal-header h2").textContent = "Editar Chamado";
        
        // Abre modal de edição
        document.getElementById("modal").classList.remove("hidden");
    }
};

// ===============================
// 8. Fechar modais clicando fora
// ===============================
document.getElementById("modal").onclick = (e) => {
    if (e.target.id === "modal") {
        document.getElementById("modal").classList.add("hidden");
    }
};

document.getElementById("modalDetalhes").onclick = (e) => {
    if (e.target.id === "modalDetalhes") {
        document.getElementById("modalDetalhes").classList.add("hidden");
    }
};



// ===============================
// 9. Função para alterar status
// ===============================
async function alterarStatus(id, novoStatus) {
    if (!novoStatus) return;
    
    // Verifica se é equipamento e está tentando finalizar
    if (novoStatus === 'finalizado' && chamadoAtual.equipamento === 'sim') {
        const confirmacao = confirm('💻 O equipamento foi levado ao suporte para configuração?\n\nClique OK se SIM ou Cancelar se NÃO.');
        if (!confirmacao) {
            alert('⚠️ O chamado não pode ser finalizado até que o equipamento seja configurado.');
            return;
        }
    }
    
    const usuario = sessionStorage.getItem('crmUser');
    
    try {
        const response = await fetch(`http://host67.expnac.local:5000/chamados/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus, usuario })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        
        document.getElementById("modalDetalhes").classList.add("hidden");
        await carregarChamados();
    } catch (error) {
        alert(`⚠️ ${error.message}`);
    }
}

// ===============================
// 10. Função para cancelar chamado
// ===============================
async function cancelarChamado(id) {
    if (confirm('⚠️ Tem certeza que deseja cancelar este chamado?\n\nEle será mantido no histórico para relatórios.')) {
        const usuario = sessionStorage.getItem('crmUser');
        await fetch(`http://host67.expnac.local:5000/chamados/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelado', usuario })
        });
        
        document.getElementById("modalDetalhes").classList.add("hidden");
        await carregarChamados();
    }
}

// ===============================
// 10. Eventos dos filtros
// ===============================
document.getElementById('filtroBusca').addEventListener('input', aplicarFiltros);
document.getElementById('filtroSetor').addEventListener('input', aplicarFiltros);
document.getElementById('filtroSolicitante').addEventListener('input', aplicarFiltros);

// Ações rápidas
async function atribuirParaMim(id, event) {
    event.stopPropagation();
    const usuario = sessionStorage.getItem('crmUser');
    
    try {
        const response = await fetch(`http://host67.expnac.local:5000/chamados/${id}/analista`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analista: usuario.charAt(0).toUpperCase() + usuario.slice(1), usuario })
        });
        
        if (response.ok) {
            await carregarChamados();
            mostrarNotificacao(`Chamado #${id} atribuído para você!`, 'success');
        }
    } catch (error) {
        mostrarNotificacao('Erro ao atribuir chamado', 'error');
    }
}

async function marcarUrgente(id, event) {
    event.stopPropagation();
    
    // Aqui você pode implementar a lógica para alterar prioridade
    mostrarNotificacao('Chamado marcado como urgente!', 'warning');
}

async function adicionarComentario(id, event) {
    event.stopPropagation();
    const comentario = prompt('Adicionar nota ao chamado:');
    if (comentario && comentario.trim()) {
        const usuario = sessionStorage.getItem('crmUser');
        
        try {
            const response = await fetch(`http://host67.expnac.local:5000/chamados/${id}/nota`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nota: comentario.trim(), usuario })
            });
            
            if (response.ok) {
                mostrarNotificacao('Nota adicionada!', 'success');
            } else {
                throw new Error('Erro ao salvar nota');
            }
        } catch (error) {
            mostrarNotificacao('Erro ao adicionar nota', 'error');
        }
    }
}

// Sistema de notificações avançado
function mostrarNotificacao(mensagem, tipo = 'info', duracao = 3000) {
    const container = document.getElementById('notification-container') || criarContainerNotificacao();
    
    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    
    const id = Date.now();
    notification.innerHTML = `
        <div class="notification-header">
            <span class="notification-title">${getTituloNotificacao(tipo)}</span>
            <span class="notification-close" onclick="fecharNotificacao(${id})">×</span>
        </div>
        <div class="notification-body">${mensagem}</div>
    `;
    
    notification.id = `notification-${id}`;
    container.appendChild(notification);
    
    // Remove automaticamente
    setTimeout(() => fecharNotificacao(id), duracao);
    
    // Som (se habilitado)
    if (tipo === 'success') playNotificationSound();
}

function criarContainerNotificacao() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}

function getTituloNotificacao(tipo) {
    const titulos = {
        success: '✅ Sucesso',
        error: '❌ Erro',
        warning: '⚠️ Atenção',
        info: 'ℹ️ Informação'
    };
    return titulos[tipo] || 'Notificação';
}

function fecharNotificacao(id) {
    const notification = document.getElementById(`notification-${id}`);
    if (notification) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }
}

function playNotificationSound() {
    // Som simples usando Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Ignora erros de áudio
    }
}

// ===============================
// 11. Verificação de login
// ===============================
function verificarLogin() {
    const loggedIn = localStorage.getItem('crmLoggedIn');
    const token = sessionStorage.getItem('crmToken');
    const usuario = sessionStorage.getItem('crmUser');
    
    if (loggedIn !== 'true' || !token || !usuario) {
        localStorage.removeItem('crmLoggedIn');
        sessionStorage.clear();
        window.location.href = 'login.html';
        return false;
    }
    
    document.getElementById('userInfo').textContent = `👤 ${usuario.charAt(0).toUpperCase() + usuario.slice(1)}`;
    return true;
}

function logout() {
    localStorage.removeItem('crmLoggedIn');
    sessionStorage.clear();
    window.location.href = 'login.html';
}





// ===============================
// Migração de segurança - remove senhas em texto plano
// ===============================


// ===============================
// Modo Escuro
// ===============================
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkTheme', isDark);
    
    const btn = document.getElementById('btnTheme');
    btn.innerHTML = isDark ? '🌞' : '🌙';
}

function loadTheme() {
    const isDark = localStorage.getItem('darkTheme') === 'true';
    if (isDark) {
        document.body.classList.add('dark-theme');
        document.getElementById('btnTheme').innerHTML = '🌞';
    }
}

// ===============================
// Drag & Drop Melhorado
// ===============================
function addDragEffects() {
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            document.querySelectorAll('.lista').forEach(lista => {
                lista.classList.add('drag-over-zone');
            });
        });
        
        card.addEventListener('dragend', (e) => {
            card.classList.remove('dragging');
            document.querySelectorAll('.lista').forEach(lista => {
                lista.classList.remove('drag-over-zone', 'drag-hover');
            });
        });
    });
    
    document.querySelectorAll('.lista').forEach(lista => {
        lista.addEventListener('dragenter', (e) => {
            if (e.target.classList.contains('lista')) {
                e.target.classList.add('drag-hover');
            }
        });
        
        lista.addEventListener('dragleave', (e) => {
            if (e.target.classList.contains('lista')) {
                e.target.classList.remove('drag-hover');
            }
        });
    });
}

// ===============================
// Funções Utilitárias
// ===============================
function calcularTempoDecorrido(dataCreated) {
    // Se não tem data, retorna N/A
    if (!dataCreated || dataCreated === null) {
        return 'N/A';
    }
    
    const agora = new Date();
    // Trata data do SQLite como horário local brasileiro
    let criado;
    if (dataCreated.includes('T') || dataCreated.includes('Z')) {
        // Formato ISO
        criado = new Date(dataCreated);
    } else {
        // Formato SQLite "YYYY-MM-DD HH:MM:SS" - trata como horário local
        criado = new Date(dataCreated.replace(' ', 'T'));
    }
    
    if (isNaN(criado.getTime())) return 'N/A';
    
    const diff = Math.max(0, agora - criado);
    const minutos = Math.floor(diff / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    console.log(`Tempo Debug - Data: ${dataCreated}, Criado: ${criado.toLocaleString('pt-BR')}, Agora: ${agora.toLocaleString('pt-BR')}, Diff: ${diff}ms, Minutos: ${minutos}, Horas: ${horas}`);
    
    if (dias > 0) return `${dias}d`;
    if (horas > 0) return `${horas}h`;
    if (minutos > 0) return `${minutos}m`;
    return '0m';
}

function calcularSLA(dataCreated, status, prioridade = 'media', finishedAt = null) {
    // Se não tem data, retorna valores padrão sem calcular
    if (!dataCreated || dataCreated === null) {
        return {
            progresso: 0,
            classe: 'sla-ok',
            tempo: 'N/A'
        };
    }
    
    // Para chamados finalizados ou cancelados, não calcula SLA ativo
    if (status === 'finalizado' || status === 'cancelado') {
        return {
            progresso: 0,
            classe: 'sla-finalizado',
            tempo: 'Finalizado'
        };
    }
    
    const agora = new Date();
    // Trata data do SQLite como horário local brasileiro
    let criado;
    if (dataCreated.includes('T') || dataCreated.includes('Z')) {
        // Formato ISO
        criado = new Date(dataCreated);
    } else {
        // Formato SQLite "YYYY-MM-DD HH:MM:SS" - trata como horário local
        criado = new Date(dataCreated.replace(' ', 'T'));
    }
    
    if (isNaN(criado.getTime())) {
        return {
            progresso: 0,
            classe: 'sla-ok',
            tempo: 'N/A'
        };
    }
    
    const horasDecorridas = Math.max(0, (agora - criado) / (1000 * 60 * 60));
    
    // Define SLA baseado na prioridade
    let slaLimite;
    switch(prioridade) {
        case 'baixa': slaLimite = 72; break;
        case 'alta': slaLimite = 24; break;
        case 'media':
        default: slaLimite = 48; break;
    }
    
    const progresso = Math.min((horasDecorridas / slaLimite) * 100, 100);
    
    let classe = 'sla-ok';
    if (progresso > 80) classe = 'sla-danger';
    else if (progresso > 60) classe = 'sla-warning';
    
    return {
        progresso: progresso,
        classe: classe,
        tempo: `${Math.round(horasDecorridas * 10) / 10}h/${slaLimite}h`
    };
}

function atualizarContadores(chamados) {
    const contadores = { aberto: 0, atendimento: 0, finalizado: 0 };
    
    chamados.forEach(chamado => {
        if (contadores.hasOwnProperty(chamado.status)) {
            contadores[chamado.status]++;
        }
    });
    
    Object.keys(contadores).forEach(status => {
        const elemento = document.getElementById(`contador-${status}`);
        if (elemento) elemento.textContent = contadores[status];
    });
    
}

function mostrarSkeletonLoading() {
    document.querySelectorAll('.skeleton-loader').forEach(skeleton => {
        skeleton.classList.remove('hidden');
    });
}

function esconderSkeletonLoading() {
    document.querySelectorAll('.skeleton-loader').forEach(skeleton => {
        skeleton.classList.add('hidden');
    });
}

function addLoadingState(button) {
    button.classList.add('btn-loading');
    button.disabled = true;
}

function removeLoadingState(button) {
    button.classList.remove('btn-loading');
    button.disabled = false;
}

// ===============================
// Auto-refresh Inteligente
// ===============================
let autoRefreshInterval;
let ultimoHashDados = '';

function iniciarAutoRefresh() {
    autoRefreshInterval = setInterval(async () => {
        await verificarMudancas();
    }, 5000); // Verifica a cada 5 segundos
}

async function verificarMudancas() {
    const statusEl = document.getElementById('connectionStatus');
    
    try {
        // Atualiza status para "verificando"
        atualizarStatusConexao('checking', 'Verificando...');
        
        const res = await fetch("http://host67.expnac.local:5000/chamados");
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        
        const dadosAtuais = await res.json();
        
        // Gera hash dos dados para comparação
        const hashAtual = gerarHashDados(dadosAtuais);
        
        // Se houve mudança, atualiza a interface
        if (hashAtual !== ultimoHashDados && ultimoHashDados !== '') {
            console.log('🔄 Mudanças detectadas, atualizando interface...');
            todosOsChamados = dadosAtuais;
            aplicarFiltros();
            
            // Mostra notificação de atualização
            mostrarNotificacaoAtualizacao();
        }
        
        ultimoHashDados = hashAtual;
        
        // Atualiza dados silenciosamente na primeira vez
        if (ultimoHashDados === hashAtual && todosOsChamados.length === 0) {
            todosOsChamados = dadosAtuais;
        }
        
        // Status online
        atualizarStatusConexao('online', 'Online');
        
    } catch (error) {
        console.error('Erro ao verificar mudanças:', error);
        atualizarStatusConexao('offline', 'Offline');
    }
}

function atualizarStatusConexao(status, texto) {
    const statusEl = document.getElementById('connectionStatus');
    const textEl = statusEl.querySelector('.status-text');
    
    // Remove classes anteriores
    statusEl.classList.remove('online', 'offline', 'checking');
    
    // Adiciona nova classe
    statusEl.classList.add(status);
    
    // Atualiza texto
    textEl.textContent = texto;
}

function gerarHashDados(dados) {
    // Cria uma string única baseada nos dados importantes
    const dadosRelevantes = dados.map(chamado => 
        `${chamado.id}-${chamado.status}-${chamado.analista || ''}-${chamado.updated_at || chamado.created_at}`
    ).join('|');
    
    // Hash simples
    let hash = 0;
    for (let i = 0; i < dadosRelevantes.length; i++) {
        const char = dadosRelevantes.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

function mostrarNotificacaoAtualizacao() {
    // Cria notificação temporária
    const notificacao = document.createElement('div');
    notificacao.className = 'update-notification';
    notificacao.innerHTML = '🔄 Dados atualizados automaticamente';
    
    document.body.appendChild(notificacao);
    
    // Remove após 3 segundos
    setTimeout(() => {
        notificacao.remove();
    }, 3000);
}

function pararAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        atualizarStatusConexao('offline', 'Pausado');
    }
}

function retomarAutoRefresh() {
    if (!autoRefreshInterval) {
        iniciarAutoRefresh();
    }
}

// Pausa auto-refresh quando a aba não está visível
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pararAutoRefresh();
    } else {
        retomarAutoRefresh();
        // Força uma verificação imediata ao voltar
        setTimeout(() => verificarMudancas(), 1000);
    }
});

// ===============================
// Exportar Relatório
// ===============================
function exportarRelatorio() {
    const btn = document.getElementById('btnExport');
    addLoadingState(btn);
    
    setTimeout(() => {
        const csv = gerarCSV(todosOsChamados);
        baixarArquivo(csv, 'relatorio-chamados.csv', 'text/csv');
        removeLoadingState(btn);
    }, 1000);
}

function gerarCSV(chamados) {
    const headers = ['ID', 'Solicitante', 'Email', 'Setor', 'Descrição', 'Status', 'Analista', 'Criado em'];
    const rows = chamados.map(c => [
        c.id,
        c.solicitante,
        c.email || '',
        c.setor,
        c.descricao.replace(/,/g, ';'),
        c.status,
        c.analista || '',
        new Date(c.created_at || new Date()).toLocaleString('pt-BR')
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function baixarArquivo(conteudo, nomeArquivo, tipo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===============================
// Atalhos de Teclado
// ===============================
document.addEventListener('keydown', (e) => {
    // Ctrl+N - Novo chamado
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        document.getElementById('btnNovo').click();
    }
    
    // Ctrl+F - Focar no filtro de busca
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('filtroBusca').focus();
    }
    
    // Ctrl+R - Recarregar dados
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        carregarChamados();
        mostrarNotificacao('Dados recarregados!', 'info');
    }
    
    // ESC - Fechar modais
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
});

// Notificações de SLA
function verificarSLAVencidos() {
    const chamadosVencidos = todosOsChamados.filter(chamado => {
        if (chamado.status === 'finalizado' || chamado.status === 'cancelado') return false;
        
        const slaInfo = calcularSLA(chamado.created_at || new Date(), chamado.status, chamado.prioridade, chamado.finished_at);
        return slaInfo.progresso > 90;
    });
    
    if (chamadosVencidos.length > 0) {
        mostrarNotificacao(
            `⚠️ ${chamadosVencidos.length} chamado(s) próximo(s) do vencimento do SLA!`,
            'warning',
            5000
        );
    }
}

// Verifica SLA a cada 5 minutos
setInterval(verificarSLAVencidos, 5 * 60 * 1000);

// ===============================
// Inicializa página
// ===============================
if (verificarLogin()) {
    loadTheme();
    carregarChamados();
    iniciarAutoRefresh();
    
    // Mostra dica de atalhos na primeira vez
    if (!localStorage.getItem('dicasAtalhos')) {
        setTimeout(() => {
            mostrarNotificacao('💡 Dica: Use Ctrl+N para novo chamado, Ctrl+F para buscar!', 'info', 5000);
            localStorage.setItem('dicasAtalhos', 'true');
        }, 2000);
    }
}
