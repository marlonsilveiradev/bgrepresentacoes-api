/**
 * MODEL DE CLIENTE
 * 
 * Define os dados dos clientes e suas relações
 */

module.exports = (sequelize, DataTypes) => {
    const Client = sequelize.define('Client', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },

        // ════════════════════════════════════════════════════════
        // DADOS BÁSICOS
        // ════════════════════════════════════════════════════════

        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Nome não pode estar vazio' }
            }
        },

        razao_social: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Razão social não pode estar vazia' }
            }
        },

        ramo_atividade: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        tipo_cartao: {
            type: DataTypes.ENUM('alimentacao', 'refeicao', 'ambos'),
            allowNull: false,
            validate: {
                isIn: {
                    args: [['alimentacao', 'refeicao', 'ambos']],
                    msg: 'Tipo de cartão inválido'
                }
            }
        },

        // ════════════════════════════════════════════════════════
        // ENDEREÇO
        // ════════════════════════════════════════════════════════

        rua: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: { notEmpty: { msg: 'Rua não pode estar vazia' } }
        },

        numero: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: { notEmpty: { msg: 'Número não pode estar vazio' } }
        },

        complemento: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        bairro: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { notEmpty: { msg: 'Bairro não pode estar vazio' } }
        },

        cidade: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { notEmpty: { msg: 'Cidade não pode estar vazia' } }
        },

        estado: {
            type: DataTypes.STRING(2),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Estado não pode estar vazio' },
                len: { args: [2, 2], msg: 'Estado deve ter 2 caracteres (UF)' }
            }
        },

        cep: {
            type: DataTypes.STRING(8),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'CEP não pode estar vazio' },
                is: { args: /^\d{8}$/, msg: 'CEP deve ter 8 dígitos' }
            }
        },

        // ════════════════════════════════════════════════════════
        // DOCUMENTOS
        // ════════════════════════════════════════════════════════

        cnpj: {
            type: DataTypes.STRING(14),
            allowNull: false,
            unique: { msg: 'Este CNPJ já está cadastrado' },
            validate: {
                notEmpty: { msg: 'CNPJ não pode estar vazio' },
                is: { args: /^\d{14}$/, msg: 'CNPJ deve ter 14 dígitos' }
            }
        },

        inscricao_estadual: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        // ════════════════════════════════════════════════════════
        // CONTATO
        // ════════════════════════════════════════════════════════

        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: { msg: 'Este email já está cadastrado' },
            validate: {
                notEmpty: { msg: 'Email não pode estar vazio' },
                isEmail: { msg: 'Email inválido' }
            }
        },

        telefone: {
            type: DataTypes.STRING(11),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Telefone não pode estar vazio' },
                is: { args: /^\d{10,11}$/, msg: 'Telefone deve ter 10 ou 11 dígitos' }
            }
        },

        // ════════════════════════════════════════════════════════
        // DADOS BANCÁRIOS
        // ════════════════════════════════════════════════════════

        banco: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        agencia: {
            type: DataTypes.STRING(10),
            allowNull: true
        },

        conta: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        digito: {
            type: DataTypes.STRING(2),
            allowNull: true
        },

        // ════════════════════════════════════════════════════════
        // PROTOCOLO E PLANO
        // ════════════════════════════════════════════════════════

        protocol: {
            type: DataTypes.STRING(15),
            allowNull: false,
            unique: { msg: 'Protocolo duplicado' },
            validate: {
                notEmpty: { msg: 'Protocolo não pode estar vazio' }
            }
        },

        plan_id: {
            type: DataTypes.UUID,
            allowNull: false
        },

        total_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: { args: [0], msg: 'Valor não pode ser negativo' }
            }
        },

        // ════════════════════════════════════════════════════════
        // DOCUMENTOS ANEXADOS
        // ════════════════════════════════════════════════════════

        document_url: {
            type: DataTypes.STRING(500),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'URL do documento não pode estar vazia' }
            }
        },

        invoice_url: {
            type: DataTypes.STRING(500),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'URL da fatura não pode estar vazia' }
            }
        },

        energy_bill_url: {
            type: DataTypes.STRING(500),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'URL do comprovante não pode estar vazia' }
            }
        },

        // ════════════════════════════════════════════════════════
        // STATUS E OBSERVAÇÕES
        // ════════════════════════════════════════════════════════

        // Status geral (calculado com base nas bandeiras)
        status: {
            type: DataTypes.ENUM('pending', 'in_analysis', 'approved'),
            defaultValue: 'pending',
            allowNull: false
        },

        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        // ════════════════════════════════════════════════════════
        // RELACIONAMENTOS
        // ════════════════════════════════════════════════════════

        created_by: {
            type: DataTypes.UUID,
            allowNull: false
        },

        partner_id: {
            type: DataTypes.UUID,
            allowNull: true
        }

    }, {
        tableName: 'clients',
        timestamps: true,
        underscored: true
    });

    // ════════════════════════════════════════════════════════
    // MÉTODOS DE INSTÂNCIA
    // ════════════════════════════════════════════════════════

    /**
     * Calcula e atualiza o status geral baseado nas bandeiras
     */
    Client.prototype.updateOverallStatus = async function () {
        const ClientFlag = sequelize.models.ClientFlag;

        const flags = await ClientFlag.findAll({
            where: { client_id: this.id }
        });

        if (flags.length === 0) {
            return;
        }

        // Se alguma está pending → geral fica pending
        const hasPending = flags.some(f => f.status === 'pending');
        if (hasPending) {
            this.status = 'pending';
            await this.save();
            return;
        }

        // Se alguma está in_analysis → geral fica in_analysis
        const hasAnalysis = flags.some(f => f.status === 'in_analysis');
        if (hasAnalysis) {
            this.status = 'in_analysis';
            await this.save();
            return;
        }

        // Se todas approved → geral fica approved
        const allApproved = flags.every(f => f.status === 'approved');
        if (allApproved) {
            this.status = 'approved';
            await this.save();
        }
    };

    /**
     * Retorna dados limitados para partner
     */
    Client.prototype.toPartnerView = function () {
        return {
            name: this.name,
            razao_social: this.razao_social,
            tipo_cartao: this.tipo_cartao,
            telefone: this.telefone,
            status: this.status,
            notes: this.notes
        };
    };

    /**
     * Retorna dados para consulta pública
     */
    Client.prototype.toPublicView = async function () {
        const ClientFlag = sequelize.models.ClientFlag;
        const Flag = sequelize.models.Flag;
        const Plan = sequelize.models.Plan;

        // Busca bandeiras
        const clientFlags = await ClientFlag.findAll({
            where: { client_id: this.id },
            attributes: ['flag_name']
        });

        // Busca plano
        const plan = await Plan.findByPk(this.plan_id);

        return {
            nome_empresa: this.razao_social,
            plano: plan ? plan.name : 'Não informado',
            bandeiras: clientFlags.map(cf => cf.flag_name),
            status: this.status,
            observacoes: this.notes || 'Nenhuma observação'
        };
    };

    // ════════════════════════════════════════════════════════
    // ASSOCIAÇÕES
    // ════════════════════════════════════════════════════════

    Client.associate = function (models) {
        // Cliente pertence a um plano
        Client.belongsTo(models.Plan, {
            foreignKey: 'plan_id',
            as: 'plan'
        });

        // Cliente foi criado por um usuário
        Client.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        });

        // Cliente pode ter um parceiro
        Client.belongsTo(models.User, {
            foreignKey: 'partner_id',
            as: 'partner'
        });

        // Relação N:N com Flags através de ClientFlag
        Client.belongsToMany(models.Flag, {
            through: models.ClientFlag,
            foreignKey: 'client_id',
            as: 'flags'
        });

        // Acesso direto aos registros da tabela intermediária
        Client.hasMany(models.ClientFlag, {
            foreignKey: 'client_id',
            as: 'client_flags'
        });

        // Cliente tem um relatório de venda
        Client.hasOne(models.SalesReport, {
            foreignKey: 'client_id',
            as: 'sales_report'
        });
    };

    return Client;
};