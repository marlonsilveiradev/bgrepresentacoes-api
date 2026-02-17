/**
 * CONTROLLER DE RELATÓRIOS
 */

const {
    getDailyReport,
    getMonthlyReport,
    getYearlyReport,
    getPartnerReport
} = require('../services/salesReportService');

/**
 * RELATÓRIO DIÁRIO
 * GET /api/reports/daily?date=2024-02-11
 */
async function dailyReport(req, res) {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                error: 'Data é obrigatória (formato: YYYY-MM-DD)'
            });
        }

        const report = await getDailyReport(date);

        return res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Erro ao gerar relatório diário:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao gerar relatório'
        });
    }
}

/**
 * RELATÓRIO MENSAL
 * GET /api/reports/monthly?month=2&year=2024
 */
async function monthlyReport(req, res) {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                error: 'Mês e ano são obrigatórios'
            });
        }

        const report = await getMonthlyReport(parseInt(month), parseInt(year));

        return res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Erro ao gerar relatório mensal:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao gerar relatório'
        });
    }
}

/**
 * RELATÓRIO ANUAL
 * GET /api/reports/yearly?year=2024
 */
async function yearlyReport(req, res) {
    try {
        const { year } = req.query;

        if (!year) {
            return res.status(400).json({
                success: false,
                error: 'Ano é obrigatório'
            });
        }

        const report = await getYearlyReport(parseInt(year));

        return res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Erro ao gerar relatório anual:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao gerar relatório'
        });
    }
}

/**
 * RELATÓRIO POR PARCEIRO
 * GET /api/reports/partner/:partnerId?start_date=2024-01-01&end_date=2024-12-31
 */
async function partnerReport(req, res) {
    try {
        const { partnerId } = req.params;
        const { start_date, end_date } = req.query;

        const report = await getPartnerReport(partnerId, start_date, end_date);

        return res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Erro ao gerar relatório de parceiro:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao gerar relatório'
        });
    }
}

module.exports = {
    dailyReport,
    monthlyReport,
    yearlyReport,
    partnerReport
};