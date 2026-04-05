/**
 * DTO: Resposta HTTP para Flag
 * Controla quais campos retornar ao cliente
 */

class FlagResponseDTO {
  constructor(flag) {
    this.id = flag.id;
    this.name = flag.name;
    this.description = flag.description;
    this.price = parseFloat(flag.price).toFixed(2); // Formatar com 2 casas decimais
    this.is_active = flag.is_active;
    this.created_at = flag.created_at ? flag.created_at.toISOString() : null;
    this.updated_at = flag.updated_at ? flag.updated_at.toISOString() : null;
  }

  /**
   * Lista de flags
   */
  static toList(flags) {
    return flags.map(flag => new FlagResponseDTO(flag));
  }
}

module.exports = FlagResponseDTO;