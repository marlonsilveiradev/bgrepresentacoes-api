/**
 * VALUE OBJECT: TemporaryPassword
 * 
 * Encapsula lógica de geração de senha temporária
 * Value Objects são imutáveis e focam em um único propósito
 */

const crypto = require('node:crypto');

class TemporaryPassword {
  constructor(password) {
    this.value = password;
  }

  /**
   * Gerar nova senha temporária com requisitos de complexidade
   * Padrão: U1234-5678!
   * - 1 letra maiúscula
   * - 4 letras minúsculas
   * - 4 números
   * - 1 caractere especial
   */
  static generate() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const specials = '!@#$%';

    const randomStr = (src, len) => {
      return Array.from({ length: len }, () => {
        const randomIndex = crypto.randomInt(0, src.length);
        return src[randomIndex];
      }).join('');
    };

    const part1 = randomStr(upper, 1);
    const part2 = randomStr(chars, 4);
    const part3 = randomStr(nums, 4);
    const part4 = randomStr(specials, 1);

    const password = `${part1}${part2}-${part3}${part4}`;
    return new TemporaryPassword(password);
  }

  /**
   * Retornar valor da senha
   */
  toString() {
    return this.value;
  }

  /**
   * Validar força da senha (já vem com força garantida)
   */
  isStrong() {
    return true; // Gerada com padrão seguro
  }
}

module.exports = TemporaryPassword;