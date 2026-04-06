/**
 * ENTIDADE: User
 */

class User {
  constructor({
    id,
    name,
    email,
    cpf,
    address_street,
    address_number,
    address_complement,
    address_neighborhood,
    address_city,
    address_state,
    address_zip,
    role,
    is_active = true,
    last_login_at = null,
    created_at,
    updated_at,
  }) {
    this.validateName(name);
    this.validateEmail(email);
    this.validateRole(role);

    this.id = id;
    this.name = name.trim();
    this.email = email.toLowerCase().trim();
    this.cpf = cpf || null;
    this.address_street = address_street || null;
    this.address_number = address_number || null;
    this.address_complement = address_complement || null;
    this.address_neighborhood = address_neighborhood || null;
    this.address_city = address_city || null;
    this.address_state = address_state || null;
    this.address_zip = address_zip || null;
    this.role = role;
    this.is_active = is_active;
    this.last_login_at = last_login_at;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * REGRA DO DOMÍNIO: Validar nome obrigatório
   */
  validateName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Nome é obrigatório e deve ser string');
    }

    if (name.trim().length === 0) {
      throw new Error('Nome não pode estar vazio');
    }

    if (name.length > 150) {
      throw new Error('Nome não pode ter mais de 150 caracteres');
    }
  }

  /**
   * REGRA DO DOMÍNIO: Validar email
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      throw new Error('E-mail inválido');
    }
  }

  /**
   * REGRA DO DOMÍNIO: Validar role
   */
  validateRole(role) {
    const validRoles = ['admin', 'user', 'partner'];

    if (!role || !validRoles.includes(role)) {
      throw new Error('Role deve ser "admin", "user" ou "partner"');
    }
  }

  /**
   * REGRA DO DOMÍNIO: Atualizar perfil (apenas campos de perfil)
   * ✅ O próprio usuário pode atualizar
   */
  updateProfile({ name, cpf, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip }) {
    if (name) {
      this.validateName(name);
      this.name = name.trim();
    }

    if (cpf !== undefined) {
      this.cpf = cpf || null;
    }

    if (address_street !== undefined) {
      this.address_street = address_street || null;
    }

    if (address_number !== undefined) {
      this.address_number = address_number || null;
    }

    if (address_complement !== undefined) {
      this.address_complement = address_complement || null;
    }

    if (address_neighborhood !== undefined) {
      this.address_neighborhood = address_neighborhood || null;
    }

    if (address_city !== undefined) {
      this.address_city = address_city || null;
    }

    if (address_state !== undefined) {
      this.address_state = address_state || null;
    }

    if (address_zip !== undefined) {
      this.address_zip = address_zip || null;
    }
  }

  /**
   * REGRA DO DOMÍNIO: Validar auto-edição (um usuário não pode mudar seu próprio role)
   */
  canChangeRole(requesterId, targetId) {
    // Admin pode mudar o role de outros
    if (requesterId !== targetId) return true;

    // Usuário comum não pode mudar o próprio role
    return false;
  }

  /**
   * REGRA DO DOMÍNIO: Validar auto-desativação
   */
  canBeDeactivated(requesterId, targetId) {
    // Não pode desativar a si mesmo
    return requesterId !== targetId;
  }

  /**
   * REGRA DO DOMÍNIO: Verificar se é primeiro login
   */
  isFirstLogin() {
    return this.last_login_at === null;
  }

  /**
   * REGRA DO DOMÍNIO: Desativar usuário
   */
  deactivate() {
    if (!this.is_active) {
      throw new Error('Usuário já está desativado');
    }
    this.is_active = false;
  }

  /**
   * REGRA DO DOMÍNIO: Reativar usuário
   */
  reactivate() {
    if (this.is_active) {
      throw new Error('Usuário já está ativo');
    }
    this.is_active = true;
  }

  /**
   * Serializar para JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      cpf: this.cpf,
      address_street: this.address_street,
      address_number: this.address_number,
      address_complement: this.address_complement,
      address_neighborhood: this.address_neighborhood,
      address_city: this.address_city,
      address_state: this.address_state,
      address_zip: this.address_zip,
      role: this.role,
      is_active: this.is_active,
      last_login_at: this.last_login_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = User;