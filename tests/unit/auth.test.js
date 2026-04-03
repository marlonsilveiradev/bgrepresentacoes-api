const { loginSchema, changePasswordSchema } = require('../../src/interfaces/http/validators/authValidators');

describe('Auth Validators', () => {
  describe('loginSchema', () => {
    it('valida email e senha corretos', async () => {
      const data = { email: 'teste@email.com', password: 'qualquercoisa' };
      await expect(loginSchema.validate(data)).resolves.toBeDefined();
    });

    it('rejeita email inválido', async () => {
      const data = { email: 'nao-e-email', password: 'senha123' };
      await expect(loginSchema.validate(data)).rejects.toThrow('e-mail válido');
    });

    it('rejeita quando email está ausente', async () => {
      const data = { password: 'senha123' };
      await expect(loginSchema.validate(data)).rejects.toThrow('obrigatório');
    });

    it('converte email para minúsculo', async () => {
      const data = { email: 'MAIUSCULO@EMAIL.COM', password: 'senha' };
      const result = await loginSchema.validate(data);
      expect(result.email).toBe('maiusculo@email.com');
    });
  });

  describe('changePasswordSchema', () => {
    it('valida troca de senha correta', async () => {
      const data = {
        currentPassword: 'SenhaAntiga@1',
        newPassword: 'SenhaNova@2',
        confirmPassword: 'SenhaNova@2',
      };
      await expect(changePasswordSchema.validate(data)).resolves.toBeDefined();
    });

    it('rejeita senha fraca (sem caractere especial)', async () => {
      const data = {
        currentPassword: 'qualquer',
        newPassword: 'SenhaSemEspecial1',
        confirmPassword: 'SenhaSemEspecial1',
      };
      await expect(changePasswordSchema.validate(data)).rejects.toThrow();
    });

    it('rejeita quando confirmação não confere', async () => {
      const data = {
        currentPassword: 'Antiga@1',
        newPassword: 'Nova@Senha1',
        confirmPassword: 'Diferente@1',
      };
      await expect(changePasswordSchema.validate(data)).rejects.toThrow('coincidem');
    });
  });
});