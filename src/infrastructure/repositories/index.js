/**
 * Repositories - Índice centralizado
 */

const FlagRepository = require('./FlagRepository');
const UserRepository = require('./UserRepository');
const RefreshTokenRepository = require('./RefreshTokenRepository');

module.exports = {
  FlagRepository,
  UserRepository,
  RefreshTokenRepository,
};