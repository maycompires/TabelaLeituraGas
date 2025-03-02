# Sistema de Leitura de Gás

Sistema para gerenciamento de leituras de gás em condomínios.

## Requisitos

- Node.js 14+
- PostgreSQL 12+

## Configuração do Banco de Dados

1. Crie um banco de dados PostgreSQL:
```sql
CREATE DATABASE leitura_gas;
```

2. Execute o script de criação das tabelas:
```bash
psql -U seu_usuario -d leitura_gas -f database.sql
```

## Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd leitura-gas
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
- Copie o arquivo `.env.example` para `.env`
- Edite o arquivo `.env` com suas configurações:
  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=seu_usuario
  DB_PASSWORD=sua_senha
  DB_NAME=leitura_gas
  PORT=3000
  ```

4. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento, use:
```bash
npm run dev
```

## Estrutura do Projeto

- `public/` - Arquivos estáticos do frontend
- `database.sql` - Script de criação do banco de dados
- `server.js` - Servidor Express
- `package.json` - Dependências e scripts

## Funcionalidades

- Autenticação de usuários
- Registro de leituras de gás por bloco/apartamento
- Relatórios em Excel
- Dashboard com progresso
- Validação de dados
- Feedback visual para o usuário

## Tecnologias Utilizadas

- Frontend:
  - HTML5
  - CSS3
  - JavaScript (ES6+)
  - XLSX.js para exportação Excel

- Backend:
  - Node.js
  - Express
  - PostgreSQL
  - node-postgres (pg)
  - bcrypt para hash de senhas
  - dotenv para configuração

## Segurança

- Senhas armazenadas com hash bcrypt
- Validação de dados no frontend e backend
- Proteção contra SQL injection usando prepared statements
- CORS configurado para segurança

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request