const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BG Representações',
      version: '1.0.0',
      description: 'Documentação da API para gestão de vendas, clientes e usuários.',
    },
    servers: [
      { url: process.env.APP_URL + '/api/v1', description: 'Servidor Ativo' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Caminho para os arquivos onde estão as anotações @swagger
  apis: ['./src/interfaces/http/routes/*.js'], 
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;