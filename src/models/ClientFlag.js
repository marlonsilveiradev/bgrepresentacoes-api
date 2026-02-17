/**
 * MODEL DE CLIENT_FLAG
 * 
 * Tabela intermediária que relaciona Clientes e Bandeiras.
 * IMPORTANTE: Cada bandeira tem seu próprio status individual!
 */

module.exports = (sequelize, DataTypes) => {
    const ClientFlag = sequelize.define('ClientFlag', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },

        client_id: {
            type: DataTypes.UUID,
            allowNull: false
        },

        flag_id: {
            type: DataTypes.UUID,
            allowNull: false
        },

        // ════════════════════════════════════════════════════════
        // SNAPSHOT (dados no momento da contratação)
        // ════════════════════════════════════════════════════════

        flag_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        flag_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },

        // ════════════════════════════════════════════════════════
        // STATUS INDIVIDUAL DA BANDEIRA
        // ════════════════════════════════════════════════════════

        status: {
            type: DataTypes.ENUM('pending', 'in_analysis', 'approved'),
            defaultValue: 'pending',
            allowNull: false,
            validate: {
                isIn: {
                    args: [['pending', 'in_analysis', 'approved']],
                    msg: 'Status inválido'
                }
            }
        },

        // ════════════════════════════════════════════════════════
        // AUDITORIA
        // ════════════════════════════════════════════════════════

        status_updated_at: {
            type: DataTypes.DATE,
            allowNull: true
        },

        status_updated_by: {
            type: DataTypes.UUID,
            allowNull: true
        }

    }, {
        tableName: 'client_flags',
        timestamps: true,
        underscored: true,

        // ════════════════════════════════════════════════════════
        // HOOKS
        // ════════════════════════════════════════════════════════
        hooks: {
            /**
             * DEPOIS DE ATUALIZAR STATUS - Recalcula status do cliente
             */
            afterUpdate: async (clientFlag) => {
                if (clientFlag.changed('status')) {
                    const Client = sequelize.models.Client;
                    const client = await Client.findByPk(clientFlag.client_id);

                    if (client) {
                        await client.updateOverallStatus();
                    }
                }
            }
        }
    });

    // ════════════════════════════════════════════════════════
    // ASSOCIAÇÕES
    // ════════════════════════════════════════════════════════

    ClientFlag.associate = function (models) {
        ClientFlag.belongsTo(models.Client, {
            foreignKey: 'client_id',
            as: 'client'
        });

        ClientFlag.belongsTo(models.Flag, {
            foreignKey: 'flag_id',
            as: 'flag'
        });

        ClientFlag.belongsTo(models.User, {
            foreignKey: 'status_updated_by',
            as: 'updater'
        });
    };

    return ClientFlag;
};