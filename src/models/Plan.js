/**
 * MODEL DE PLANO
 * 
 * Define os planos disponíveis (Individual, Combo 5, Combo 7)
 */

module.exports = (sequelize, DataTypes) => {
    const Plan = sequelize.define('Plan', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },

        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: { msg: 'Já existe um plano com este nome' },
            validate: {
                notEmpty: { msg: 'Nome não pode estar vazio' }
            }
        },

        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: { msg: 'Já existe um plano com este código' },
            validate: {
                notEmpty: { msg: 'Código não pode estar vazio' }
            }
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        // Quantidade de bandeiras incluídas
        flag_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: { args: [0], msg: 'Quantidade não pode ser negativa' }
            }
        },

        // Preço do plano (editável pelo admin)
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: { args: [0], msg: 'Preço não pode ser negativo' }
            }
        },

        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        }

    }, {
        tableName: 'plans',
        timestamps: true,
        underscored: true
    });

    // ════════════════════════════════════════════════════════
    // ASSOCIAÇÕES
    // ════════════════════════════════════════════════════════

    Plan.associate = function (models) {
        // Plano tem muitos clientes
        Plan.hasMany(models.Client, {
            foreignKey: 'plan_id',
            as: 'clients'
        });
    };

    return Plan;
};