const request = require('supertest');
const app = require('../../src/app'); // Certifique-se que este é o caminho para seu app express

describe('Testes de Penetração e Segurança', () => {

    // TESTE 1: Cross-Site Scripting (XSS)
    test('XSS: Deve limpar tags <script> do nome do cliente no cadastro', async () => {
        // Simulamos um token de admin para poder postar
        // Se você não tiver um token, precisará de um login prévio aqui
        const payloadMalicioso = {
            name: "<script>alert('ataque')</script> Empresa Segura",
            cnpj: "12345678000199",
            email: "teste@seguranca.com",
            razao_social: "Empresa Teste",
            tipo_cartao: "alimentacao",
            plan_id: "algum-id-valido"
        };

        const response = await request(app)
            .post('/api/clients')
            .send(payloadMalicioso);

        // Se o seu security.js funcionou, o nome retornado não deve ter as tags
        // O seu replace(/[<>\"%;()&+]/g, '') deve ter agido
        if (response.body.data) {
            expect(response.body.data.name).not.toContain('<script>');
            expect(response.body.data.name).toContain('alert'); // O alert fica, mas sem os sinais de < >
        }
    });

    // TESTE 2: SQL Injection (Básico)
    test('SQL Injection: Deve tratar caracteres de escape no login', async () => {
        const payloadSQL = {
            email: "admin@teste.com' OR '1'='1",
            password: "qualquer_coisa"
        };

        const response = await request(app)
            .post('/api/auth/login')
            .send(payloadSQL);

        // O sistema deve retornar 401 (Não autorizado) e NÃO 500 (Erro de banco)
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    // TESTE 3: Escalada de Privilégio (Privilege Escalation)
    test('Autorização: Usuário comum não deve conseguir registrar novos administradores', async () => {
        // 1. Você precisaria de um token de usuário comum (role: 'user')
        const tokenUsuarioComum = "COLOQUE_AQUI_UM_TOKEN_DE_USER_GERADO_NO_INSOMNIA";

        const response = await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${tokenUsuarioComum}`)
            .send({
                name: "Hacker",
                email: "hacker@sistema.com",
                password: "senha123",
                role: "admin"
            });

        // Deve retornar 403 Forbidden (conforme seu middleware requireAdmin)
        expect(response.status).toBe(403);
        expect(response.body.error).toContain('Acesso negado');
    });
});