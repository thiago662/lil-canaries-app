import { idMedida, Medida } from './medidas';
import type { Canarinho } from './ninho';
import { ranking } from './placar';

const c = (uid: string, nome: string): Canarinho => ({ uid, perfil: { nome, apelido: '', avatar: '🐤' } });
const m = (tipo: Medida['tipo'], data: string, valor: number): Medida => ({
  id: idMedida(tipo, data),
  tipo,
  data,
  valor,
});

describe('ranking', () => {
  const canarinhos = [c('a', 'Ana'), c('b', 'Bia'), c('c', 'Caio'), c('d', 'Davi')];
  const porUid = new Map<string, Medida[]>([
    ['a', [m('peso', '2026-10-01', 70), m('peso', '2026-09-01', 72)]],
    ['b', [m('peso', '2026-10-01', 90)]],
    ['c', [m('peso', '2026-10-01', 70)]], // empata com a Ana: desempata pelo nome
    // d não tem nada
  ]);

  it('ordena pelo valor atual, maior primeiro, e separa quem não tem dado', () => {
    const { com, sem } = ranking(canarinhos, porUid, 'peso');
    expect(com.map((l) => l.canarinho.perfil.nome)).toEqual(['Bia', 'Ana', 'Caio']);
    expect(sem.map((x) => x.uid)).toEqual(['d']);
  });

  it('crescente inverte', () => {
    const { com } = ranking(canarinhos, porUid, 'peso', true);
    expect(com.map((l) => l.canarinho.perfil.nome)).toEqual(['Ana', 'Caio', 'Bia']);
  });

  it('variação é contra o checkpoint anterior, indefinida no primeiro', () => {
    const { com } = ranking(canarinhos, porUid, 'peso');
    expect(com.find((l) => l.canarinho.uid === 'a')?.variacao).toBe(-2);
    expect(com.find((l) => l.canarinho.uid === 'b')?.variacao).toBeUndefined();
  });

  it('ranking de IMC só inclui quem tem peso e altura', () => {
    const p = new Map(porUid).set('a', [m('peso', '2026-10-01', 81), m('altura', '2026-01-01', 180)]);
    const { com, sem } = ranking(canarinhos, p, 'imc');
    expect(com).toHaveLength(1);
    expect(com[0].valor).toBeCloseTo(25, 5);
    expect(sem).toHaveLength(3);
  });
});
