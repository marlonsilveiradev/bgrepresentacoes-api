# BG Representações API

Backend responsável pelo gerenciamento de clientes, vendas e bandeiras de cartões de vale alimentação.

Esta API foi desenvolvida em Node.js utilizando Express e PostgreSQL e segue uma arquitetura moderna baseada em Service Layer Pattern com foco em segurança, escalabilidade e organização de código.

---

# Visão Geral

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

# Arquitetura

A aplicação segue uma arquitetura em camadas para separação de responsabilidades.

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

# Controllers

Responsáveis por lidar apenas com requisições HTTP.

Funções principais:

- receber requisição
- validar dados
- chamar service
- retornar resposta

---

# Services

Contêm toda a lógica de negócio da aplicação.

Exemplos:

- cálculo de valores de vendas
- validação de regras de planos
- associação de bandeiras
- criação de clientes

---

# Models

Representam as entidades do banco de dados utilizando Sequelize.

---

# Middlewares

Responsáveis por funcionalidades transversais:

- autenticação
- autorização
- tratamento de erros
- rate limit
- logging

---

# Tecnologias Utilizadas

Principais tecnologias do projeto:

- Node.js
- Express
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- bcrypt
- Cloudinary
- Pino Logger
- Swagger
- Jest

---

# Segurança

A aplicação implementa múltiplas camadas de segurança.

Helmet  
Proteção de headers HTTP.

Rate Limiting  
Proteção contra ataques de força bruta e flood.

CORS  
Controle de acesso entre domínios.

JWT Authentication  
Sistema de autenticação baseado em tokens.

Password Hashing  
Senhas criptografadas com bcrypt.

Validação de Dados  
Validação de entrada com Yup.

---

# Observabilidade

Sistema de logs estruturados utilizando Pino.

Funcionalidades:

- logs estruturados
- rastreamento de erros
- análise de requisições lentas
- alerta por email em falhas críticas

---

# Banco de Dados

Banco de dados baseado em PostgreSQL.

Principais entidades:

users  
clients  
flags  
plans  
sales  
client_documents  
client_flags  
sale_flags  
client_bank_accounts  

Características da modelagem:

- UUID como chave primária
- Soft Delete
- Índices otimizados
- Foreign Keys
- Constraints de integridade

---

# Upload de Documentos

Arquivos são armazenados utilizando Cloudinary.

Por motivos de segurança:

- a API não expõe URLs diretas
- downloads são realizados via proxy seguro

---

# Autenticação

Sistema baseado em:

Access Token (JWT)  
Refresh Token

Fluxo:

login  
refresh token  
logout  
change password  

---

# Documentação da API

A documentação da API está disponível em:

/api-docs

Gerada utilizando Swagger.

---

# Instalação

Clone o repositório

git clone <url-do-repositorio>

Entre na pasta do projeto

cd projeto

Instale as dependências

npm install

---

# Configuração

Crie o arquivo .env baseado no exemplo

cp .env.example .env

Configure as variáveis de ambiente.

---

# Banco de Dados

Executar migrations

npx sequelize-cli db:migrate

Executar seeders

npx sequelize-cli db:seed:all

---

# Executar aplicação

Modo desenvolvimento

npm run dev

Modo produção

npm start

---

# Testes

Executar testes

npm run test

Executar cobertura de testes

npm run test:coverage

Cobertura mínima configurada:

70%

---

# Versionamento da API

A API utiliza versionamento:

/api/v1

---

# Autor

Marlon Silveira

Sistema desenvolvido para gestão de vendas de bandeiras de cartões de vale alimentação.