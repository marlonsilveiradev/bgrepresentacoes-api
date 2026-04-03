const yup = require('yup');
const { cnpj } = require('cpf-cnpj-validator');

const onboardingSchema = yup.object().shape({

  // ─── CLIENTE ─────────────────────────────────────────────
  corporate_name: yup
    .string()
    .transform(v => v?.trim())
    .max(255)
    .required('Razão social obrigatória'),

  trade_name: yup
    .string()
    .max(255)
    .nullable(),

  responsible_name: yup
    .string()
    .max(255)
    .required('Nome do responsável obrigatório'),

  cnpj: yup
    .string()
    .required('CNPJ obrigatório')
    .transform((value) => value?.replace(/\D/g, '')) // remove máscara
    .test('is-valid-cnpj', 'CNPJ inválido', (value) => {
      if (!value) return false;
      return cnpj.isValid(value);
    }),

  state_registration: yup
    .string()
    .max(15)
    .nullable(),

  phone: yup
    .string()
    .max(20)
    .required('Telefone obrigatório'),

  email: yup
    .string()
    .transform(v => v?.toLowerCase().trim())
    .email('E-mail inválido')
    .max(255)
    .required('E-mail obrigatório'),

  benefit_type: yup
    .string()
    .oneOf(['food', 'meal', 'both'])
    .required('Tipo de benefício obrigatório'),

  notes: yup
    .string()
    .nullable(),

  // ─── MACHINE ─────────────────────────────────────────────
  machine_id: yup
    .string()
    .uuid('Machine_id deve ser um UUID válido')
    .nullable(),

  machine_affiliation_code: yup
    .string()
    .max(100)
    .nullable(),

  // ─── ENDEREÇO ────────────────────────────────────────────
  address_street: yup
    .string()
    .max(255)
    .required('Rua obrigatória'),

  address_number: yup
    .string()
    .max(10)
    .required('Número obrigatório'),

  address_complement: yup
    .string()
    .max(100)
    .nullable(),

  address_neighborhood: yup
    .string()
    .max(100)
    .nullable(),

  address_city: yup
    .string()
    .max(100)
    .required('Cidade obrigatória'),

  address_state: yup
    .string()
    .length(2, 'UF deve ter 2 caracteres')
    .required('UF obrigatória'),

  address_zip: yup
    .string()
    .transform(v => v?.replace(/\D/g, ''))
    .max(9)
    .required('CEP obrigatório'),

  // ─── BANCO ───────────────────────────────────────────────
  bank_name: yup
    .string()
    .max(100)
    .required('Nome do banco obrigatório'),

  agency: yup
    .string()
    .max(10)
    .required('Agência obrigatória'),

  agency_digit: yup
    .string()
    .max(2)
    .nullable(),

  account: yup
    .string()
    .max(20)
    .required('Conta obrigatória'),

  account_digit: yup
    .string()
    .max(2)
    .nullable(),

  account_type: yup
    .string()
    .oneOf(['checking', 'savings'])
    .required('Tipo de conta obrigatório'),

  // ─── VENDA ───────────────────────────────────────────────
  plan_id: yup
    .string()
    .uuid('Plano inválido')
    .nullable(),

  flag_ids: yup
    .array()
    .of(yup.string().uuid('Flag inválida'))
    .nullable(),

  partner_id: yup
    .string()
    .uuid('Parceiro inválido')
    .required('Parceiro obrigatório'),

})
.test(
  'plan-or-flags',
  'Informe um plano ou ao menos uma bandeira',
  (value) => {
    return (
      value.plan_id ||
      (Array.isArray(value.flag_ids) && value.flag_ids.length > 0)
    );
  }
);

module.exports = { onboardingSchema };