import { dataBr, formatar, idMedida, imc, imcAtual, Medida, validar, valorAtual } from './medidas';

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

  it('validar rejeita data e faixa inválidas', () => {
    expect(validar('peso', 80, '2026-10-15')).toBeNull();
    expect(validar('peso', 5, '2026-10-15')).toContain('entre');
    expect(validar('peso', 80, '15/10/2026')).toBe('Data inválida.');
    expect(validar('altura', NaN, '2026-10-15')).toBe('Valor inválido.');
  });

  it('formata em pt-BR', () => {
    expect(formatar('peso', 78.5)).toBe('78,5 kg');
    expect(dataBr('2026-10-15')).toBe('15/10/2026');
  });
});
