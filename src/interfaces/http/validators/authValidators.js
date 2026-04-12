const yup = require('yup');

/**
 * Regex de senha forte:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial
 */
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/;

const STRONG_PASSWORD_MESSAGE =
  'A senha deve ter no mínimo 8 caracteres, contendo letra maiúscula, minúscula, número e caractere especial.';

// ─── Login ────────────────────────────────────────────────────────────────────
const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Informe um e-mail válido.')
    .required('E-mail é obrigatório.')
    .transform((value) => (value ? value.toLowerCase() : value)),
  password: yup
    .string()
    .required('Senha é obrigatória.')
    .trim(),
}).noUnknown(true).strict();

// ─── Troca de Senha ───────────────────────────────────────────────────────────
const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Senha atual é obrigatória.')
    .trim(),
  newPassword: yup
    .string()
    .required('Nova senha é obrigatória.')
    .min(8, STRONG_PASSWORD_MESSAGE)
    .matches(STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE)
    .trim(),
  confirmPassword: yup
    .string()
    .required('Confirmação de senha é obrigatória.')
    .oneOf([yup.ref('newPassword')], 'As senhas não coincidem.')
    .trim(),
}).noUnknown(true).strict();

  const refreshSchema = yup.object({
  refreshToken: yup
    .string()
    .required('Refresh token é obrigatório.'),
}).noUnknown(true).strict();

module.exports = { loginSchema, changePasswordSchema, refreshSchema, STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE };
