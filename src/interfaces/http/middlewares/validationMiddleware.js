const yup = require('yup');
const AppError = require('../../../shared/utils/AppError');

/**
 * Middleware de validação com Yup.
 *
 * Uso:
 *   router.post('/login', validate(loginSchema), AuthController.login)
 *
 * @param {yup.ObjectSchema} schema - Schema Yup para validar
 * @param {'body'|'query'|'params'} source - Origem dos dados (padrão: body)
 */
const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      // abortEarly: false → retorna TODOS os erros, não só o primeiro
      // stripUnknown: true → remove campos não declarados no schema
      const validated = await schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true,
      });

      // Substitui req[source] pelos dados limpos e tipados pelo Yup
      req[source] = validated;

      return next();
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors = err.inner.map((e) => ({
          field: e.path,
          message: e.message,
        }));

        return next(
          new AppError('Dados inválidos.', 422, true, errors)
        );
      }

      return next(err);
    }
  };
};

module.exports = { validate };
