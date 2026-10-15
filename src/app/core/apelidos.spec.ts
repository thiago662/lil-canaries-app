import { Apelido, ehAlvo, limpar, normalizar, serieApelidos, validarApelido } from './apelidos';

const a = (texto: string, data: string): Apelido => ({
  id: normalizar(texto),
  texto,
  data,
  autorUid: 'u',
});

describe('apelidos', () => {
  it('normalizar ignora acento, caixa e símbolos', () => {
    expect(normalizar('Mandrágora ')).toBe('mandragora');
    expect(normalizar('MARMELO')).toBe('marmelo');
    expect(normalizar("Ma-ri'a")).toBe('maria');
  });

  it('limpar arruma espaços e maiúscula', () => {
    expect(limpar('  marmelo  doce ')).toBe('Marmelo doce');
  });

  it('validarApelido: precisa começar com M, ter tamanho e letras', () => {
    expect(validarApelido('Marmelo', [])).toBeNull();
    expect(validarApelido('marmelo', [])).toBeNull();
    expect(validarApelido('Mandrágora', [])).toBeNull();
    expect(validarApelido('Banana', [])).toBe('Tem que começar com M.');
    expect(validarApelido('M', [])).toContain('2 a 30');
    expect(validarApelido('M'.repeat(31), [])).toContain('2 a 30');
    expect(validarApelido('Ma123', [])).toContain('Só letras');
  });

  it('rejeita apelido repetido, mesmo com outro acento ou caixa', () => {
    const existentes = [a('Mandrágora', '2026-07-15')];
    expect(validarApelido('mandragora', existentes)).toBe('"Mandrágora" já foi lançado.');
    expect(validarApelido('MANDRÁGORA', existentes)).toContain('já foi lançado');
    expect(validarApelido('Mandioca', existentes)).toBeNull();
  });

  it('serieApelidos é o acumulado por data, com vários no mesmo dia', () => {
    const s = serieApelidos([
      a('Melancia', '2026-03-01'),
      a('Marmelo', '2026-02-01'),
      a('Martelo', '2026-03-01'),
    ]);
    expect(s).toEqual([
      { data: '2026-02-01', valor: 1 },
      { data: '2026-03-01', valor: 3 },
    ]);
    expect(serieApelidos([])).toEqual([]);
  });

  it('o alvo é o canarinho chamado Marco', () => {
    expect(ehAlvo({ nome: 'Marco' })).toBe(true);
    expect(ehAlvo({ nome: ' marco ' })).toBe(true);
    expect(ehAlvo({ nome: 'Marciano' })).toBe(false);
  });
});
