require('dotenv').config({ path: '.env.test' });

const { execSync } = require('child_process');

module.exports = async () => {
  console.log('\n🔧 Preparando banco de dados de teste...');
  
  // Roda as migrations no banco de TESTE
  execSync(
    'npx sequelize-cli db:migrate --migrations-path=src/infrastructure/database/migrations',
    {
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'inherit'
    }
  );

  console.log('✅ Banco de teste pronto!\n');
};