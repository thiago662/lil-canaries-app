import { erroDeSenha, MIN_SENHA, validarNovaSenha } from './senha';

describe('senha', () => {
  const ok = 'canarinho-2026';

  it('aceita uma senha nova boa', () => {
    expect(validarNovaSenha('password123', ok, ok)).toBeNull();
  });

  it('exige a senha atual', () => {
    expect(validarNovaSenha('', ok, ok)).toBe('Digita a senha atual.');
  });

  it(`exige pelo menos ${MIN_SENHA} caracteres`, () => {
    expect(validarNovaSenha('x', 'curta', 'curta')).toContain(`${MIN_SENHA} caracteres`);
    expect(validarNovaSenha('x', 'a1b2c3d4', 'a1b2c3d4')).toBeNull();
  });

  it('não deixa repetir a atual, repetir um caractere nem usar senha comum', () => {
    expect(validarNovaSenha(ok, ok, ok)).toContain('diferente da atual');
    expect(validarNovaSenha('x', 'aaaaaaaa', 'aaaaaaaa')).toContain('repetir o mesmo caractere');
    expect(validarNovaSenha('x', 'Password123', 'Password123')).toContain('comum demais');
    expect(validarNovaSenha('x', '12345678', '12345678')).toContain('comum demais');
  });

  it('a confirmação tem que bater', () => {
    expect(validarNovaSenha('x', ok, `${ok}!`)).toBe('A confirmação não bate com a senha nova.');
  });

  it('traduz os erros do Firebase e cai num texto genérico pro resto', () => {
    expect(erroDeSenha({ code: 'auth/wrong-password' })).toBe('A senha atual está errada.');
    expect(erroDeSenha({ code: 'auth/invalid-credential' })).toBe('A senha atual está errada.');
    expect(erroDeSenha({ code: 'auth/coisa-nova' })).toContain('Não consegui trocar');
    expect(erroDeSenha(null)).toContain('Não consegui trocar');
  });
});
