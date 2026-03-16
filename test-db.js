const db = require('./src/models/index');

async function testConnection() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Conexão com o banco OK.');
    
    const userCount = await db.User.count();
    console.log(`✅ Modelos carregados! Existem ${userCount} usuários no banco.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro crítico no carregamento:', error);
    process.exit(1);
  }
}

testConnection();
