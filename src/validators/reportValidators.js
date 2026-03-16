const yup = require('yup');

const currentYear = new Date().getFullYear();

const reportQuerySchema = yup.object({
  // Filtros de período — podem ser combinados:
  //   year                      → ano inteiro
  //   year + month              → mês específico
  //   year + month + day        → dia específico
  //   date_start + date_end     → intervalo livre (sobrescreve year/month/day)
  year: yup
    .number()
    .integer()
    .min(2020, 'Ano deve ser 2020 ou posterior.')
    .max(currentYear + 1)
    .optional(),

  month: yup
    .number()
    .integer()
    .min(1, 'Mês deve ser entre 1 e 12.')
    .max(12, 'Mês deve ser entre 1 e 12.')
    .optional(),

  day: yup
    .number()
    .integer()
    .min(1, 'Dia deve ser entre 1 e 31.')
    .max(31, 'Dia deve ser entre 1 e 31.')
    .optional(),

  date_start: yup
    .date()
    .typeError('date_start deve ser uma data válida (YYYY-MM-DD).')
    .optional(),

  date_end: yup
    .date()
    .typeError('date_end deve ser uma data válida (YYYY-MM-DD).')
    .min(yup.ref('date_start'), 'date_end deve ser igual ou posterior a date_start.')
    .optional(),

  partner_id: yup
    .string()
    .uuid('partner_id deve ser um UUID válido.')
    .optional(),

  overall_status: yup
    .string()
    .oneOf(['pending', 'analysis', 'approved'], 'Status inválido.')
    .optional(),

  page:  yup.number().integer().min(1).default(1).optional(),
  limit: yup.number().integer().min(1).max(100).default(20).optional(),
})
.test(
  'date-range-or-period',
  'Se usar date_start/date_end, não combine com year/month/day.',
  function (value) {
    const hasRange  = value.date_start || value.date_end;
    const hasPeriod = value.year || value.month || value.day;
    if (hasRange && hasPeriod) {
      return this.createError({
        message: 'Use date_start/date_end OU year/month/day — não ambos simultaneamente.',
      });
    }
    return true;
  }
);

module.exports = { reportQuerySchema };