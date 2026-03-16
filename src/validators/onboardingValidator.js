const yup = require('yup');

const onboardingSchema = yup.object().shape({
  // Cliente
  corporate_name: yup.string().required('Razão social obrigatória'),
  trade_name: yup.string().nullable(),
  cnpj: yup.string().required('CNPJ obrigatório').matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/, 'CNPJ inválido'),
  state_registration: yup.string().nullable(),
  email: yup.string().email('E-mail inválido').required('E-mail obrigatório'),
  phone: yup.string().required('Telefone obrigatório'),
  benefit_type: yup.string().oneOf(['food', 'meal', 'both']).required(),

  // Endereço
  address_street: yup.string().required('Rua obrigatória'),
  address_city: yup.string().required('Cidade obrigatória'),
  address_state: yup.string().length(2).required('UF obrigatória'),
  address_zip: yup.string().required('CEP obrigatório'),

  // Banco
  bank_name: yup.string().required('Nome do banco obrigatório'),
  agency: yup.string().required('Agência obrigatória'),
  account: yup.string().required('Conta obrigatória'),

  // Venda
  plan_id: yup.string().uuid().required('Plano obrigatório'),
  partner_id: yup.string().uuid().required('Parceiro obrigatório'),
  flag_ids: yup.array().of(yup.string().uuid()).optional(),
  notes: yup.string().nullable(),
});

module.exports = { onboardingSchema };