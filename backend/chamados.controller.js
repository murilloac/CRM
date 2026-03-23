const db = require("./database");
const { enviarEmailFinalizacao } = require('./emailService');

// Função para registrar logs de auditoria
function registrarLog(chamadoId, acao, usuario, detalhes) {
    const query = `
        INSERT INTO logs_auditoria (chamado_id, acao, usuario, detalhes)
        VALUES (?, ?, ?, ?)
    `;
    
    db.run(query, [chamadoId, acao, usuario, detalhes], (err) => {
        if (err) {
            console.error('Erro ao registrar log:', err);
        }
    });
}

// =============================
// Criar novo chamado
// =============================
exports.create = (req, res) => {
    const c = req.body;

    const query = `
        INSERT INTO chamados (solicitante, email, setor, prioridade, descricao, flags, equipamento, status, analista, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `;

    db.run(query, [
        c.solicitante,
        c.email || null,
        c.setor,
        c.prioridade || 'media',
        c.descricao,
        JSON.stringify(c.flags),
        c.equipamento,
        c.status || "aberto",
        c.analista || null
    ], function(err) {
        if (err) {
            console.error("Erro ao criar chamado:", err);
            return res.status(500).send({ error: "Erro ao criar chamado" });
        }

        res.send({
            message: "Chamado criado com sucesso!",
            id: this.lastID
        });
    });
};

// =============================
// Listar todos os chamados
// =============================
exports.list = (req, res) => {
    db.all(`SELECT * FROM chamados ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) {
            console.error("Erro ao listar chamados:", err);
            return res.status(500).send({ error: "Erro ao listar chamados" });
        }

        // Converte o campo flags de JSON para array
        const chamados = rows.map(r => ({
            ...r,
            flags: JSON.parse(r.flags)
        }));

        res.send(chamados);
    });
};

// =============================
// Buscar chamado por ID
// =============================
exports.getById = (req, res) => {
    const id = req.params.id;

    db.get(`SELECT * FROM chamados WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).send({ error: "Erro ao buscar chamado" });
        }
        if (!row) {
            return res.status(404).send({ error: "Chamado não encontrado" });
        }

        row.flags = JSON.parse(row.flags);

        res.send(row);
    });
};

// =============================
// Atualizar status (Kanban)
// =============================
exports.updateStatus = (req, res) => {
    const id = req.params.id;
    const { status, usuario } = req.body;

    // Verifica se precisa de analista para avançar
    if (status !== 'aberto' && status !== 'cancelado') {
        db.get(`SELECT analista FROM chamados WHERE id = ?`, [id], (err, row) => {
            if (err) {
                return res.status(500).send({ error: "Erro ao verificar chamado" });
            }
            
            if (!row || !row.analista) {
                return res.status(400).send({ 
                    error: "É necessário atribuir um analista responsável antes de avançar o status" 
                });
            }
            
            // Atualiza status se tem analista
            atualizarStatus(id, status, usuario, res);
        });
    } else {
        // Para status 'aberto' ou 'cancelado' não precisa de analista
        atualizarStatus(id, status, usuario, res);
    }
};

function atualizarStatus(id, status, usuario, res) {
    // Se está finalizando, adiciona timestamp de finalização
    const query = status === 'finalizado' 
        ? `UPDATE chamados SET status = ?, finished_at = datetime('now', 'localtime') WHERE id = ?`
        : `UPDATE chamados SET status = ? WHERE id = ?`;
    
    db.run(query, [status, id], function (err) {
        if (err) {
            return res.status(500).send({ error: "Erro ao atualizar status" });
        }
        
        // Registra log da ação
        const acao = status === 'cancelado' ? 'CANCELADO' : 'STATUS_ALTERADO';
        const detalhes = `Status alterado para: ${status}`;
        registrarLog(id, acao, usuario || 'Sistema', detalhes);
        
        // Se status for finalizado, envia email
        if (status === 'finalizado') {
            db.get(`SELECT * FROM chamados WHERE id = ?`, [id], async (err, chamado) => {
                if (!err && chamado && chamado.email) {
                    try {
                        chamado.flags = JSON.parse(chamado.flags);
                        await enviarEmailFinalizacao(chamado);
                    } catch (emailError) {
                        console.error('Erro ao enviar email:', emailError);
                    }
                }
            });
        }
        
        res.send({ message: "Status atualizado com sucesso" });
    });
}

