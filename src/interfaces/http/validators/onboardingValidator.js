const yup = require('yup');
const { cnpj } = require('cpf-cnpj-validator');
const {
  VALID_STATES,
  isValidBrazilianState,
} = require('./brazilianStates');

const logger = require('../../config/logger');

/**
 * ✅ VALIDATOR: Onboarding Schema
 * 
 * Responsabilidade: Validar dados de onboarding do cliente
 * 
 * IMPLEMENTAÇÕES:
 * A. Transform de arrays robusto (flag_ids)
 * B. Validação de UF contra lista de estados brasileiros
 * C. Método nativo .uuid() do Yup (em vez de regex)
 * D. Tratamento seguro de null/undefined em transformations
 * E. Custom messages em português
 * F. Transformações de dados (trim, lowercase, etc)
 * G. Regra de negócio: cliente deve ter plano OU bandeiras
 */

const onboardingSchema = yup.object().shape({
  // ─── CLIENTE ─────────────────────────────────────────────

  corporate_name: yup
    .string()
    .transform(v => v?.trim())
    .max(255, 'Razão social não deve ultrapassar 255 caracteres')
    .required('Razão social obrigatória'),

  trade_name: yup
    .string()
    .transform(v => v?.trim())
    .max(255, 'Nome fantasia não deve ultrapassar 255 caracteres')
    .nullable(),

  responsible_name: yup
    .string()
    .transform(v => v?.trim())
    .max(255, 'Nome do responsável não deve ultrapassar 255 caracteres')
    .required('Nome do responsável obrigatório'),

  cnpj: yup
    .string()
    .required('CNPJ obrigatório')
    .transform((value) => {
      if (!value) return '';
      // Remove máscara e não-dígitos
      return String(value).replace(/\D/g, '');
    })
    .test('is-valid-cnpj', 'CNPJ inválido', (value) => {
      if (!value || value.length === 0) return false;
      return cnpj.isValid(value);
    }),

  state_registration: yup
    .string()
    .transform(v => v?.trim())
    .max(15, 'Inscrição estadual não deve ultrapassar 15 caracteres')
    .nullable(),

  phone: yup
    .string()
    .transform(v => v?.trim())
    .max(20, 'Telefone não deve ultrapassar 20 caracteres')
    .test(
      'is-valid-phone',
      'Telefone deve conter pelo menos 10 dígitos',
      (value) => {
        if (!value) return false;
        const digits = value.replace(/\D/g, '');
        return digits.length >= 10;
      }
    )
    .required('Telefone obrigatório'),

  email: yup
    .string()
    .transform(v => v?.toLowerCase().trim())
    .email('E-mail inválido')
    .max(255, 'E-mail não deve ultrapassar 255 caracteres')
    .required('E-mail obrigatório'),

  benefit_type: yup
    .string()
    .oneOf(
      ['food', 'meal', 'both'],
      'Tipo de benefício deve ser: food, meal ou both'
    )
    .required('Tipo de benefício obrigatório'),

  notes: yup
    .string()
    .transform(v => v?.trim())
    .nullable(),

  // ─── MÁQUINA ─────────────────────────────────────────────

  machine_name: yup
    .string()
    .transform(v => v?.trim())
    .max(255, 'Nome da máquina não deve ultrapassar 255 caracteres')
    .nullable(),

  machine_affiliation_code: yup
    .string()
    .transform(v => v?.trim())
    .max(100, 'Código de filiação não deve ultrapassar 100 caracteres')
    .nullable(),

  // ─── ENDEREÇO ────────────────────────────────────────────

  address_street: yup
    .string()
    .transform(v => v?.trim())
    .max(255, 'Rua não deve ultrapassar 255 caracteres')
    .required('Rua obrigatória'),

  address_number: yup
    .string()
    .transform(v => v?.trim())
    .max(10, 'Número não deve ultrapassar 10 caracteres')
    .required('Número obrigatório'),

  address_complement: yup
    .string()
    .transform(v => v?.trim())
    .max(100, 'Complemento não deve ultrapassar 100 caracteres')
    .nullable(),

  address_neighborhood: yup
    .string()
    .transform(v => v?.trim())
    .max(100, 'Bairro não deve ultrapassar 100 caracteres')
    .nullable(),

  address_city: yup
    .string()
    .transform(v => v?.trim())
    .max(100, 'Cidade não deve ultrapassar 100 caracteres')
    .required('Cidade obrigatória'),

  // ✅ MELHORIA B: Validação robusta de UF com lista de estados
  address_state: yup
    .string()
    .transform(v => v?.trim().toUpperCase())
    .required('UF obrigatória')
    .test(
      'is-valid-state',
      'UF inválida. Estados válidos: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO',
      (value) => {
        if (!value) return false;
        return isValidBrazilianState(value);
      }
    ),

  // ✅ CORREÇÃO 1: Transform seguro de CEP com null/undefined
  address_zip: yup
    .string()
    .required('CEP obrigatório')
    .transform((value) => {
      // ✅ Garantir que null/undefined vire string vazia, não "null"/"undefined"
      if (!value) return '';
      
      // ✅ Garantir que é string antes de fazer replace
      const stringValue = typeof value === 'string' ? value : String(value);
      
      // ✅ Remove apenas não-dígitos
      return stringValue.replace(/\D/g, '');
    })
    .test(
      'is-valid-zip',
      'CEP deve ter exatamente 8 dígitos',
      (value) => {
        if (!value) return false;
        // Depois do transform, deve ter 8 dígitos
        return value.length === 8 && /^\d{8}$/.test(value);
      }
    ),

  // ─── BANCO ───────────────────────────────────────────────

  bank_name: yup
    .string()
    .transform(v => v?.trim())
    .max(100, 'Nome do banco não deve ultrapassar 100 caracteres')
    .required('Nome do banco obrigatório'),

  agency: yup
    .string()
    .transform(v => v?.trim())
    .max(10, 'Agência não deve ultrapassar 10 caracteres')
    .test(
      'is-valid-agency',
      'Agência deve conter apenas números',
      (value) => {
        if (!value) return false;
        return /^\d+$/.test(value);
      }
    )
    .required('Agência obrigatória'),

  agency_digit: yup
    .string()
    .transform(v => v?.trim())
    .max(2, 'Dígito da agência não deve ultrapassar 2 caracteres')
    .nullable(),

  account: yup
    .string()
    .transform(v => v?.trim())
    .max(20, 'Conta não deve ultrapassar 20 caracteres')
    .test(
      'is-valid-account',
      'Conta deve conter apenas números',
      (value) => {
        if (!value) return false;
        return /^\d+$/.test(value);
      }
    )
    .required('Conta obrigatória'),

  account_digit: yup
    .string()
    .transform(v => v?.trim())
    .max(2, 'Dígito da conta não deve ultrapassar 2 caracteres')
    .nullable(),

  account_type: yup
    .string()
    .oneOf(
      ['checking', 'savings'],
      'Tipo de conta deve ser: checking ou savings'
    )
    .required('Tipo de conta obrigatório'),

  // ─── VENDA ───────────────────────────────────────────────

  // ✅ CORREÇÃO 2: Usar .uuid() nativo do Yup em vez de regex
  plan_id: yup
    .string()
    .transform(v => {
      if (!v) return null;
      return String(v).trim();
    })
    .uuid('Plano inválido - deve ser um UUID válido')  // ✅ Método nativo
    .nullable(),

  // ✅ MELHORIA A: Transform de arrays robusto
  flag_ids: yup
    .array()
    .of(
      yup
        .string()
        .uuid('Flag inválida - deve ser um UUID válido')  // ✅ Método nativo
    )
    .nullable()
    .transform((value) => {
      // ✅ PASSO 1: Validar que é array ou null
      if (!value) return null;
      if (!Array.isArray(value)) return null;

      // ✅ PASSO 2: Limpar e filtrar com segurança
      const cleaned = value
        .map(id => {
          // Se não é string, ignora
          if (typeof id !== 'string') return null;
          const trimmed = id.trim();
          // Retorna apenas se tiver conteúdo
          return trimmed.length > 0 ? trimmed : null;
        })
        .filter(id => id !== null);

      // ✅ PASSO 3: Retornar array não-vazio ou null
      return cleaned.length > 0 ? cleaned : null;
    }),

  partner_id: yup
    .string()
    .transform(v => {
      if (!v) return null;
      return String(v).trim();
    })
    .uuid('Parceiro inválido - deve ser um UUID válido')  // ✅ Método nativo
    .nullable(),
})

  // ✅ REGRA DE NEGÓCIO: Cliente deve ter plano OU bandeiras
  .test(
    'plan-or-flags',
    'Informe um plano ou ao menos uma bandeira',
    function(value) {
      const hasPlan =
        !!value.plan_id && String(value.plan_id).trim().length > 0;
      const hasFlags =
        Array.isArray(value.flag_ids) && value.flag_ids.length > 0;

      if (!hasPlan && !hasFlags) {
        return this.createError({
          path: 'flag_ids',
          message: 'Informe um plano ou ao menos uma bandeira',
        });
      }

      logger.debug(
        { hasPlan, flagCount: value.flag_ids?.length || 0 },
        '[onboardingSchema] Validação de plano/flags passou'
      );

      return true;
    }
  );

module.exports = { onboardingSchema };