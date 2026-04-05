/**
 * Flag Use Cases - Índice centralizado
 * Importar daqui em vez de caminhos relativos
 */

const ListFlagsUseCase = require('./ListFlagsUseCase');
const GetFlagByIdUseCase = require('./GetFlagByIdUseCase');
const CreateFlagUseCase = require('./CreateFlagUseCase');
const UpdateFlagUseCase = require('./UpdateFlagUseCase');
const DeactivateFlagUseCase = require('./DeactivateFlagUseCase');
const ReactivateFlagUseCase = require('./ReactivateFlagUseCase');

module.exports = {
  ListFlagsUseCase,
  GetFlagByIdUseCase,
  CreateFlagUseCase,
  UpdateFlagUseCase,
  DeactivateFlagUseCase,
  ReactivateFlagUseCase,
};