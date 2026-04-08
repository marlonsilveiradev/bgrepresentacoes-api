/**
 * CONTROLLER: Onboarding
 * 
 * Responsabilidade: HTTP Layer - Receber requisição, delegar para Use Case, retornar resposta
 * 
 * ✅ IMPLEMENTAÇÕES:
 * - Injeção de dependência via Container
 * - Use Cases desacoplados
 * - Tratamento de erros robusto
 * - Logs estruturados
 * - Response DTOs
 * - Validação de input via Yup middleware
 * - Tratamento de arquivos (multipart/form-data)
 * - Soft delete support
 */

const logger = require('../../../infrastructure/config/logger');
const AppError = require('../../../shared/utils/AppError');
const catchAsync = require('../../../shared/utils/catchAsync');

class OnboardingController {
  /**
   * Constructor com injeção de dependência
   * @param {OnboardingContainer} onboardingContainer - Container com Use Cases injetados
   */
  constructor(onboardingContainer) {
    if (!onboardingContainer) {
      throw new Error('OnboardingContainer deve ser injetado no controller');
    }
    this.onboardingContainer = onboardingContainer;
  }

  /**
   * POST /api/v1/onboarding
   * 
   * Criar novo cliente via processo de onboarding unificado
   * 
   * ✅ Fluxo:
   * 1. Validação via middleware Yup (onboardingSchema)
   * 2. Validação de arquivos (multipart)
   * 3. Executa CreateClientUseCase com transaction
   * 4. Processa documentos em paralelo
   * 5. Retorna cliente criado com protocolo
   * 
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @param {Function} next - Express next middleware
   * @returns {Promise<Response>} JSON com cliente criado
   */
  create = catchAsync(async (req, res, next) => {
    const transactionId = `onb-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`;

    try {
      logger.info(
        {
          transactionId,
          cnpj: req.body.cnpj,
          email: req.body.email,
          filesCount: req.files ? Object.keys(req.files).length : 0,
        },
        '[OnboardingController.create] Iniciando onboarding'
      );

      // ✅ PASSO 1: Validar que usuário está autenticado
      if (!req.user || !req.user.id) {
        throw new AppError(
          'Usuário não autenticado',
          401,
          'UNAUTHORIZED'
        );
      }

      // ✅ PASSO 2: Preparar DTO com dados validados
      const onboardingDTO = this._prepareOnboardingDTO(req.body);

      // ✅ PASSO 3: Executar CreateClientUseCase (validação + transação)
      const createClientUseCase =
        this.onboardingContainer.getCreateClientUseCase();

      const client = await createClientUseCase.execute(
        onboardingDTO,
        req.user.id,
        req.files
      );

      logger.info(
        {
          transactionId,
          clientId: client.id,
          protocol: client.protocol,
          cnpj: client.cnpj,
        },
        '[OnboardingController.create] Cliente criado com sucesso'
      );

      // ✅ PASSO 4: Formatar resposta
      const responseDTO = this._formatResponseDTO(client);

      return res.status(201).json({
        success: true,
        status: 'success',
        message: 'Onboarding concluído com sucesso',
        data: responseDTO,
        metadata: {
          transactionId,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error) {
      // ✅ Logging de erro
      logger.error(
        {
          transactionId,
          cnpj: req.body?.cnpj,
          error: error.message,
          errorCode: error.code || error.statusCode || 'UNKNOWN',
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        '[OnboardingController.create] Erro ao processar onboarding'
      );

      // Re-lançar para middleware de erro global
      throw error;
    }
  });

  /**
   * GET /api/v1/onboarding/status/:protocolId
   * 
   * Consultar status do onboarding via protocolo
   * 
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {Promise<Response>} Status do onboarding
   */
  getOnboardingStatus = catchAsync(async (req, res, next) => {
    try {
      const { protocolId } = req.params;

      if (!protocolId) {
        throw new AppError(
          'Protocolo é obrigatório',
          400,
          'MISSING_PROTOCOL'
        );
      }

      logger.debug(
        { protocolId },
        '[OnboardingController.getOnboardingStatus] Buscando status'
      );

      // ✅ Buscar via Use Case (quando implementado)
      // const getStatusUseCase = this.onboardingContainer.getGetOnboardingStatusUseCase();
      // const status = await getStatusUseCase.execute(protocolId);

      // Por enquanto, placeholder
      const status = {
        protocol: protocolId,
        status: 'pending',
        created_at: new Date(),
      };

      return res.status(200).json({
        success: true,
        status: 'success',
        data: status,
      });

    } catch (error) {
      logger.error(
        { error: error.message, protocolId: req.params.protocolId },
        '[OnboardingController.getOnboardingStatus] Erro'
      );
      throw error;
    }
  });

  /**
   * ✅ HELPER: Preparar DTO com dados validados
   * 
   * Dados já foram validados pelo middleware Yup (onboardingSchema)
   * Apenas formatamos e limpamos antes de passar para Use Case
   * 
   * @param {Object} rawData - Dados brutos do request.body
   * @returns {Object} DTO formatado
   */
  _prepareOnboardingDTO(rawData) {
    return {
      // ─── CLIENTE ──────────────────────────────────────────
      corporate_name: rawData.corporate_name?.trim(),
      trade_name: rawData.trade_name?.trim() || null,
      responsible_name: rawData.responsible_name?.trim(),
      cnpj: rawData.cnpj?.replace(/\D/g, ''),  // Remove máscara
      state_registration: rawData.state_registration?.trim() || null,
      phone: rawData.phone?.trim(),
      email: rawData.email?.toLowerCase().trim(),
      benefit_type: rawData.benefit_type,
      notes: rawData.notes?.trim() || null,

      // ─── MÁQUINA ──────────────────────────────────────────
      machine_name: rawData.machine_name?.trim() || null,
      machine_affiliation_code: rawData.machine_affiliation_code?.trim() || null,

      // ─── ENDEREÇO ─────────────────────────────────────────
      address_street: rawData.address_street?.trim(),
      address_number: rawData.address_number?.trim(),
      address_complement: rawData.address_complement?.trim() || null,
      address_neighborhood: rawData.address_neighborhood?.trim() || null,
      address_city: rawData.address_city?.trim(),
      address_state: rawData.address_state?.trim().toUpperCase(),
      address_zip: rawData.address_zip?.replace(/\D/g, ''),  // Remove máscara

      // ─── BANCO ────────────────────────────────────────────
      bank_name: rawData.bank_name?.trim(),
      agency: rawData.agency?.trim(),
      agency_digit: rawData.agency_digit?.trim() || null,
      account: rawData.account?.trim(),
      account_digit: rawData.account_digit?.trim() || null,
      account_type: rawData.account_type,

      // ─── VENDA ────────────────────────────────────────────
      plan_id: rawData.plan_id?.trim() || null,
      flag_ids: Array.isArray(rawData.flag_ids)
        ? rawData.flag_ids
          .map(id => (typeof id === 'string' ? id.trim() : id))
          .filter(id => id && id.length > 0)
        : null,
      partner_id: rawData.partner_id?.trim() || null,
    };
  }

  /**
   * ✅ HELPER: Formatar DTO de resposta
   * 
   * Transformar entidade Client para DTO de resposta (apenas dados públicos)
   * 
   * @param {Object} client - Cliente criado (entity)
   * @returns {Object} DTO de resposta formatado
   */
  _formatResponseDTO(client) {
    return {
      id: client.id,
      protocol: client.protocol,
      corporate_name: client.corporate_name,
      trade_name: client.trade_name,
      responsible_name: client.responsible_name,
      cnpj: client.cnpj,
      email: client.email,
      phone: client.phone,
      benefit_type: client.benefit_type,
      overall_status: client.overall_status,
      
      // Máquina
      machine_name: client.machine_name,
      machine_affiliation_code: client.machine_affiliation_code,

      // Endereço (formatado)
      address: {
        street: client.address_street,
        number: client.address_number,
        complement: client.address_complement,
        neighborhood: client.address_neighborhood,
        city: client.address_city,
        state: client.address_state,
        zip: client.address_zip,
      },

      // Timestamps
      created_at: client.created_at,
      updated_at: client.updated_at,
    };
  }
}

module.exports = OnboardingController;