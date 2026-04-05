/**
 * ENTIDADE: Flag (Bandeira) 
 * Responsabilidade: Representar uma bandeira e validar regras do domínio. 
 */

class Flag {
  constructor({
    id,
    name,
    description,
    price,
    is_active = true,
    created_at,
    updated_at,
  }) {
    // VALIDAR REGRAS DO DOMÍNIO
    this.validateName(name);
    this.validatePrice(price);

    // ATRIBUIR PROPRIEDADES
    this.id = id;
    this.name = name.trim(); // Remove espaços em branco
    this.description = description || null;
    this.price = parseFloat(price);
    this.is_active = is_active;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * REGRA DO DOMÍNIO: Nome obrigatório e único (será verificado no repository)
   */
  validateName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Nome da bandeira é obrigatório.');
    }

    if (name.trim().length === 0) {
      throw new Error('Nome da bandeira não pode estar vazio.');
    }

    if (name.length > 255) {
      throw new Error('Nome não pode ter mais de 255 caracteres.');
    }
  }

  /**
   * REGRA DO DOMÍNIO: Preço deve ser positivo
   */
  validatePrice(price) {
    const numPrice = parseFloat(price);

    if (isNaN(numPrice)) {
      throw new Error('Preço deve ser um número válido.');
    }

    if (numPrice <= 0) {
      throw new Error('Preço deve ser maior que zero.');
    }
  }

  /**
   * REGRA DO DOMÍNIO: Desativar flag
   */
  deactivate() {
    if (!this.is_active) {
      throw new Error('Flag já está desativada.');
    }
    this.is_active = false;
    this.updated_at = new Date();
  }

  /**
   * REGRA DO DOMÍNIO: Reativar flag
   */
  reactivate() {
    if (this.is_active) {
      throw new Error('Flag já está ativa.');
    }
    this.is_active = true;
    this.updated_at = new Date();
  }

  /**
   * REGRA DO DOMÍNIO: Atualizar dados
   */
  update({ name, description, price }) {
    if (name) {
      this.validateName(name);
      this.name = name.trim();
    }

    if (description !== undefined) {
      this.description = description || null;
    }

    if (price !== undefined) {
      this.validatePrice(price);
      this.price = parseFloat(price);
    }

    this.updated_at = new Date();
  }

  /**
   * Serializar para JSON (sem expor dados internos)
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Flag;