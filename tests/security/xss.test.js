
const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');

describe('Teste de Penetração - Segurança de Dados', () => {
    let token;

    beforeAll(async () => {
        // Autenticação para obter o token de acesso
        const authResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'marlonsilveira.dev@gmail.com',
                password: 'Marlon@1512'
            });

        token = authResponse.body.data.token;
    });

    afterAll(async () => {
        // Fecha a conexão com o banco após os testes
        await sequelize.close();
    });

    /**
     * TESTE DE XSS (Cross-Site Scripting)
     * Verifica se a API bloqueia payloads maliciosos.
     */
    test('Deve bloquear e logar tentativa de ataque XSS no nome do cliente', async () => {
        const timestamp = Date.now();
        const cnpjFormatado = "45.275.091/0001-06";

        const response = await request(app)
            .post('/api/clients')
            .set('Authorization', `Bearer ${token}`)
            // Payload Malicioso: Tentativa de injetar script
            .field('name', "<script>alert('hack')</script> Marlon")
            .field('razao_social', "BG Representacoes LTDA")
            .field('ramo_atividade', "Tecnologia")
            .field('tipo_cartao', "ambos")
            .field('rua', "Rua de Teste")
            .field('numero', "123")
            .field('bairro', "Centro")
            .field('cidade', "Sao Paulo")
            .field('estado', "SP")
            .field('cep', "01234567")
            .field('cnpj', cnpjFormatado)
            .field('email', `teste${timestamp}@seguranca.com`)
            .field('telefone', "11999999999")
            .field('protocol', `PROT${timestamp}`)
            .field('total_value', "150.00")
            .field('plan_id', "151e50c6-3527-420e-b882-64c849a580cc")
            .field('selected_flags', '01140c97-889e-4491-bd40-ea98bd2bd8aa')
            .attach('document', Buffer.from('fake-doc'), 'documento.pdf')
            .attach('invoice', Buffer.from('fake-invoice'), 'fatura.pdf')
            .attach('energy_bill', Buffer.from('fake-bill'), 'conta-energia.pdf');

        // VALIDAÇÃO DE SEGURANÇA:
        // Esperamos 400 (Bad Request) porque o sanitizeInput/securityLogger 
        // detectou a ameaça e interrompeu o fluxo antes de chegar ao banco.
        expect(response.status).toBe(400);

        // Verifica se o corpo da resposta indica falha
        expect(response.body.success).toBe(false);

        // Verifica se a mensagem menciona HTML
        expect(response.body.error).toMatch(/HTML|tags|script/i);

        // No log do terminal, você deverá ver o aviso do seu securityLogger
        console.log('✅ Teste concluído: O sistema bloqueou a ameaça corretamente.');
    });

    /**
     * TESTE DE SQL INJECTION (Simples)
     * Verifica se caracteres comuns de SQL Injection são bloqueados ou tratados.
     */
    test('Deve bloquear tentativa de SQL Injection no campo e-mail', async () => {


        const response = await request(app)
            .post('/api/clients')
            .set('Authorization', `Bearer ${token}`)
            .field('email', "admin@teste.com' OR '1'='1") // Payload de SQLi
            .field('name', "Teste SQLi");

        // O sistema deve barrar ou pelo validador de e-mail ou pelo sanitizador
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
});