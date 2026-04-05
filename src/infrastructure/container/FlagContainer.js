/**
 * CONTAINER: Flag Dependencies
 * 
 * Injeção de dependências centralizada
 * Importar este arquivo em controllers
 */

const { FlagRepository } = require('../repositories');
const {
  ListFlagsUseCase,
  GetFlagByIdUseCase,
  CreateFlagUseCase,
  UpdateFlagUseCase,
  DeactivateFlagUseCase,
  ReactivateFlagUseCase,
} = require('../../application/use-cases/flag');

class FlagContainer {
  constructor() {
    // Repository
    this.flagRepository = new FlagRepository();

    // Use Cases
    this.listFlagsUseCase = new ListFlagsUseCase(this.flagRepository);
    this.getFlagByIdUseCase = new GetFlagByIdUseCase(this.flagRepository);
    this.createFlagUseCase = new CreateFlagUseCase(this.flagRepository);
    this.updateFlagUseCase = new UpdateFlagUseCase(this.flagRepository);
    this.deactivateFlagUseCase = new DeactivateFlagUseCase(this.flagRepository);
    this.reactivateFlagUseCase = new ReactivateFlagUseCase(this.flagRepository);
  }

  getListFlagsUseCase() {
    return this.listFlagsUseCase;
  }

  getGetFlagByIdUseCase() {
    return this.getFlagByIdUseCase;
  }

  getCreateFlagUseCase() {
    return this.createFlagUseCase;
  }

  getUpdateFlagUseCase() {
    return this.updateFlagUseCase;
  }

  getDeactivateFlagUseCase() {
    return this.deactivateFlagUseCase;
  }

  getReactivateFlagUseCase() {
    return this.reactivateFlagUseCase;
  }
}

module.exports = new FlagContainer();