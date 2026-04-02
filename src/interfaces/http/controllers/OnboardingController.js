const OnboardingService = require('../../../infrastructure/services/OnboardingService');
const catchAsync = require('../../../shared/utils/catchAsync');

const start = catchAsync(async (req, res) => {
  const result = await OnboardingService.onboardClient(req.user, req.body, req.files);

  return res.status(201).json({
    status: 'success',
    message: 'Onboarding e documentos processados com sucesso.',
    data: result,
  });
});

module.exports = { start };