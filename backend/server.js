const express = require('express')
const cors = require('cors')
const chamados = require('./chamados.controller') // importa o controller

const app = express()
app.use(express.json())
app.use(cors())

const path = require('path')
app.use(express.static(path.join(__dirname, '../frontend')))

// ==========================
// ROTAS DE CHAMADOS
// ==========================

// Criar novo chamado
app.post('/chamados', chamados.create)

// Listar todos os chamados
app.get('/chamados', chamados.list)

// Buscar chamado por ID
app.get('/chamados/:id', chamados.getById)

// Buscar logs de auditoria
app.get('/chamados/:id/logs', chamados.getLogs)

// Adicionar nota ao chamado
app.post('/chamados/:id/nota', chamados.addNota)

// Atualizar status (Kanban)
app.put('/chamados/:id/status', chamados.updateStatus)

// Atualizar analista
app.put('/chamados/:id/analista', chamados.updateAnalista)

// Atualizar informações gerais do chamado
app.put('/chamados/:id', chamados.update)

// Excluir chamado
app.delete('/chamados/:id', chamados.delete)

// Alterar senha
app.put('/usuarios/:usuario/senha', chamados.alterarSenha)

// ==========================
// INICIAR SERVIDOR
// ==========================
app.listen(3003, () => console.log('Servidor rodando em http://host67.expnac.local:3003/'))
