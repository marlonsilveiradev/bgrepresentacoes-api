#!/bin/bash

OUTPUT="FULL_BACKEND_AUDIT.txt"

echo "🔎 Iniciando auditoria completa..."

(
echo "=================================================="
echo "🚀 BACKEND FULL AUDIT REPORT"
echo "=================================================="
echo "📅 Data: $(date)"
echo "📁 Projeto: $(pwd)"
echo "=================================================="

# ==================================================
# 🖥️ AMBIENTE
# ==================================================
echo -e "\n\n================ ENVIRONMENT ================="
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
echo "NPX: $(npx --version)"

# ==================================================
# 📦 PACKAGE
# ==================================================
echo -e "\n\n================ PACKAGE.JSON ================="
cat package.json

echo -e "\n\n================ DEPENDENCIES INSTALLED ================="
npm list --depth=0

echo -e "\n\n================ VULNERABILITIES ================="
npm audit || true

# ==================================================
# 🌳 ESTRUTURA
# ==================================================
echo -e "\n\n================ PROJECT STRUCTURE ================="
tree -I "node_modules|.git|coverage|dist|build"

# ==================================================
# ⚙️ CONFIG
# ==================================================
echo -e "\n\n================ CONFIG FILES ================="
find src/config -type f -exec echo -e "\n--- {} ---" \; -exec cat {} \;

# ==================================================
# 🔐 AUTH FLOW (CRÍTICO)
# ==================================================
echo -e "\n\n================ AUTH FLOW ================="

echo -e "\n--- JWT USAGE ---"
grep -R "jwt" src || true

echo -e "\n--- AUTH MIDDLEWARE ---"
grep -R "auth" src/middlewares || true

echo -e "\n--- LOGIN FLOW ---"
grep -R "login" src || true

echo -e "\n--- REFRESH TOKEN FLOW ---"
grep -R "refresh" src || true

echo -e "\n--- PASSWORD FLOW ---"
grep -R "password" src || true

# ==================================================
# 🧠 CONTROLLERS (CRÍTICO PARA IA)
# ==================================================
echo -e "\n\n================ CONTROLLERS ================="
find src/controllers -type f -exec echo -e "\n--- {} ---" \; -exec cat {} \;

# ==================================================
# ⚙️ SERVICES (LÓGICA DE NEGÓCIO)
# ==================================================
echo -e "\n\n================ SERVICES ================="
find src/services -type f -exec echo -e "\n--- {} ---" \; -exec cat {} \;

# ==================================================
# 🗄️ MODELS (SEQUELIZE — CRÍTICO)
# ==================================================
echo -e "\n\n================ MODELS ================="
find src/models -type f -exec echo -e "\n--- {} ---" \; -exec cat {} \;

echo -e "\n\n================ SEQUELIZE SERIALIZATION ================="
grep -R "toJSON" src || true
grep -R "dataValues" src || true

# ==================================================
# 🧩 ROTAS
# ==================================================
echo -e "\n\n================ ROUTES ================="
find src/routes -type f -exec echo -e "\n--- {} ---" \; -exec cat {} \;

# ==================================================
# 🔗 MAPA DE ROTAS (VISÃO RÁPIDA)
# ==================================================
echo -e "\n\n================ ROUTE MAP ================="
grep -R "router." src/routes || true

# ==================================================
# 🧱 MIDDLEWARES
# ==================================================
echo -e "\n\n================ MIDDLEWARES ================="
find src/middlewares -type f -exec echo -e "\n--- {} ---" \; -exec cat {} \;

# ==================================================
# 🔐 SEGURANÇA
# ==================================================
echo -e "\n\n================ SECURITY ================="

echo -e "\n--- HELMET ---"
grep -R "helmet" src || true

echo -e "\n--- RATE LIMIT ---"
grep -R "rateLimit" src || true

echo -e "\n--- CORS ---"
grep -R "cors" src || true

echo -e "\n--- BCRYPT ---"
grep -R "bcrypt" src || true

echo -e "\n--- INPUT VALIDATION ---"
grep -R "validator" src || true

# ==================================================
# ⚠️ POSSÍVEIS PROBLEMAS
# ==================================================
echo -e "\n\n================ POTENTIAL ISSUES ================="

echo -e "\n--- ANY RAW SEQUELIZE RETURN ---"
grep -R "return user" src || true

echo -e "\n--- POSSIBLE PASSWORD LEAK ---"
grep -R "password" src/controllers || true

echo -e "\n--- DIRECT MODEL RETURNS ---"
grep -R "res.json" src/controllers || true

echo -e "\n--- MISSING TOJSON USAGE ---"
grep -R "dataValues" src || true

# ==================================================
# 📡 REQUEST FLOW DEBUG
# ==================================================
echo -e "\n\n================ REQUEST FLOW ================="
grep -R "req." src || true

echo -e "\n\n================ RESPONSE FLOW ================="
grep -R "res." src || true

# ==================================================
# 📂 BANCO
# ==================================================
echo -e "\n\n================ DATABASE ================="
ls src/database 2>/dev/null || true

echo -e "\n--- MIGRATIONS ---"
ls src/database/migrations 2>/dev/null || true

echo -e "\n--- SEEDERS ---"
ls src/database/seeders 2>/dev/null || true

# ==================================================
# 🐳 DOCKER
# ==================================================
echo -e "\n\n================ DOCKER ================="

[ -f Dockerfile ] && echo -e "\n--- Dockerfile ---" && cat Dockerfile
[ -f docker-compose.yml ] && echo -e "\n--- docker-compose.yml ---" && cat docker-compose.yml

# ==================================================
# 🌱 ENV
# ==================================================
echo -e "\n\n================ ENV ================="
[ -f .env.example ] && cat .env.example || echo "No .env.example"

# ==================================================
# 🧪 TESTES
# ==================================================
echo -e "\n\n================ TESTS ================="
ls test 2>/dev/null || ls tests 2>/dev/null || echo "No tests found"

# ==================================================
# 🧠 LOGGING
# ==================================================
echo -e "\n\n================ LOGGING ================="
grep -R "pino" src || true
grep -R "console" src || true

# ==================================================
# 📎 UPLOAD
# ==================================================
echo -e "\n\n================ UPLOAD ================="
grep -R "multer" src || true
grep -R "cloudinary" src || true

# ==================================================
# 🧾 TODOs
# ==================================================
echo -e "\n\n================ TODOS ================="
grep -R "TODO" src || true

# ==================================================
# 📏 TAMANHO
# ==================================================
echo -e "\n\n================ SIZE ================="
du -sh .

echo -e "\n\n=================================================="
echo "✅ AUDIT COMPLETED"
echo "=================================================="

) > $OUTPUT

echo "✅ Auditoria finalizada: $OUTPUT"