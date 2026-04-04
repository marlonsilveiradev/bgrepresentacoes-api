# 1. ESTÁGIO BASE (Comum a ambos)
FROM node:24-alpine AS base
RUN apk add --no-cache bash
WORKDIR /app
COPY package*.json ./
EXPOSE 3000

# 2. ESTÁGIO DE DESENVOLVIMENTO (Usado localmente)
FROM base AS development
# Instala TUDO (incluindo nodemon e devDependencies)
RUN npm install 
COPY . .
# O comando local será sobrescrito pelo docker-compose, mas deixamos um padrão
CMD ["npm", "run", "dev"]

# 3. ESTÁGIO DE PRODUÇÃO (Usado pelo Railway ou VPS)
FROM base AS production
# Instala wget para healthcheck
RUN apk add --no-cache wget
# Instala apenas dependências de produção
RUN npm ci --omit=dev
COPY . .
# Rodar como usuário node (segurança)
USER node
CMD ["node", "server.js"]