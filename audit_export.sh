# #!/bin/bash

# OUTPUT="auditoria_completo.txt"

# echo "Iniciando auditoria do projeto..."
# echo "Arquivo de saída: $OUTPUT"

# (
# echo "========================================"
# echo "AUDITORIA DE PROJETO NODEJS"
# echo "Data: $(date)"
# echo "========================================"

# echo -e "\n=============================="
# echo "INFORMAÇÕES DO SISTEMA"
# echo "=============================="
# node -v
# npm -v
# npx --version

# echo -e "\n=============================="
# echo "ESTRUTURA DO PROJETO"
# echo "=============================="
# tree -I 'node_modules|dist|.git|.env' -F

# echo -e "\n=============================="
# echo "ARQUIVOS PRINCIPAIS"
# echo "=============================="

# for file in package.json Dockerfile docker-compose.yml .sequelizerc index.js server.js app.js; do
#   if [ -f "$file" ]; then
#     echo -e "\n--- FILE: $file ---"
#     cat "$file"
#   fi
# done

# echo -e "\n=============================="
# echo "VARIÁVEIS DE AMBIENTE (.env.example)"
# echo "=============================="
# if [ -f ".env.example" ]; then
#   cat .env.example
# else
#   echo ".env.example não encontrado"
# fi

# echo -e "\n=============================="
# echo "DEPENDÊNCIAS DO PROJETO"
# echo "=============================="
# cat package.json

# echo -e "\n=============================="
# echo "DEPENDÊNCIAS INSTALADAS"
# echo "=============================="
# npm list --depth=0

# echo -e "\n=============================="
# echo "VERIFICAÇÃO DE VULNERABILIDADES"
# echo "=============================="
# npm audit

# echo -e "\n=============================="
# echo "INFORMAÇÕES DO DOCKER"
# echo "=============================="

# if [ -f "Dockerfile" ]; then
#   echo -e "\n--- Dockerfile ---"
#   cat Dockerfile
# fi

# if [ -f "docker-compose.yml" ]; then
#   echo -e "\n--- docker-compose.yml ---"
#   cat docker-compose.yml
# fi

# echo -e "\n=============================="
# echo "CONFIGURAÇÃO SEQUELIZE"
# echo "=============================="

# if [ -f ".sequelizerc" ]; then
#   cat .sequelizerc
# fi

# echo -e "\n=============================="
# echo "MIGRATIONS"
# echo "=============================="

# if [ -d "src/database/migrations" ]; then
#   ls src/database/migrations
# fi

# echo -e "\n=============================="
# echo "SEEDERS"
# echo "=============================="

# if [ -d "src/database/seeders" ]; then
#   ls src/database/seeders
# fi

# echo -e "\n=============================="
# echo "ROTAS DA API"
# echo "=============================="
# grep -R "router." src/routes 2>/dev/null

# echo -e "\n=============================="
# echo "MIDDLEWARES"
# echo "=============================="
# ls src/middlewares 2>/dev/null

# echo -e "\n=============================="
# echo "SERVICES"
# echo "=============================="
# ls src/services 2>/dev/null

# echo -e "\n=============================="
# echo "MODELS"
# echo "=============================="
# ls src/models 2>/dev/null

# echo -e "\n=============================="
# echo "VALIDATORS"
# echo "=============================="
# ls src/validators 2>/dev/null

# echo -e "\n=============================="
# echo "LOGS / LOGGER"
# echo "=============================="
# grep -R "pino" src 2>/dev/null

# echo -e "\n=============================="
# echo "SEGURANÇA"
# echo "=============================="

# echo -e "\nHelmet:"
# grep -R "helmet" src 2>/dev/null

# echo -e "\nRate Limit:"
# grep -R "rateLimit" src 2>/dev/null

# echo -e "\nJWT:"
# grep -R "jwt" src 2>/dev/null

# echo -e "\nBcrypt:"
# grep -R "bcrypt" src 2>/dev/null

# echo -e "\n=============================="
# echo "UPLOAD DE ARQUIVOS"
# echo "=============================="
# grep -R "multer\|cloudinary" src 2>/dev/null

# echo -e "\n=============================="
# echo "SWAGGER / DOCUMENTAÇÃO"
# echo "=============================="
# grep -R "swagger" src 2>/dev/null

# echo -e "\n=============================="
# echo "TESTES"
# echo "=============================="
# ls test 2>/dev/null || ls tests 2>/dev/null

# echo -e "\n=============================="
# echo "TODOS OS TODOs DO PROJETO"
# echo "=============================="
# grep -R "TODO" src 2>/dev/null

# echo -e "\n=============================="
# echo "CÓDIGO FONTE"
# echo "=============================="

# find src -type f -name "*.js" \
# -not -path "*/node_modules/*" \
# -exec echo -e "\n--- FILE: {} ---" \; \
# -exec cat {} \;

# echo -e "\n=============================="
# echo "TAMANHO DO PROJETO"
# echo "=============================="
# du -sh .

# echo -e "\n=============================="
# echo "FIM DA AUDITORIA"
# echo "=============================="

# ) > $OUTPUT

# echo "Auditoria concluída!"
# echo "Arquivo gerado: $OUTPUT"

#!/bin/bash

OUTPUT="api_audit.txt"

echo "==== PROJECT STRUCTURE ====" > $OUTPUT
tree -I "node_modules|coverage|.git" >> $OUTPUT

echo -e "\n==== PACKAGE.JSON ====" >> $OUTPUT
cat package.json >> $OUTPUT

echo -e "\n==== APP.JS ====" >> $OUTPUT
cat src/app.js >> $OUTPUT

echo -e "\n==== SERVER.JS ====" >> $OUTPUT
cat src/server.js >> $OUTPUT

echo -e "\n==== CONFIG ====" >> $OUTPUT
cat src/config/*.js >> $OUTPUT

echo -e "\n==== MIDDLEWARES ====" >> $OUTPUT
cat src/middlewares/*.js >> $OUTPUT

echo -e "\n==== ROUTES ====" >> $OUTPUT
cat src/routes/*.js >> $OUTPUT

echo -e "\n==== MODELS ====" >> $OUTPUT
cat src/models/*.js >> $OUTPUT

echo -e "\n==== SERVICES ====" >> $OUTPUT
cat src/services/*.js >> $OUTPUT

echo -e "\n==== CONTROLLERS ====" >> $OUTPUT
cat src/controllers/*.js >> $OUTPUT

echo -e "\n==== DOCKERFILES ====" >> $OUTPUT
cat Dockerfile >> $OUTPUT
cat docker-compose*.yml >> $OUTPUT

echo -e "\n==== ENV EXAMPLE ====" >> $OUTPUT
cat .env.example >> $OUTPUT

echo "Audit export generated: $OUTPUT"