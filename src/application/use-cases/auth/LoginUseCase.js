/**
 * USE CASE: Login
 * Responsabilidade: Executar lógica de login
 */

const AppError = require('../../../shared/utils/AppError');
const { generateToken, generateRefreshToken } = require('../../../shared/utils/auth');
const Auth = require('../../../domain/entities/Auth');
const logger = require('../../../infrastructure/config/logger');

class LoginUseCase {
  constructor(userRepository, refreshTokenRepository) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute(loginDTO) {
    // ✅ PASSO 1: Buscar usuário por email
    const user = await this.userRepository.findByEmail(loginDTO.email);

    // ✅ PASSO 2: Validar usuário existe e está ativo
    this._validateUser(user, loginDTO.email);

    // ✅ PASSO 3: Validar senha
    await this._validatePassword(user, loginDTO.password);

    // ✅ PASSO 4: Verificar se é primeiro login
    const isFirstLogin = Auth.isFirstLogin(user.last_login_at);

    // ✅ PASSO 5: Gerar tokens
    const tokenPayload = Auth.buildTokenPayload(user);
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // ✅ PASSO 6: Revogar tokens antigos e criar novo
    await this.refreshTokenRepository.revokeAllForUser(user.id);
    await this.refreshTokenRepository.create(user.id, refreshToken);

    // ✅ PASSO 7: Atualizar last_login_at (se não for primeiro login)
    if (!isFirstLogin) {
      await this.userRepository.updateLastLogin(user.id);
    }

    // ✅ PASSO 8: Log
    logger.info(
      { userId: user.id, role: user.role, firstLogin: isFirstLogin },
      isFirstLogin
        ? 'Primeiro login — troca de senha obrigatória.'
        : 'Login realizado com sucesso.'
    );

    // ✅ PASSO 9: Retornar dados estruturados
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      refreshToken,
      mustChangePassword: isFirstLogin,
    };
  }

  /**
   * Validar se usuário existe e está ativo
   */
  _validateUser(user, email) {
    if (!user) {
      logger.warn({ email }, 'Tentativa de login com usuário inexistente');
      throw new AppError('E-mail ou senha incorretos.', 401);
    }

    if (!user.is_active) {
      logger.warn({ userId: user.id }, 'Tentativa de login com conta desativada');
      throw new AppError('Conta desativada. Entre em contato com o administrador.', 403);
    }
  }

  /**
   * Validar senha
   */
  async _validatePassword(user, password) {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      PASSWORD DEBUG COMPLETO             ║');
  console.log('╚════════════════════════════════════════╝\n');

  // 1. Informações do usuário
  console.log('📝 Usuário:');
  console.log('   - ID:', user.id);
  console.log('   - Email:', user.email);
  console.log('   - Password no banco (completo):');
  console.log('     ', user.password);

  // 2. Senha enviada
  console.log('\n🔑 Senha enviada:');
  console.log('   -', password);
  console.log('   - Tipo:', typeof password);
  console.log('   - Length:', password?.length);

  // 3. Teste manual do bcrypt
  console.log('\n🧪 Teste manual bcrypt.compare():');
  
  try {
    const bcrypt = require('bcryptjs');
    
    const manualMatch = await bcrypt.compare(password, user.password);
    console.log('   - Resultado (manual):', manualMatch);
    
    // 4. Teste com método prototype
    console.log('\n🔄 Teste via método prototype:');
    const prototypeMatch = await user.checkPassword(password);
    console.log('   - Resultado (prototype):', prototypeMatch);
    
    // 5. Informações adicionais
    console.log('\nℹ️  Informações adicionais:');
    console.log('   - Rounds do hash:', user.password?.substring(7, 9));
    console.log('   - Hash válido?', user.password?.match(/^\$2[aby]\$\d{2}\$.{53}$/g) !== null);
    
  } catch (error) {
    console.error('   ❌ Erro:', error.message);
  }

  console.log('\n╚════════════════════════════════════════╝\n');

  const passwordMatch = await user.checkPassword(password);

  if (!passwordMatch) {
    logger.warn({ userId: user.id }, 'Senha inválida');
    throw new AppError('E-mail ou senha incorretos.', 401);
  }
}
}

module.exports = LoginUseCase;