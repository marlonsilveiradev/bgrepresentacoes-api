/**
 * ENTIDADE: Auth
 * Contém regras de domínio relacionadas a autenticação
 */

class Auth {
  /**
   * REGRA DO DOMÍNIO: Validar força de senha
   */
  static validatePasswordStrength(password) {
    if (password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    // Opcional: validar complexidade
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
      .filter(Boolean).length;

    // Retorna nível de força (1-4)
    return strengthScore;
  }

  /**
   * REGRA DO DOMÍNIO: Validar unicidade de email
   */
  static validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * REGRA DO DOMÍNIO: Verificar se a troca de senha é obrigatória
   * ✅ Olha para a flag específica e não apenas para a data
   */
  static isChangePasswordRequired(user) {
    return user.must_change_password === true;
  }

  /**
   * REGRA DO DOMÍNIO: Construir payload de token
   */
  static buildTokenPayload(user) {
    return {
      sub: user.id,
      role: user.role,
      email: user.email,
      mcp: user.must_change_password,
    };
  }
}

module.exports = Auth;