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
    .required('E-mail é obrigatório.')
    .email('Informe um e-mail válido.')
    .lowercase()
    .trim(),
  password: yup
    .string()
    .required('Senha é obrigatória.'),
});

// ─── Troca de Senha ───────────────────────────────────────────────────────────
const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Senha atual é obrigatória.'),
  newPassword: yup
    .string()
    .required('Nova senha é obrigatória.')
    .min(8, STRONG_PASSWORD_MESSAGE)
    .matches(STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE),
  confirmPassword: yup
    .string()
    .required('Confirmação de senha é obrigatória.')
    .oneOf([yup.ref('newPassword')], 'As senhas não coincidem.'),
});

  const refreshSchema = yup.object({
  refreshToken: yup
    .string()
    .required('Refresh token é obrigatório.'),
});

module.exports = { loginSchema, changePasswordSchema, refreshSchema, STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE };
