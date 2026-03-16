# Usa a imagem estável do Node.js
FROM node:20-alpine

# Instala ferramentas necessárias para compilar dependências se necessário
RUN apk add --no-cache bash

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante dos arquivos do projeto
COPY . .

# Expõe a porta que a API utiliza
EXPOSE 3000

# rodar como usuário node (mais seguro)
USER node

# Comando para rodar a aplicação
CMD ["node", "src/server.js"]