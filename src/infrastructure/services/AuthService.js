const { User, RefreshToken, sequelize } = require('../repositories/models');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../shared/utils/auth');
const { hashToken } = require('../../shared/utils/tokenHash');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');

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

  if (!email || !password) {
    throw new AppError('E-mail e senha são obrigatórios.', 400);
  }

  // 2. Usuário não encontrado — mesma mensagem de senha errada (evita enumeração)
  if (!user) {
    logger.warn({ email }, 'Tentativa de login com usuário inexistente');
    throw new AppError('E-mail ou senha incorretos.', 401);
  }

  // 3. Conta inativa
  if (!user.is_active) {
    throw new AppError('Conta desativada. Entre em contato com o administrador.', 403);
  }

  // 4. Valida senha via bcrypt
  const passwordMatch = await user.checkPassword(password);
  if (!passwordMatch) {
    logger.warn({ userId: user.id }, 'Senha inválida');
    throw new AppError('E-mail ou senha incorretos.', 401);
  }

  // 5. Detecta primeiro login (last_login_at === null)
  const isFirstLogin = user.last_login_at === null;

  // 6. Payload mínimo no token (sem dados sensíveis)
  const tokenPayload = { sub: user.id, role: user.role };

  // 7. Gera access token + refresh token
  const token = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Hash do refresh token para armazenamento seguro (não armazenar token puro)
  const hashedToken = hashToken(refreshToken);

  // ⏰ Expiração
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await sequelize.transaction(async (t) => {
    // Revoga todos os refresh tokens anteriores do usuário (single session policy)
    await RefreshToken.update(
      { revoked: true },
      { where: { user_id: user.id }, transaction: t }
    );

    // cria novo token
    await RefreshToken.create({
      user_id: user.id,
      token_hash: hashedToken,
      expires_at: expiresAt,
    }, { transaction: t });
  });

  // 8. Atualiza last_login_at APENAS se não for o primeiro login
  if (!isFirstLogin) {
    await user.update(
      { last_login_at: new Date() },
      { hooks: false }
    );
  }

  logger.info(
    { userId: user.id, role: user.role, firstLogin: isFirstLogin },
    isFirstLogin ? 'Primeiro login — troca de senha obrigatória.' : 'Login realizado com sucesso.'
  );

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
};

// ─── Troca de Senha ───────────────────────────────────────────────────────────

/**
 * Troca a senha do usuário autenticado.
 * Fluxo do primeiro login:
 *   1. Usuário loga → recebe mustChangePassword: true
 *   2. Chama PATCH /auth/change-password com currentPassword + newPassword
 *   3. Após sucesso, last_login_at é definido (desbloqueando o acesso normal)
 * Também funciona para trocas voluntárias de senha por usuários já logados.
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
  await sequelize.transaction(async (t) => {
    await user.update({
      password: newPassword,
      last_login_at: isFirstLogin ? new Date() : user.last_login_at,
    }, { transaction: t });

    await RefreshToken.update(
      { revoked: true },
      { where: { user_id: userId }, transaction: t }
    );
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

  if (!decoded.sub) {
    throw new AppError('Token inválido.', 401);
  }

  const hashed = hashToken(refreshToken);

  const storedToken = await RefreshToken.findOne({
    where: {
      user_id: decoded.sub,
      token_hash: hashed,
      revoked: false,
    },
  });

  if (!storedToken) {
    throw new AppError('Refresh token inválido.', 401);
  }

  if (new Date() > storedToken.expires_at) {
    throw new AppError('Refresh token expirado.', 401);
  }

  const user = await User.findByPk(decoded.sub, {
    attributes: ['id', 'role', 'is_active'],
  });

  if (!user || !user.is_active) {
    throw new AppError('Usuário inválido.', 401);
  }

  const newToken = generateToken({ sub: user.id, role: user.role });
  const newRefreshToken = generateRefreshToken({ sub: user.id, role: user.role });

  const newHashed = hashToken(newRefreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await sequelize.transaction(async (t) => {
    await storedToken.update(
      { revoked: true },
      { transaction: t }
    );

    await RefreshToken.create({
      user_id: user.id,
      token_hash: newHashed,
      expires_at: expiresAt,
    }, { transaction: t });
  });

  return {
    token: newToken,
    refreshToken: newRefreshToken,
  };
};

module.exports = { login, changePassword, refreshAccessToken, };
