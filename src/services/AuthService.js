const { User } = require('../models');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/auth');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * Regras de negócio de autenticação.
 * Controller → Service → Model. Nunca Controller → Model diretamente.
 */

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Autentica um usuário com e-mail e senha.
 *
 * Regra de primeiro login:
 *   Se `last_login_at` for NULL → usuário nunca logou.
 *   Retorna `mustChangePassword: true` e NÃO atualiza `last_login_at`.
 *   O `last_login_at` só é definido após a troca de senha via changePassword().
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ user, token, refreshToken, mustChangePassword }}
 */
const login = async (email, password) => {
  // 1. Busca o usuário — inclui `password` explicitamente (omitido no toJSON)
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
    attributes: ['id', 'name', 'email', 'password', 'role', 'is_active', 'last_login_at'],
  });

  // 2. Usuário não encontrado — mesma mensagem de senha errada (evita enumeração)
  if (!user) {
    throw new AppError('E-mail ou senha incorretos.', 401);
  }

  // 3. Conta inativa
  if (!user.is_active) {
    throw new AppError('Conta desativada. Entre em contato com o administrador.', 403);
  }

  // 4. Valida senha via bcrypt
  const passwordMatch = await user.checkPassword(password);
  if (!passwordMatch) {
    throw new AppError('E-mail ou senha incorretos.', 401);
  }

  // 5. Detecta primeiro login (last_login_at === null)
  const isFirstLogin = user.last_login_at === null;

  // 6. Payload mínimo no token (sem dados sensíveis)
  const tokenPayload = { id: user.id, role: user.role };

  // 7. Gera access token + refresh token
  const token        = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // 8. Atualiza last_login_at APENAS se não for o primeiro login
  //    No primeiro login, o last_login_at é definido em changePassword()
  if (!isFirstLogin) {
    await User.update(
      { last_login_at: new Date() },
      { where: { id: user.id }, hooks: false }
    );
  }

  logger.info(
    { userId: user.id, role: user.role, firstLogin: isFirstLogin },
    isFirstLogin ? 'Primeiro login — troca de senha obrigatória.' : 'Login realizado com sucesso.'
  );

  return {
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
    token,
    refreshToken,
    mustChangePassword: isFirstLogin,
  };
};

// ─── Troca de Senha ───────────────────────────────────────────────────────────

/**
 * Troca a senha do usuário autenticado.
 *
 * Fluxo do primeiro login:
 *   1. Usuário loga → recebe mustChangePassword: true
 *   2. Chama PATCH /auth/change-password com currentPassword + newPassword
 *   3. Após sucesso, last_login_at é definido (desbloqueando o acesso normal)
 *
 * Também funciona para trocas voluntárias de senha por usuários já logados.
 *
 * @param {string} userId        - ID do usuário autenticado (vem de req.user)
 * @param {string} currentPassword
 * @param {string} newPassword   - Já validada pelo Yup no validationMiddleware
 * @returns {{ message: string }}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // 1. Busca o usuário com a senha (para validar a senha atual)
  const user = await User.findByPk(userId, {
    attributes: ['id', 'password', 'is_active', 'last_login_at'],
  });

  if (!user || !user.is_active) {
    throw new AppError('Usuário não encontrado ou inativo.', 404);
  }

  // 2. Verifica se a senha atual está correta
  const passwordMatch = await user.checkPassword(currentPassword);
  if (!passwordMatch) {
    throw new AppError('Senha atual incorreta.', 401);
  }

  // 3. Impede reutilização da mesma senha
  const isSamePassword = await user.checkPassword(newPassword);
  if (isSamePassword) {
    throw new AppError('A nova senha não pode ser igual à senha atual.', 400);
  }

  const isFirstLogin = user.last_login_at === null;

  // 4. Atualiza a senha e, se for o primeiro login, define o last_login_at
  //    O hook beforeUpdate no model fará o hash automaticamente
  await user.update({
    password:      newPassword,
    last_login_at: isFirstLogin ? new Date() : user.last_login_at,
  });

  logger.info(
    { userId, firstLogin: isFirstLogin },
    isFirstLogin
      ? 'Senha do primeiro login alterada. last_login_at definido.'
      : 'Senha alterada com sucesso.'
  );

  return {
    message: isFirstLogin
      ? 'Senha alterada com sucesso. Bem-vindo ao sistema!'
      : 'Senha alterada com sucesso.',
  };
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

/**
 * Renova o access token usando um refresh token válido.
 * @param {string} refreshToken
 * @returns {{ token: string }}
 */
const refreshAccessToken = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);

  const user = await User.findByPk(decoded.id, {
    attributes: ['id', 'role', 'is_active'],
  });

  if (!user || !user.is_active) {
    throw new AppError('Usuário não encontrado ou inativo.', 401);
  }

  const token = generateToken({ id: user.id, role: user.role });

  logger.info({ userId: user.id }, 'Access token renovado.');

  return { token };
};

module.exports = { login, changePassword, refreshAccessToken };
