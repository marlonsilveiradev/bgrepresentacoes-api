/**
 * MODEL DE SALES_REPORT
 * 
 * Armazena dados das vendas para relatórios
 */

module.exports = (sequelize, DataTypes) => {
    const SalesReport = sequelize.define('SalesReport', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },

        client_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true
        },

        // ════════════════════════════════════════════════════════
        // DATA DA VENDA
        // ════════════════════════════════════════════════════════

        sale_date: {
            type: DataTypes.DATE,
            allowNull: false
        },

        sale_day: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        sale_month: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        sale_year: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        // ════════════════════════════════════════════════════════
        // SNAPSHOT DO PLANO
        // ════════════════════════════════════════════════════════

        plan_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        plan_code: {
            type: DataTypes.STRING(50),
            allowNull: false
        },

        plan_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        // ════════════════════════════════════════════════════════
        // VALORES
        // ════════════════════════════════════════════════════════

        total_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        // ════════════════════════════════════════════════════════
        // VENDEDOR
        // ════════════════════════════════════════════════════════

        sold_by: {
            type: DataTypes.UUID,
            allowNull: false
        },

        sold_by_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        sold_by_role: {
            type: DataTypes.ENUM('user', 'admin'),
            allowNull: false
        },

        // ════════════════════════════════════════════════════════
        // PARCEIRO
        // ════════════════════════════════════════════════════════

        partner_id: {
            type: DataTypes.UUID,
            allowNull: true
        },

        partner_name: {
            type: DataTypes.STRING(255),
            allowNull: true
        }

    }, {
        tableName: 'sales_reports',
        timestamps: true,
        underscored: true
    });

    // ════════════════════════════════════════════════════════
    // ASSOCIAÇÕES
    // ════════════════════════════════════════════════════════

    SalesReport.associate = function (models) {
        SalesReport.belongsTo(models.Client, {
            foreignKey: 'client_id',
            as: 'client'
        });

        SalesReport.belongsTo(models.User, {
            foreignKey: 'sold_by',
            as: 'seller'
        });

        SalesReport.belongsTo(models.User, {
            foreignKey: 'partner_id',
            as: 'partner'
        });
    };

    return SalesReport;
};