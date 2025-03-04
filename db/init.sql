-- Criação da tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de leituras
CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    block VARCHAR(1) NOT NULL,
    apartment VARCHAR(3) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(block, apartment, timestamp)
);