// =============================
// Atualizar informações do chamado
// =============================
exports.update = (req, res) => {
    const id = req.params.id;
    const c = req.body;

    const query = `
        UPDATE chamados SET
            solicitante = ?, 
            email = ?,
            setor = ?, 
            prioridade = ?,
            descricao = ?, 
            flags = ?, 
            equipamento = ?,
            analista = ?
        WHERE id = ?
    `;

    db.run(query, [
        c.solicitante,
        c.email || null,
        c.setor,
        c.prioridade || 'media',
        c.descricao,
        JSON.stringify(c.flags),
        c.equipamento,
        c.analista,
        id
    ], function(err) {
        if (err) {
            return res.status(500).send({ error: "Erro ao atualizar chamado" });
        }

        res.send({ message: "Chamado atualizado com sucesso" });
    });
};

// =============================
// Atualizar analista
// =============================
exports.updateAnalista = (req, res) => {
    const id = req.params.id;
    const { analista, usuario } = req.body;

    // Verifica se já tem analista atribuído
    db.get(`SELECT analista FROM chamados WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).send({ error: "Erro ao verificar chamado" });
        }
        
        // Se já tem analista e está tentando remover (analista vazio)
        if (row && row.analista && !analista) {
            return res.status(400).send({ 
                error: "Não é possível remover o responsável após atribuído. Troque por outro analista." 
            });
        }
        
        // Atualiza o analista
        db.run(`UPDATE chamados SET analista = ? WHERE id = ?`, [analista, id], function (err) {
            if (err) {
                return res.status(500).send({ error: "Erro ao atualizar analista" });
            }
            
            // Registra log da ação
            const detalhes = analista ? `Analista atribuído: ${analista}` : 'Analista removido';
            registrarLog(id, 'ANALISTA_ALTERADO', usuario || 'Sistema', detalhes);
            
            res.send({ message: "Analista atualizado com sucesso" });
        });
    });
};

// =============================
// Buscar logs de auditoria
// =============================
exports.getLogs = (req, res) => {
    const chamadoId = req.params.id;
    
    const query = `
        SELECT * FROM logs_auditoria 
        WHERE chamado_id = ? 
        ORDER BY timestamp DESC
    `;
    
    db.all(query, [chamadoId], (err, rows) => {
        if (err) {
            return res.status(500).send({ error: "Erro ao buscar logs" });
        }
        res.send(rows);
    });
};

// =============================
// Adicionar nota ao chamado
// =============================
exports.addNota = (req, res) => {
    const chamadoId = req.params.id;
    const { nota, usuario } = req.body;
    
    if (!nota || !nota.trim()) {
        return res.status(400).send({ error: "Nota não pode estar vazia" });
    }
    
    // Registra a nota como log de auditoria
    registrarLog(chamadoId, 'NOTA_ADICIONADA', usuario || 'Sistema', `Nota: ${nota.trim()}`);
    
    res.send({ message: "Nota adicionada com sucesso" });
};

// =============================
// Excluir chamado (opcional)
// =============================
exports.delete = (req, res) => {
    const id = req.params.id;

    db.run(`DELETE FROM chamados WHERE id = ?`, [id], function (err) {
        if (err) {
            return res.status(500).send({ error: "Erro ao excluir chamado" });
        }

        res.send({ message: "Chamado excluído com sucesso" });
    });
};

// =============================
// Alterar senha
// =============================
exports.alterarSenha = (req, res) => {
    const usuario = req.params.usuario;
    const { senhaAtual, novaSenha } = req.body;

    // Verifica senha atual
    db.get(`SELECT senha FROM usuarios WHERE usuario = ?`, [usuario], (err, row) => {
        if (err) {
            return res.status(500).send({ error: "Erro ao verificar usuário" });
        }
        
        if (!row || row.senha !== senhaAtual) {
            return res.status(400).send({ error: "Senha atual incorreta" });
        }
        
        // Atualiza senha
        db.run(`UPDATE usuarios SET senha = ? WHERE usuario = ?`, [novaSenha, usuario], function (err) {
            if (err) {
                return res.status(500).send({ error: "Erro ao atualizar senha" });
            }
            
            res.send({ message: "Senha alterada com sucesso" });
        });
    });
};
