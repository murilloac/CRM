const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./crm.db");

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS chamados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            solicitante TEXT,
            email TEXT,
            setor TEXT,
            descricao TEXT,
            flags TEXT,
            equipamento TEXT,
            status TEXT,
            analista TEXT,
            created_at DATETIME DEFAULT (datetime('now', 'localtime'))
        )
    `);
    
    // Tabela de logs de auditoria
    db.run(`
        CREATE TABLE IF NOT EXISTS logs_auditoria (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chamado_id INTEGER,
            acao TEXT,
            usuario TEXT,
            detalhes TEXT,
            timestamp DATETIME DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (chamado_id) REFERENCES chamados (id)
        )
    `);
    
    // Adiciona colunas se não existirem
    db.run(`ALTER TABLE chamados ADD COLUMN analista TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Erro ao adicionar coluna analista:', err);
        }
    });
    
    db.run(`ALTER TABLE chamados ADD COLUMN created_at DATETIME`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Erro ao adicionar coluna created_at:', err);
        } else {
            // Atualiza registros existentes sem created_at
            db.run(`UPDATE chamados SET created_at = datetime('now', 'localtime') WHERE created_at IS NULL`, (updateErr) => {
                if (updateErr) {
                    console.error('Erro ao atualizar created_at:', updateErr);
                } else {
                    console.log('Registros sem created_at foram atualizados com data atual');
                }
            });
        }
    });
    
    db.run(`ALTER TABLE chamados ADD COLUMN email TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Erro ao adicionar coluna email:', err);
        }
    });
    
    db.run(`ALTER TABLE chamados ADD COLUMN prioridade TEXT DEFAULT 'media'`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Erro ao adicionar coluna prioridade:', err);
        }
    });
    
    db.run(`ALTER TABLE chamados ADD COLUMN finished_at DATETIME`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Erro ao adicionar coluna finished_at:', err);
        }
    });
    
    // Tabela de usuários
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            usuario TEXT PRIMARY KEY,
            senha TEXT NOT NULL
        )
    `);
    
    // Insere usuários padrão se não existirem
    const usuariosPadrao = [
        ['admin', 'admin123'],
        ['dayane', 'dayane123'],
        ['felipe', 'felipe123'],
        ['rafael', 'rafael123'],
        ['yul', 'yul123']
    ];
    
    usuariosPadrao.forEach(([usuario, senha]) => {
        db.run(`INSERT OR IGNORE INTO usuarios (usuario, senha) VALUES (?, ?)`, [usuario, senha]);
    });
});

module.exports = db;
