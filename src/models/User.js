/**
 * MODEL DE USUÁRIO
 * 
 * Define a estrutura da tabela 'users' e suas relações.
 * Inclui métodos para autenticação e segurança.
 */

const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },

        // Nome do usuário
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Nome não pode estar vazio' },
                len: {
                    args: [3, 255],
                    msg: 'Nome deve ter entre 3 e 255 caracteres'
                }
            }
        },

        // Email (único)
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: { msg: 'Este email já está cadastrado' },
            validate: {
                notEmpty: { msg: 'Email não pode estar vazio' },
                isEmail: { msg: 'Email inválido' }
            }
        },

        // Senha (será hash bcrypt)
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Senha não pode estar vazia' },
                len: {
                    args: [6, 255],
                    msg: 'Senha deve ter no mínimo 6 caracteres'
                }
            }
        },

        // Tipo: user, admin, partner (padrão: user)
        role: {
            type: DataTypes.ENUM('user', 'admin', 'partner'),
            defaultValue: 'user',
            allowNull: false,
            validate: {
                isIn: {
                    args: [['user', 'admin', 'partner']],
                    msg: 'Role inválido'
                }
            }
        },

        // Se está ativo
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        },

        // Quem criou este usuário
        created_by: {
            type: DataTypes.UUID,
            allowNull: true
        },

        // Último login
        last_login: {
            type: DataTypes.DATE,
            allowNull: true
        }

    }, {
        tableName: 'users',
        timestamps: true,
        underscored: true,

        // ════════════════════════════════════════════════════════
        // HOOKS - Executam automaticamente
        // ════════════════════════════════════════════════════════
        hooks: {
            /**
             * ANTES DE CRIAR - Criptografa a senha
             */
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },

            /**
             * ANTES DE ATUALIZAR - Criptografa senha se foi alterada
             */
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        },

        // Remove senha das queries por padrão
        defaultScope: {
            attributes: { exclude: ['password'] }
        },

        // Scope para incluir senha (quando necessário, ex: login)
        scopes: {
            withPassword: {
                attributes: { include: ['password'] }
            }
        }
    });

    // ════════════════════════════════════════════════════════
    // MÉTODOS DE INSTÂNCIA
    // ════════════════════════════════════════════════════════

    /**
     * Compara senha em texto puro com hash armazenado
     */
    User.prototype.comparePassword = async function (password) {
        return await bcrypt.compare(password, this.password);
    };

    /**
     * Retorna dados seguros (sem senha)
     */
    User.prototype.toSafeObject = function () {
        const { password, ...safeUser } = this.toJSON();
        return safeUser;
    };

    // ════════════════════════════════════════════════════════
    // MÉTODOS ESTÁTICOS
    // ════════════════════════════════════════════════════════

    /**
     * Autentica usuário
     */
    User.authenticate = async function (email, password) {
        try {
            const user = await User.scope('withPassword').findOne({
                where: { email: email.toLowerCase() }
            });

            if (!user || !user.is_active) {
                return null;
            }

            const isValidPassword = await user.comparePassword(password);

            if (!isValidPassword) {
                return null;
            }

            // Atualiza último login
            await user.update({ last_login: new Date() });

            return user;
        } catch (error) {
            console.error('Erro ao autenticar:', error);
            return null;
        }
    };

    // ════════════════════════════════════════════════════════
    // ASSOCIAÇÕES
    // ════════════════════════════════════════════════════════

    User.associate = function (models) {
        // Usuário cria clientes
        User.hasMany(models.Client, {
            foreignKey: 'created_by',
            as: 'clients'
        });

        // Usuário é parceiro de clientes
        User.hasMany(models.Client, {
            foreignKey: 'partner_id',
            as: 'partner_clients'
        });

        // Usuário faz vendas
        User.hasMany(models.SalesReport, {
            foreignKey: 'sold_by',
            as: 'sales'
        });

        // Usuário é parceiro em vendas
        User.hasMany(models.SalesReport, {
            foreignKey: 'partner_id',
            as: 'partner_sales'
        });

        // Auto-relacionamento (quem criou quem)
        User.hasMany(models.User, {
            foreignKey: 'created_by',
            as: 'created_users'
        });

        User.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        });
    };

    return User;
};