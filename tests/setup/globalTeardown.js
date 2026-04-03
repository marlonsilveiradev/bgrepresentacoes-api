require('dotenv').config({ path: '.env.test' });
const { execSync } = require('child_process');

module.exports = async () => {
  console.log('\n🧹 Limpando banco de dados de teste...');

  // Desfaz todas as migrations do banco de TESTE
  execSync(
    'npx sequelize-cli db:migrate:undo:all --migrations-path=src/infrastructure/database/migrations',
    {
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'inherit'
    }
  );

  console.log('✅ Limpeza concluída!\n');
};
