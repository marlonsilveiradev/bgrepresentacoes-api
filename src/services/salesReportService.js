/**
 * SERVIÇO DE RELATÓRIOS DE VENDAS
 */

const { SalesReport, User, Plan, ClientFlag } = require('../models');
const { Op } = require('sequelize');

/**
 * Cria relatório de venda para um cliente
 */
async function createSalesReport(client, user) {
    try {
        const plan = await Plan.findByPk(client.plan_id);

        const saleDate = new Date();

        const reportData = {
            client_id: client.id,
            sale_date: saleDate,
            sale_day: saleDate.getDate(),
            sale_month: saleDate.getMonth() + 1,
            sale_year: saleDate.getFullYear(),
            plan_name: plan.name,
            plan_code: plan.code,
            plan_price: plan.price,
            total_value: client.total_value,
            sold_by: user.id,
            sold_by_name: user.name,
            sold_by_role: user.role,
            partner_id: client.partner_id || null,
            partner_name: client.partner_id ? (await User.findByPk(client.partner_id)).name : null
        };

        const report = await SalesReport.create(reportData);
        return report;
    } catch (error) {
        console.error('Erro ao criar relatório de venda:', error);
        throw error;
    }
}

/**
 * Relatório por dia
 */
async function getDailyReport(date) {
    try {
        const targetDate = new Date(date);
        const day = targetDate.getDate();
        const month = targetDate.getMonth() + 1;
        const year = targetDate.getFullYear();

        const sales = await SalesReport.findAll({
            where: {
                sale_day: day,
                sale_month: month,
                sale_year: year
            },
            include: [
                { model: User, as: 'seller', attributes: ['id', 'name', 'role'] },
                { model: User, as: 'partner', attributes: ['id', 'name'] }
            ]
        });

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_value), 0);

        // Agrupar por vendedor
        const bySeller = sales.reduce((acc, sale) => {
            const sellerId = sale.sold_by;
            if (!acc[sellerId]) {
                acc[sellerId] = {
                    seller_name: sale.sold_by_name,
                    sales: 0,
                    revenue: 0
                };
            }
            acc[sellerId].sales++;
            acc[sellerId].revenue += parseFloat(sale.total_value);
            return acc;
        }, {});

        return {
            date: targetDate.toISOString().split('T')[0],
            total_sales: totalSales,
            total_revenue: totalRevenue.toFixed(2),
            by_seller: Object.values(bySeller)
        };
    } catch (error) {
        console.error('Erro ao gerar relatório diário:', error);
        throw error;
    }
}

/**
 * Relatório mensal
 */
async function getMonthlyReport(month, year) {
    try {
        const sales = await SalesReport.findAll({
            where: {
                sale_month: month,
                sale_year: year
            },
            include: [
                { model: User, as: 'seller', attributes: ['id', 'name', 'role'] },
                { model: User, as: 'partner', attributes: ['id', 'name'] }
            ]
        });

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_value), 0);

        // Agrupar por vendedor
        const bySeller = sales.reduce((acc, sale) => {
            const sellerId = sale.sold_by;
            if (!acc[sellerId]) {
                acc[sellerId] = {
                    seller_name: sale.sold_by_name,
                    sales: 0,
                    revenue: 0
                };
            }
            acc[sellerId].sales++;
            acc[sellerId].revenue += parseFloat(sale.total_value);
            return acc;
        }, {});

        // Agrupar por plano
        const byPlan = sales.reduce((acc, sale) => {
            const planCode = sale.plan_code;
            if (!acc[planCode]) {
                acc[planCode] = {
                    plan_name: sale.plan_name,
                    quantity: 0,
                    revenue: 0
                };
            }
            acc[planCode].quantity++;
            acc[planCode].revenue += parseFloat(sale.total_value);
            return acc;
        }, {});

        // Agrupar por parceiro
        const byPartner = sales
            .filter(sale => sale.partner_id)
            .reduce((acc, sale) => {
                const partnerId = sale.partner_id;
                if (!acc[partnerId]) {
                    acc[partnerId] = {
                        partner_name: sale.partner_name,
                        sales: 0,
                        revenue: 0
                    };
                }
                acc[partnerId].sales++;
                acc[partnerId].revenue += parseFloat(sale.total_value);
                return acc;
            }, {});

        return {
            period: {
                month,
                year,
                month_name: new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' })
            },
            total_sales: totalSales,
            total_revenue: totalRevenue.toFixed(2),
            by_seller: Object.values(bySeller),
            by_plan: Object.values(byPlan),
            by_partner: Object.values(byPartner)
        };
    } catch (error) {
        console.error('Erro ao gerar relatório mensal:', error);
        throw error;
    }
}

/**
 * Relatório anual
 */
async function getYearlyReport(year) {
    try {
        const sales = await SalesReport.findAll({
            where: { sale_year: year },
            include: [
                { model: User, as: 'seller', attributes: ['id', 'name'] },
                { model: User, as: 'partner', attributes: ['id', 'name'] }
            ]
        });

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_value), 0);

        // Agrupar por mês
        const byMonth = sales.reduce((acc, sale) => {
            const month = sale.sale_month;
            if (!acc[month]) {
                acc[month] = {
                    month,
                    month_name: new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' }),
                    sales: 0,
                    revenue: 0
                };
            }
            acc[month].sales++;
            acc[month].revenue += parseFloat(sale.total_value);
            return acc;
        }, {});

        return {
            year,
            total_sales: totalSales,
            total_revenue: totalRevenue.toFixed(2),
            by_month: Object.values(byMonth).sort((a, b) => a.month - b.month)
        };
    } catch (error) {
        console.error('Erro ao gerar relatório anual:', error);
        throw error;
    }
}

/**
 * Relatório por parceiro
 */
async function getPartnerReport(partnerId, startDate, endDate) {
    try {
        const whereClause = {
            partner_id: partnerId
        };

        if (startDate && endDate) {
            whereClause.sale_date = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const sales = await SalesReport.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'seller', attributes: ['id', 'name'] }
            ]
        });

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_value), 0);

        return {
            partner_id: partnerId,
            total_sales: totalSales,
            total_revenue: totalRevenue.toFixed(2),
            sales: sales.map(sale => ({
                date: sale.sale_date,
                plan: sale.plan_name,
                value: sale.total_value,
                seller: sale.seller.name
            }))
        };
    } catch (error) {
        console.error('Erro ao gerar relatório de parceiro:', error);
        throw error;
    }
}

module.exports = {
    createSalesReport,
    getDailyReport,
    getMonthlyReport,
    getYearlyReport,
    getPartnerReport
};