import { diasAte, Meta, seriePlanejada, statusMeta } from './metas';

const meta = (valor: number, data?: string): Meta => ({ tipo: 'peso', valor, data });

describe('metas', () => {
  const descendo = [
    { data: '2026-08-15', valor: 86 },
    { data: '2026-09-15', valor: 83.5 },
    { data: '2026-10-15', valor: 81 },
  ];

  it('quem começou acima da meta precisa descer: falta negativa, ainda não bateu', () => {
    expect(statusMeta(descendo, meta(78))).toEqual({ atual: 81, falta: -3, batida: false });
  });

  it('bateu a meta quando chega nela ou passa dela, na direção certa', () => {
    expect(statusMeta(descendo, meta(81))?.batida).toBe(true);
    expect(statusMeta(descendo, meta(85))?.batida).toBe(true);
    const subindo = [
      { data: '2026-01-01', valor: 60 },
      { data: '2026-06-01', valor: 70 },
    ];
    expect(statusMeta(subindo, meta(75))).toEqual({ atual: 70, falta: 5, batida: false });
    expect(statusMeta(subindo, meta(70))?.batida).toBe(true);
    expect(statusMeta(subindo, meta(65))?.batida).toBe(true);
  });

  it('sem checkpoints não há status', () => {
    expect(statusMeta([], meta(78))).toBeUndefined();
    expect(seriePlanejada([], meta(78))).toEqual([]);
  });

  it('planejado é uma reta na altura da meta, do primeiro checkpoint até o prazo', () => {
    expect(seriePlanejada(descendo, meta(78, '2026-12-31'), '2026-10-20')).toEqual([
      { data: '2026-08-15', valor: 78 },
      { data: '2026-12-31', valor: 78 },
    ]);
  });

  it('sem prazo, a reta vai até hoje; prazo no passado não encolhe abaixo do último dado', () => {
    expect(seriePlanejada(descendo, meta(78), '2026-11-02')[1].data).toBe('2026-11-02');
    expect(seriePlanejada(descendo, meta(78), '2026-09-01')[1].data).toBe('2026-10-15');
    expect(seriePlanejada(descendo, meta(78, '2026-09-30'), '2026-09-01')[1].data).toBe('2026-10-15');
  });

  it('diasAte conta dias, negativos se já passou', () => {
    expect(diasAte('2026-10-25', '2026-10-15')).toBe(10);
    expect(diasAte('2026-10-10', '2026-10-15')).toBe(-5);
    expect(diasAte('2026-10-15', '2026-10-15')).toBe(0);
  });
});
