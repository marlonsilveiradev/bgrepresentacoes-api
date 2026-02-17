# 🎯 Card Flags System - API

Sistema completo de cadastro e gerenciamento de bandeiras de cartões de alimentação/refeição para máquinas de pagamento.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o Projeto](#executando-o-projeto)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API Endpoints](#api-endpoints)
- [Roles e Permissões](#roles-e-permissões)
- [Testes](#testes)
- [Deploy](#deploy)
- [Licença](#licença)

---

## 📖 Sobre o Projeto

Sistema de gerenciamento para empresas que habilitam bandeiras de cartões (Alelo, VR, Sodexo, etc) em máquinas de pagamento. Permite cadastro de clientes, gerenciamento de planos e bandeiras, controle de status individual por bandeira e geração de relatórios de vendas.

### ✨ Diferenciais

- ✅ **Status individual por bandeira**: Cada bandeira tem status próprio (pending, in_analysis, approved)
- ✅ **3 tipos de usuários**: User, Admin e Partner com permissões específicas
- ✅ **Consulta pública**: Clientes podem acompanhar status via protocolo ou CNPJ
- ✅ **Relatórios completos**: Por dia, mês, ano e parceiro
- ✅ **Upload seguro**: Integração com Cloudinary para armazenamento de documentos
- ✅ **Preços dinâmicos**: Admin pode alterar preços de planos e bandeiras

---

## 🎯 Funcionalidades

### 👤 Usuários

- [x] Login com JWT
- [x] 3 tipos de usuários (user, admin, partner)
- [x] Admin cria usuários
- [x] Atualização de perfil
- [x] Controle de acesso por role

### 📊 Clientes

- [x] Cadastro completo com validação de CNPJ
- [x] Upload de 3 documentos (documento, fatura, conta de luz)
- [x] Endereço completo (7 campos separados)
- [x] Associação com plano e bandeiras
- [x] Associação opcional com parceiro
- [x] Número de protocolo único
- [x] Consulta pública por protocolo ou CNPJ

### 🎫 Bandeiras

- [x] Gerenciamento de bandeiras disponíveis
- [x] Preço individual editável pelo admin
- [x] Status individual por cliente (pending, in_analysis, approved)
- [x] User pode alterar status de cada bandeira
- [x] Status geral do cliente calculado automaticamente

### 📦 Planos

- [x] Individual (soma dos preços das bandeiras)
- [x] Combo 5 (5 bandeiras por preço fixo)
- [x] Combo 7 (7 bandeiras por preço fixo)
- [x] Preços editáveis pelo admin
- [x] Ativação/desativação de planos

### 📈 Relatórios

- [x] Relatório diário
- [x] Relatório mensal com detalhamento
- [x] Relatório anual
- [x] Relatório por parceiro
- [x] Snapshot de valores no momento da venda

---

## 🛠️ Tecnologias

### Backend

- **Node.js** v20+ - Runtime JavaScript
- **Express** v4 - Framework web
- **PostgreSQL** v15 - Banco de dados
- **Sequelize** v6 - ORM
- **Docker** - Containerização do banco

### Autenticação e Segurança

- **JWT** (jsonwebtoken) - Autenticação stateless
- **bcrypt** - Hash de senhas
- **Helmet** - Headers de segurança
- **CORS** - Controle de origem
- **express-rate-limit** - Limitação de requisições

### Validação

- **Yup** - Validação de schemas
- Validação customizada de CNPJ

### Upload e Armazenamento

- **Multer** - Upload de arquivos
- **Cloudinary** - Armazenamento em nuvem

### Utilitários

- **dotenv** - Variáveis de ambiente
- **morgan** - Logs HTTP
- **compression** - Compressão de respostas

---

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Node.js** v20+ ([download](https://nodejs.org/))
- **Docker Desktop** ([download](https://www.docker.com/products/docker-desktop))
- **Git** ([download](https://git-scm.com/))
- **Conta no Cloudinary** ([criar conta](https://cloudinary.com/users/register_free))

---

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/card-flags-system.git
cd card-flags-system
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env
nano .env  # ou use seu editor preferido
```

### 4. Gere um JWT_SECRET seguro
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado e cole no `.env` na variável `JWT_SECRET`.

### 5. Configure as credenciais do Cloudinary

1. Acesse: https://cloudinary.com/console
2. Copie: **Cloud Name**, **API Key** e **API Secret**
3. Cole no arquivo `.env`

---

## ⚙️ Configuração

### Arquivo .env
```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados (Docker)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=card_flags_db
DB_USER=postgres
DB_PASSWORD=postgres123

# Cloudinary
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# JWT
JWT_SECRET=seu_segredo_gerado_aqui
JWT_EXPIRES_IN=7d

# Admin Inicial
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@cardflags.com
ADMIN_PASSWORD=Admin@123456

# Segurança
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🎮 Executando o Projeto

### 1. Inicie o PostgreSQL (Docker)
```bash
docker-compose up -d postgres
```

Aguarde alguns segundos para o banco inicializar.

### 2. Execute as migrations
```bash
npx sequelize-cli db:migrate
```

### 3. Inicie a aplicação

**Modo desenvolvimento:**
```bash
npm run dev
```

**Modo produção:**
```bash
npm start
```

### 4. Acesse a API
```
http://localhost:3000
```

### 5. Health Check
```
http://localhost:3000/health
```

Deve retornar:
```json
{
  "success": true,
  "message": "API funcionando!",
  "timestamp": "2024-02-11T..."
}
```

---

## 📂 Estrutura do Projeto
```
card-flags-system/
├── docker/
│   └── init.sql                    # Script de inicialização do PostgreSQL
├── node_modules/                   # Dependências (não versionar)
├── src/
│   ├── config/
│   │   ├── cloudinary.js          # Configuração Cloudinary
│   │   └── database.js            # Configuração Sequelize
│   ├── controllers/
│   │   ├── authController.js      # Autenticação e usuários
│   │   ├── clientController.js    # Clientes
│   │   ├── flagController.js      # Bandeiras
│   │   ├── planController.js      # Planos
│   │   └── reportController.js    # Relatórios
│   ├── middlewares/
│   │   ├── auth.js                # Autenticação JWT
│   │   ├── authorization.js       # Autorização por role
│   │   ├── security.js            # Helmet, CORS, Rate Limit
│   │   └── upload.js              # Multer
│   ├── migrations/                # Migrations Sequelize
│   │   ├── XXXXXX-create-users.js
│   │   ├── XXXXXX-create-plans.js
│   │   ├── XXXXXX-create-flags.js
│   │   ├── XXXXXX-create-clients.js
│   │   ├── XXXXXX-create-client-flags.js
│   │   ├── XXXXXX-create-sales-reports.js
│   │   └── XXXXXX-seed-initial-data.js
│   ├── models/
│   │   ├── Client.js              # Model Cliente
│   │   ├── ClientFlag.js          # Model relação N:N
│   │   ├── Flag.js                # Model Bandeira
│   │   ├── Plan.js                # Model Plano
│   │   ├── SalesReport.js         # Model Relatório
│   │   ├── User.js                # Model Usuário
│   │   └── index.js               # Inicialização Sequelize
│   ├── routes/
│   │   ├── authRoutes.js          # Rotas autenticação
│   │   ├── clientRoutes.js        # Rotas clientes
│   │   ├── flagRoutes.js          # Rotas bandeiras
│   │   ├── planRoutes.js          # Rotas planos
│   │   └── reportRoutes.js        # Rotas relatórios
│   ├── services/
│   │   ├── cloudinaryService.js   # Upload Cloudinary
│   │   └── salesReportService.js  # Relatórios
│   ├── utils/
│   │   ├── createAdminUser.js     # Cria admin inicial
│   │   ├── jwt.js                 # Funções JWT
│   │   └── protocolGenerator.js   # Gera protocolo único
│   ├── validators/
│   │   ├── authValidator.js       # Validação auth
│   │   ├── clientValidator.js     # Validação cliente
│   │   ├── flagValidator.js       # Validação bandeira
│   │   └── planValidator.js       # Validação plano
│   ├── app.js                     # Configuração Express
│   └── server.js                  # Inicialização servidor
├── uploads/                       # Arquivos temp (não versionar)
├── .dockerignore                  # Ignora no build Docker
├── .env                          # Variáveis ambiente (não versionar)
├── .env.example                  # Template variáveis
├── .gitignore                    # Ignora no Git
├── .sequelizerc                  # Configuração Sequelize CLI
├── docker-compose.yml            # Configuração Docker
├── package.json                  # Dependências e scripts
└── README.md                     # Documentação
```

---

## 🌐 API Endpoints

### 🔓 Públicos (sem autenticação)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Info da API |
| GET | `/health` | Health check |
| GET | `/api/public/check-status` | Consulta por protocolo/CNPJ |
| GET | `/api/plans` | Listar planos ativos |
| GET | `/api/flags` | Listar bandeiras ativas |

### 🔐 Autenticação

| Método | Endpoint | Descrição | Role |
|--------|----------|-----------|------|
| POST | `/api/auth/login` | Login | Público |
| GET | `/api/auth/me` | Dados do usuário logado | Todos |
| PUT | `/api/auth/profile` | Atualizar perfil | Todos |
| POST | `/api/auth/register` | Criar usuário | Admin |
| GET | `/api/auth/users` | Listar usuários | Admin |
| PUT | `/api/auth/users/:id` | Atualizar usuário | Admin |

### 👥 Clientes

| Método | Endpoint | Descrição | Role |
|--------|----------|-----------|------|
| POST | `/api/clients` | Criar cliente | User/Admin |
| GET | `/api/clients` | Listar clientes | Todos* |
| GET | `/api/clients/:id` | Buscar cliente | Todos* |
| PUT | `/api/clients/:id` | Atualizar cliente | User/Admin |
| DELETE | `/api/clients/:id` | Deletar cliente | Admin |
| PATCH | `/api/clients/:clientId/flags/:flagId/status` | Atualizar status bandeira | User/Admin |

*Filtrado por permissões

### 🎫 Bandeiras

| Método | Endpoint | Descrição | Role |
|--------|----------|-----------|------|
| POST | `/api/flags` | Criar bandeira | Admin |
| PUT | `/api/flags/:id` | Atualizar bandeira | Admin |
| DELETE | `/api/flags/:id` | Deletar bandeira | Admin |

### 📦 Planos

| Método | Endpoint | Descrição | Role |
|--------|----------|-----------|------|
| POST | `/api/plans` | Criar plano | Admin |
| PUT | `/api/plans/:id` | Atualizar plano | Admin |
| DELETE | `/api/plans/:id` | Deletar plano | Admin |

### 📈 Relatórios

| Método | Endpoint | Descrição | Role |
|--------|----------|-----------|------|
| GET | `/api/reports/daily?date=YYYY-MM-DD` | Relatório diário | Admin |
| GET | `/api/reports/monthly?month=M&year=YYYY` | Relatório mensal | Admin |
| GET | `/api/reports/yearly?year=YYYY` | Relatório anual | Admin |
| GET | `/api/reports/partner/:id` | Relatório parceiro | Admin |

---

## 🔐 Roles e Permissões

### 👤 USER (Usuário Comum)

**Pode:**
- ✅ Ver apenas próprios clientes
- ✅ Criar clientes
- ✅ Editar próprios clientes
- ✅ Alterar status de bandeiras dos próprios clientes

**Não pode:**
- ❌ Ver clientes de outros
- ❌ Deletar clientes
- ❌ Criar usuários
- ❌ Alterar tipo de usuário
- ❌ Gerenciar planos/bandeiras
- ❌ Ver relatórios

### 🤝 PARTNER (Parceiro)

**Pode:**
- ✅ Ver clientes onde foi marcado como parceiro

**Visualiza apenas:**
- Nome
- Razão Social
- Tipo de Cartão
- Telefone
- Status
- Bandeiras Selecionadas
- Observações

**Não pode:**
- ❌ Criar/editar/deletar clientes
- ❌ Criar usuários
- ❌ Ver dados completos
- ❌ Alterar status

### 👑 ADMIN (Administrador)

**Pode TUDO:**
- ✅ Ver todos os clientes
- ✅ Criar/editar/deletar clientes
- ✅ Criar/editar usuários
- ✅ Promover usuários a admin
- ✅ Desativar usuários
- ✅ Gerenciar planos (criar/editar/deletar/preços)
- ✅ Gerenciar bandeiras (criar/editar/deletar/preços)
- ✅ Ver todos os relatórios

---

## 🧪 Testes

Veja o arquivo **TESTES.md** para guia completo de testes no Insomnia.

---

## 🚀 Deploy

### Produção (VPS)

1. **Configurar variáveis de ambiente de produção**
2. **Usar PM2 para gerenciar processo**
3. **Nginx como proxy reverso**
4. **SSL com Let's Encrypt**
5. **Backups automáticos do banco**

Veja documentação completa em **GUIA_COMPLETO_PRODUCAO.md**

---

## 📝 Scripts NPM
```bash
npm start          # Inicia em produção
npm run dev        # Inicia em desenvolvimento (nodemon)
npm run migrate    # Executa migrations
npm run migrate:undo # Desfaz última migration
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ por [Seu Nome]

---

## 📞 Suporte

- 📧 Email: suporte@cardflags.com
- 💬 Issues: [GitHub Issues](https://github.com/seu-usuario/card-flags-system/issues)

---

## 🎉 Agradecimentos

- Sequelize pela excelente ORM
- Cloudinary pelo armazenamento confiável
- Comunidade Node.js

---

**Feito com ☕ e muito código!**