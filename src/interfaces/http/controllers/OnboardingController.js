/**
 * CONTROLLER: OnboardingController
 * Responsabilidade: APENAS HTTP
 */

const catchAsync = require('../../../shared/utils/catchAsync');
const onboardingContainer = require('../../../infrastructure/container/OnboardingContainer');
const { OnboardClientDTO } = require('../../../application/dtos/onboarding');

class OnboardingController {
  /**
   * POST /api/v1/onboarding
   * Iniciar onboarding de cliente
   */
  static start = catchAsync(async (req, res) => {
    // ✅ PASSO 1: Validar entrada com Yup (middleware)
    // req.body já foi validado pelo validationMiddleware + onboardingSchema

    // ✅ PASSO 2: Criar DTO
    const dto = OnboardClientDTO.validate(req.body);

    // ✅ PASSO 3: Executar use case
    const useCase = onboardingContainer.getOnboardClientUseCase();
    const result = await useCase.execute(req.user, dto, req.files);

    // ✅ PASSO 4: Retornar resposta
    return res.status(201).json({
      status: 'success',
      message: 'Onboarding e documentos processados com sucesso.',
      data: result,
    });
  });
}

module.exports = OnboardingController;