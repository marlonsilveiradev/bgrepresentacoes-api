# 🚀 BG Representações API

Backend responsável pelo gerenciamento de clientes, vendas e bandeiras de cartões de vale alimentação.

Esta API foi desenvolvida em Node.js utilizando Express e PostgreSQL, seguindo uma arquitetura baseada em Service Layer Pattern, com foco em segurança, escalabilidade e organização de código.

---

# 📌 Visão Geral

A aplicação fornece uma API REST responsável por:

- Gestão de usuários
- Cadastro de clientes
- Gestão de bandeiras de cartões
- Gestão de planos
- Registro de vendas
- Upload de documentos
- Relatórios administrativos
- Sistema de autenticação e autorização

---

# 🏗️ Arquitetura

A aplicação segue uma arquitetura em camadas para separação de responsabilidades:

src/
 ├── config
 ├── controllers
 ├── services
 ├── middlewares
 ├── models
 ├── routes
 ├── validators
 ├── utils
 ├── database
 │    ├── migrations
 │    └── seeders

---

# 🎯 Controllers

Responsáveis por lidar com requisições HTTP.

Principais responsabilidades:

- receber requisição
- validar dados
- chamar services
- retornar resposta

---

# 🧠 Services

Contêm toda a lógica de negócio da aplicação.

Exemplos:

- cálculo de valores de vendas
- validação de regras de planos
- associação de bandeiras
- criação de clientes

---

# 🗄️ Models

Representam as entidades do banco de dados utilizando Sequelize ORM.

---

# 🔁 Middlewares

Responsáveis por funcionalidades transversais:

- autenticação e autorização (JWT)
- tratamento de erros
- rate limiting
- logging de requisições
- sanitização de dados

---

# ⚙️ Tecnologias Utilizadas

- Node.js
- Express
- PostgreSQL
- Sequelize ORM
- JWT (autenticação)
- bcrypt (hash de senha)
- Cloudinary (upload de arquivos)
- Pino (logging)
- Swagger (documentação)
- Jest (testes)

---

# 🛡️ Segurança

A aplicação implementa múltiplas camadas de segurança:

Helmet  
Proteção de headers HTTP

Rate Limiting  
Proteção contra abuso e ataques de força bruta

CORS  
Controle de acesso entre domínios configurado por ambiente

Sanitização de Dados  
Proteção contra NoSQL Injection e XSS

JWT Authentication  
Autenticação baseada em tokens

Password Hashing  
Senhas criptografadas com bcrypt

---

# 📊 Observabilidade

Sistema de logs estruturados utilizando Pino.

Funcionalidades:

- logs estruturados
- rastreamento de erros
- monitoramento de requisições

---

# 🗃️ Banco de Dados

Banco de dados baseado em PostgreSQL.

Principais entidades:

- users
- clients
- flags
- plans
- sales
- client_documents
- client_flags
- sale_flags
- client_bank_accounts

Características:

- UUID como chave primária
- Soft Delete
- Índices otimizados
- Relacionamentos com integridade referencial

---

# 📁 Upload de Documentos

Arquivos armazenados via Cloudinary.

Por segurança:

- a API não expõe URLs diretas
- acesso realizado via proxy seguro

---

# 🔐 Autenticação

Sistema baseado em:

- Access Token (JWT)
- Refresh Token

Fluxo:

- login
- refresh token
- logout
- alteração de senha

---

# 📄 Documentação da API

A documentação interativa está disponível em:

https://bgrepresentacoes-api-production.up.railway.app/api-docs/

### 🔐 Acesso

- usuário: admin
- senha: bg@api123

A documentação permite testar as rotas diretamente pelo navegador.  
As rotas protegidas exigem autenticação via JWT.

---

# 🔗 Acesso à API

Base URL:

https://bgrepresentacoes-api-production.up.railway.app/api/v1

Health check:

GET /health

---

# ⚙️ Instalação

Clone o repositório:

git clone <https://github.com/marlonsilveiradev/bgrepresentacoes-api>

Acesse a pasta:

cd projeto

Instale as dependências:

npm install

---

# ⚙️ Configuração

Crie o arquivo .env:

cp .env.example .env

Configure as variáveis de ambiente conforme necessário.

---

# 🗄️ Banco de Dados

Executar migrations:

npx sequelize-cli db:migrate

Executar seeders:

npx sequelize-cli db:seed:all

---

# ▶️ Execução

Modo desenvolvimento:

npm run dev

Modo produção:

npm start

---

# 🧪 Testes

Executar testes:

npm run test

Cobertura de testes:

npm run test:coverage

---

# 🔄 Versionamento da API

A API utiliza versionamento:

/api/v1

---

# 👨‍💻 Autor

Marlon Silveira

GitHub: https://github.com/marlonsilveiradev

---

# 📌 Observação

Este projeto foi desenvolvido com foco em aprendizado contínuo e aplicação de boas práticas de desenvolvimento backend, incluindo arquitetura em camadas, segurança e organização de código.