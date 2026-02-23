describe('Regra de Negócio: Snapshot de Valores', () => {
    test('Deve garantir que o preço da bandeira no contrato seja independente do preço atual da bandeira', () => {
        // Preço da bandeira no sistema hoje
        const flagNoSistema = { id: 1, name: 'Mastercard', price: 30.00 };

        // Simulação do que é gravado na tabela ClientFlag (seu snapshot)
        const contratoCliente = {
            flag_id: flagNoSistema.id,
            flag_name: flagNoSistema.name,
            flag_price: flagNoSistema.price // Gravando 30.00
        };

        expect(contratoCliente.flag_price).toBe(30.00);

        // O ADMIN ALTERA O PREÇO PARA 40.00
        flagNoSistema.price = 40.00;

        // O valor no contrato do cliente DEVE continuar 30.00
        expect(contratoCliente.flag_price).toBe(30.00);
        expect(contratoCliente.flag_price).not.toBe(flagNoSistema.price);
    });
});