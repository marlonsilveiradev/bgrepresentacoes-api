# 🚀 BG Representações API

API REST desenvolvida para gestão de clientes e operações comerciais da BG Representações.

A aplicação foi construída com foco em boas práticas de arquitetura, segurança e organização de código, utilizando Node.js e Express.

---

## 🔗 Acesso à API

**Base URL:**

https://bgrepresentacoes-api-production.up.railway.app/api/v1

**Health check:**

GET /health

---

## 📄 Documentação (Swagger)

A documentação interativa está disponível em:

👉 https://bgrepresentacoes-api-production.up.railway.app/api-docs/

### 🔐 Acesso

- usuário: admin  
- senha: bg@api123  

> A documentação permite testar as rotas diretamente pelo navegador.  
> Algumas rotas exigem autenticação via token JWT.

---

## 🔐 Autenticação

A API utiliza autenticação baseada em JWT.

**Fluxo básico:**

1. Realizar login  
2. Receber token  
3. Enviar token no header das requisições  

Exemplo:

Authorization: Bearer <token>

---

## 🛡️ Segurança

A aplicação conta com diversas camadas de proteção:

- Helmet (headers de segurança)  
- Rate limiting (proteção contra abuso)  
- CORS configurado por ambiente  
- Sanitização contra NoSQL Injection  
- Proteção contra XSS  
- Compressão de respostas  

---

## ⚙️ Tecnologias utilizadas

- Node.js  
- Express  
- MongoDB  
- Mongoose  
- Swagger  
- Pino (logging)  

---

## 📦 Deploy

A aplicação está hospedada no Railway e preparada para deploy em VPS.

---

## 🧪 Status do projeto

O backend está funcional e validado.  
O frontend está em desenvolvimento e será integrado em breve.

---

## 👨‍💻 Autor

Marlon Silveira  
GitHub: https://github.com/marlonsilveiradev