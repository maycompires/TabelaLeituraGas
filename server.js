require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Configuração do PostgreSQL
console.log('Iniciando configuração do PostgreSQL...');
console.log('DATABASE_URL presente:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] : 'não definida'); // Mostra só a parte depois do @ por segurança

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Teste de conexão inicial com mais logs
pool.connect()
    .then(() => {
        console.log('Conexão com o banco de dados estabelecida com sucesso!');
        console.log('Usando DATABASE_URL:', process.env.DATABASE_URL ? 'Sim' : 'Não');
    })
    .catch(err => {
        console.error('Erro detalhado ao conectar ao banco de dados:', {
            message: err.message,
            code: err.code,
            stack: err.stack
        });
        process.exit(1); // Encerra o aplicativo se não conseguir conectar ao banco
    });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rota de teste
app.get('/api/test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: 'success',
            message: 'Conexão com banco de dados OK',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        console.error('Erro no teste:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro na conexão com banco de dados',
            error: error.message
        });
    }
});

// Rotas da API

// Autenticação
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        
        // Verificar se usuário já existe
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'E-mail ou usuário já registrado' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir novo usuário
        const result = await pool.query(
            'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username',
            [email, username, hashedPassword]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { credential, password } = req.body;

        // Buscar usuário
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $1',
            [credential]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        const user = result.rows[0];

        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Senha inválida' });
        }

        res.json({
            id: user.id,
            email: user.email,
            username: user.username
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Leituras
app.post('/api/readings', async (req, res) => {
    try {
        const { block, apt, value, user_id, timestamp } = req.body;

        // Validação dos dados
        if (!block || !apt || !value || !user_id || !timestamp) {
            console.error('Dados incompletos:', { block, apt, value, user_id, timestamp });
            return res.status(400).json({ 
                error: 'Todos os campos são obrigatórios',
                received: { block, apt, value, user_id, timestamp }
            });
        }

        // Verificar se o usuário existe
        const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
        if (userExists.rows.length === 0) {
            return res.status(400).json({ error: 'Usuário não encontrado' });
        }

        // Verificar se já existe leitura para este apartamento nesta data
        const existingReading = await pool.query(
            'SELECT id FROM readings WHERE block = $1 AND apartment = $2 AND DATE(timestamp) = DATE($3)',
            [block, apt, timestamp]
        );

        let result;
        if (existingReading.rows.length > 0) {
            // Atualizar leitura existente
            result = await pool.query(
                `UPDATE readings 
                SET value = $1, user_id = $2, timestamp = $3 
                WHERE block = $4 AND apartment = $5 AND DATE(timestamp) = DATE($6)
                RETURNING *`,
                [value, user_id, timestamp, block, apt, timestamp]
            );
        } else {
            // Inserir nova leitura
            result = await pool.query(
                `INSERT INTO readings (block, apartment, value, user_id, timestamp) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING *`,
                [block, apt, value, user_id, timestamp]
            );
        }

        // Buscar os dados completos incluindo o username
        const readingWithUser = await pool.query(
            `SELECT r.*, u.username 
            FROM readings r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.id = $1`,
            [result.rows[0].id]
        );

        res.json(readingWithUser.rows[0]);
    } catch (error) {
        console.error('Erro detalhado ao salvar leitura:', {
            error: error.message,
            stack: error.stack,
            code: error.code
        });
        
        // Tratamento específico para erros comuns
        if (error.code === '23505') { // Violação de chave única
            res.status(409).json({ 
                error: 'Já existe uma leitura para este apartamento nesta data' 
            });
        } else if (error.code === '23503') { // Violação de chave estrangeira
            res.status(400).json({ 
                error: 'Usuário não encontrado' 
            });
        } else {
            res.status(500).json({ 
                error: 'Erro ao salvar leitura',
                details: error.message
            });
        }
    }
});

app.get('/api/readings', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, u.username 
            FROM readings r 
            JOIN users u ON r.user_id = u.id 
            ORDER BY r.block, r.apartment
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar leituras:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/readings/block/:block', async (req, res) => {
    try {
        const { block } = req.params;
        const result = await pool.query(
            'SELECT r.*, u.username FROM readings r JOIN users u ON r.user_id = u.id WHERE r.block = $1',
            [block]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar leituras do bloco:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Deletar todas as leituras
app.delete('/api/readings', async (req, res) => {
    try {
        await pool.query('DELETE FROM readings');
        res.json({ message: 'Todas as leituras foram deletadas com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar leituras:', error);
        res.status(500).json({ error: 'Erro ao deletar leituras' });
    }
});

// Rota de teste de conexão
app.get('/api/test-connection', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: 'success',
            message: 'Conexão com o banco de dados está funcionando!',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        console.error('Erro no teste de conexão:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao conectar com o banco de dados',
            error: error.message
        });
    }
});

// Rota para servir o frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 