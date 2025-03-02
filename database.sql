-- Criar banco de dados
CREATE DATABASE leitura_gas;

-- Conectar ao banco de dados
\c leitura_gas;

-- Criar tabela de usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de leituras
CREATE TABLE readings (
    id SERIAL PRIMARY KEY,
    block CHAR(1) NOT NULL,
    apartment VARCHAR(4) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_reading UNIQUE (block, apartment, timestamp)
);

-- Criar índices para melhor performance
CREATE INDEX idx_readings_block ON readings(block);
CREATE INDEX idx_readings_timestamp ON readings(timestamp);
CREATE INDEX idx_readings_user ON readings(user_id); 