const OnboardingService = require('../../../infrastructure/services/OnboardingService');
const catchAsync = require('../../../shared/utils/catchAsync');

/**
 * Inicia o onboarding de um novo cliente com uma venda acoplada.
 */
const start = catchAsync(async (req, res, next) => {
  let bodyData;
  
  // Parse seguro: se vier do FormData como string, limpamos e parseamos
  if (typeof req.body.data === 'string') {
    bodyData = JSON.parse(req.body.data.trim());
  } else {
    bodyData = req.body.data || req.body;
  }

  const files = req.files || {};

  // Organização dos arquivos
  const organizedFiles = {
  contrato: files.contrato || [],
  documentos: files.documentos || []
};

  // O Service agora é quem manda. Se falhar, o catchAsync joga pro errorHandler
  const result = await OnboardingService.onboardClient(req.user, bodyData, organizedFiles);

  return res.status(201).json({
    status: 'success',
    message: 'Onboarding e documentos processados com sucesso.',
    data: result
  });
});

module.exports = { start };