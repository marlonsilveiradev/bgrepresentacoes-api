/**
 * MODEL DE BANDEIRA
 * 
 * Define as bandeiras de cartão disponíveis
 */

module.exports = (sequelize, DataTypes) => {
    const Flag = sequelize.define('Flag', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },

        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: { msg: 'Já existe uma bandeira com este nome' },
            validate: {
                notEmpty: { msg: 'Nome não pode estar vazio' }
            }
        },

        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: { msg: 'Já existe uma bandeira com este código' },
            validate: {
                notEmpty: { msg: 'Código não pode estar vazio' }
            }
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        // Preço individual (editável pelo admin)
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
        tableName: 'flags',
        timestamps: true,
        underscored: true
    });

    // ════════════════════════════════════════════════════════
    // ASSOCIAÇÕES
    // ════════════════════════════════════════════════════════

    Flag.associate = function (models) {
        // Relação N:N com Clients através de ClientFlag
        Flag.belongsToMany(models.Client, {
            through: models.ClientFlag,
            foreignKey: 'flag_id',
            as: 'clients'
        });

        // Acesso direto aos registros da tabela intermediária
        Flag.hasMany(models.ClientFlag, {
            foreignKey: 'flag_id',
            as: 'client_flags'
        });
    };

    return Flag;
};