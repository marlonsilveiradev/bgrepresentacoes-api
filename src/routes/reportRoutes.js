const { Router } = require('express');
const ReportController = require('../controllers/ReportController');
const { authMiddleware, authorize } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { reportQuerySchema } = require('../validators/reportValidators');

const router = Router();

// Autenticação + admin obrigatórios em todas as rotas
router.use(authMiddleware, authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Relatórios gerenciais (somente Admin)
 */

/**
 * @swagger
 * /reports/sales:
 *   get:
 *     summary: Relatório de vendas por cliente
 *     description: |
 *       Retorna um relatório paginado onde cada linha representa um **cliente**
 *       com o consolidado das suas vendas no período informado.
 *
 *       **Filtros de período (use um dos dois grupos):**
 *       - `year` / `year + month` / `year + month + day` — período pré-definido
 *       - `date_start` + `date_end` — intervalo livre
 *
 *       **Summary:** valores consolidados de **todos** os registros do filtro,
 *       independente da página atual.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2026 }
 *         description: Filtra pelo ano (ex. 2026 = todo o ano)
 *       - in: query
 *         name: month
 *         schema: { type: integer, minimum: 1, maximum: 12, example: 3 }
 *         description: Combina com year para filtrar por mês
 *       - in: query
 *         name: day
 *         schema: { type: integer, minimum: 1, maximum: 31, example: 15 }
 *         description: Combina com year + month para filtrar por dia
 *       - in: query
 *         name: date_start
 *         schema: { type: string, format: date, example: "2026-01-01" }
 *         description: Início do intervalo livre (não combine com year/month/day)
 *       - in: query
 *         name: date_end
 *         schema: { type: string, format: date, example: "2026-03-31" }
 *         description: Fim do intervalo livre
 *       - in: query
 *         name: partner_id
 *         schema: { type: string, format: uuid }
 *         description: Filtra por parceiro vinculado ao cliente
 *       - in: query
 *         name: overall_status
 *         schema: { type: string, enum: [pending, analysis, approved] }
 *         description: Filtra pelo status geral do cliente
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: |
 *           Relatório gerado com sucesso.
 *           ```json
 *           {
 *             "meta": {
 *               "generated_at": "2026-03-15T12:00:00.000Z",
 *               "filters_applied": { "period_start": "...", "period_end": "..." },
 *               "period_label": "Março de 2026"
 *             },
 *             "rows": [
 *               {
 *                 "client_id": "uuid",
 *                 "corporate_name": "Empresa Ltda",
 *                 "overall_status": "approved",
 *                 "registered_at": "2026-03-01T...",
 *                 "partner": { "id": "uuid", "name": "João Parceiro" },
 *                 "sales_count": 2,
 *                 "total_value": 750.00,
 *                 "average_ticket": 375.00,
 *                 "latest_plan": "Plano Completo",
 *                 "sales": [ { "sale_id": "...", "plan_name": "...", ... } ]
 *               }
 *             ],
 *             "pagination": { "total": 45, "totalPages": 3, "currentPage": 1, "perPage": 20 },
 *             "summary": {
 *               "total_clients": 45,
 *               "total_sales": 67,
 *               "total_value": 28450.00,
 *               "average_ticket": 424.63
 *             }
 *           }
 *           ```
 *       403:
 *         description: Acesso negado — requer admin
 *       422:
 *         description: Parâmetros de filtro inválidos
 */
router.get(
  '/sales',
  validate(reportQuerySchema, 'query'),
  ReportController.salesReport
);

module.exports = router;