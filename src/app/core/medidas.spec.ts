import {
  dataBr,
  formatar,
  idMedida,
  imc,
  imcAtual,
  Medida,
  serieImc,
  validar,
  valorAtual,
} from './medidas';

const m = (tipo: Medida['tipo'], data: string, valor: number): Medida => ({
  id: idMedida(tipo, data),
  tipo,
  data,
  valor,
});

describe('medidas', () => {
  const lista = [
    m('peso', '2026-09-01', 83),
    m('peso', '2026-10-01', 81),
    m('peso', '2026-08-01', 90),
    m('altura', '2026-01-01', 180),
  ];

  it('valorAtual pega o checkpoint mais recente do tipo, não o último da lista', () => {
    expect(valorAtual(lista, 'peso')?.valor).toBe(81);
    expect(valorAtual(lista, 'salario')).toBeUndefined();
  });

  it('IMC = peso / altura²', () => {
    expect(imc(81, 180)).toBeCloseTo(25, 5);
    expect(imcAtual(lista)).toBeCloseTo(25, 5);
    expect(imcAtual([m('peso', '2026-10-01', 81)])).toBeUndefined();
  });

  it('corrigir um checkpoint antigo não muda o valor atual nem os outros', () => {
    const corrigida = lista.map((x) =>
      x.id === idMedida('peso', '2026-09-01') ? { ...x, valor: 79 } : x,
    );
    expect(valorAtual(corrigida, 'peso')?.valor).toBe(81);
    expect(corrigida.filter((x, i) => x.valor !== lista[i].valor)).toHaveLength(1);
  });

  it('serieImc muda quando o peso muda e quando a altura muda', () => {
    const s = serieImc([
      m('peso', '2026-08-01', 90),
      m('peso', '2026-10-01', 81),
      m('altura', '2026-01-01', 180),
      m('altura', '2026-09-01', 190),
    ]);
    // 2026-01-01 ainda não tem peso: a série só começa no primeiro peso (08-01)
    expect(s.map((p) => p.data)).toEqual(['2026-08-01', '2026-09-01', '2026-10-01']);
    expect(s[0].valor).toBeCloseTo(imc(90, 180), 5);
    expect(s[1].valor).toBeCloseTo(imc(90, 190), 5); // só a altura mudou
    expect(s[2].valor).toBeCloseTo(imc(81, 190), 5); // só o peso mudou
  });

  it('peso medido antes da primeira altura usa a primeira altura', () => {
    const s = serieImc([m('peso', '2026-01-01', 80), m('altura', '2026-06-01', 180)]);
    expect(s[0]).toEqual({ data: '2026-01-01', valor: imc(80, 180) });
  });

  it('validar rejeita data e faixa inválidas', () => {
    expect(validar('peso', 80, '2026-10-15')).toBeNull();
    expect(validar('peso', 5, '2026-10-15')).toContain('entre');
    expect(validar('peso', 80, '15/10/2026')).toBe('Data inválida.');
    expect(validar('altura', NaN, '2026-10-15')).toBe('Valor inválido.');
    expect(validar('apelidos', 3, '2026-10-15')).toBeNull();
    expect(validar('apelidos', 2.5, '2026-10-15')).toContain('inteiro');
    expect(validar('apelidos', -1, '2026-10-15')).toContain('entre');
  });

  it('formata em pt-BR', () => {
    expect(formatar('peso', 78.5)).toBe('78,5 kg');
    expect(dataBr('2026-10-15')).toBe('15/10/2026');
  });
});
