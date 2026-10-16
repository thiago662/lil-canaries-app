import type { Apelido } from './apelidos';
import { calcularBadges } from './badges';
import { idMedida, Medida } from './medidas';
import type { MetaDe } from './metas';
import type { Canarinho } from './ninho';

const c = (uid: string, nome: string): Canarinho => ({ uid, perfil: { nome, apelido: '', avatar: '🐤' } });
const m = (tipo: Medida['tipo'], data: string, valor: number): Medida => ({
  id: idMedida(tipo, data),
  tipo,
  data,
  valor,
});
const ids = (mapa: Map<string, { id: string }[]>, uid: string) => (mapa.get(uid) ?? []).map((b) => b.id);

const AGORA = '2026-10-15';

describe('badges', () => {
  const gente = [c('a', 'Ana'), c('b', 'Bia'), c('m', 'Marco')];

  it('rei do peso e lanterna: topo e fim, só com 2 ou mais na disputa', () => {
    const porUid = new Map([
      ['a', [m('peso', '2026-10-01', 70)]],
      ['b', [m('peso', '2026-10-01', 90)]],
      ['m', [m('peso', '2026-10-01', 107)]],
    ]);
    const r = calcularBadges(gente, porUid, [], [], AGORA);
    expect(ids(r, 'm')).toContain('rei-do-peso');
    expect(ids(r, 'a')).toContain('lanterna');
    expect(ids(r, 'b')).toEqual([]);

    const sozinho = calcularBadges(gente, new Map([['a', [m('peso', '2026-10-01', 70)]]]), [], [], AGORA);
    expect(ids(sozinho, 'a')).toEqual([]); // ninguém pra disputar
  });

  it('empate no topo leva todos os empatados', () => {
    const porUid = new Map([
      ['a', [m('peso', '2026-10-01', 90)]],
      ['b', [m('peso', '2026-10-01', 90)]],
      ['m', [m('peso', '2026-10-01', 70)]],
    ]);
    const r = calcularBadges(gente, porUid, [], [], AGORA);
    expect(ids(r, 'a')).toContain('rei-do-peso');
    expect(ids(r, 'b')).toContain('rei-do-peso');
  });

  it('quem mais caiu e quem mais subiu nos últimos 30 dias', () => {
    const porUid = new Map([
      ['a', [m('peso', '2026-09-01', 90), m('peso', '2026-10-10', 85)]], // −5
      ['b', [m('peso', '2026-09-01', 70), m('peso', '2026-10-12', 74)]], // +4
      ['m', [m('peso', '2026-09-01', 100), m('peso', '2026-10-10', 98)]], // −2
    ]);
    const r = calcularBadges(gente, porUid, [], [], AGORA);
    expect(ids(r, 'a')).toContain('mais-caiu');
    expect(ids(r, 'm')).not.toContain('mais-caiu');
    expect(ids(r, 'b')).toContain('mais-subiu');
  });

  it('a variação usa o último checkpoint de 30 dias atrás como base', () => {
    const porUid = new Map([
      ['a', [m('peso', '2026-08-01', 100), m('peso', '2026-09-10', 90), m('peso', '2026-10-14', 88)]],
    ]);
    // 30 dias antes de 15/10 é 15/09: base = 10/09 (90), não o de agosto → −2, não −12
    const r = calcularBadges([c('a', 'Ana')], porUid, [], [], AGORA);
    expect(r.get('a')?.find((b) => b.id === 'mais-caiu')?.descricao).toBe('Perdeu 2 kg em 30 dias');
  });

  it('dado velho (último checkpoint fora da janela) não conta como queda do mês', () => {
    const porUid = new Map([['a', [m('peso', '2026-06-01', 90), m('peso', '2026-08-01', 80)]]]);
    const r = calcularBadges([c('a', 'Ana')], porUid, [], [], AGORA);
    expect(ids(r, 'a')).not.toContain('mais-caiu');
  });

  it('meta batida e prazo estourado', () => {
    const porUid = new Map([
      ['a', [m('peso', '2026-08-01', 90), m('peso', '2026-10-01', 78)]],
      ['b', [m('peso', '2026-08-01', 90), m('peso', '2026-10-01', 88)]],
    ]);
    const metas: MetaDe[] = [
      { uid: 'a', tipo: 'peso', valor: 80 }, // desceu de 90 pra 78: bateu
      { uid: 'b', tipo: 'peso', valor: 80, data: '2026-10-01' }, // 88, prazo passou
    ];
    const r = calcularBadges([c('a', 'Ana'), c('b', 'Bia')], porUid, [], metas, AGORA);
    expect(ids(r, 'a')).toContain('meta-batida');
    expect(ids(r, 'a')).not.toContain('prazo-estourado');
    expect(ids(r, 'b')).toContain('prazo-estourado');
    expect(ids(r, 'b')).not.toContain('meta-batida');
  });

  it('meta com prazo no futuro e ainda não batida não dá badge nenhum', () => {
    // sem movimento nos últimos 30 dias: não é "quem mais caiu" nem "mais subiu"
    const porUid = new Map([['b', [m('peso', '2026-06-01', 90), m('peso', '2026-08-01', 88)]]]);
    const metas: MetaDe[] = [{ uid: 'b', tipo: 'peso', valor: 80, data: '2026-12-31' }];
    const r = calcularBadges([c('b', 'Bia')], porUid, [], metas, AGORA);
    expect(ids(r, 'b')).toEqual([]);
  });

  it('rei dos apelidos é só o Marco, e só se houver algum apelido', () => {
    const apelidos: Apelido[] = [{ id: 'marmelo', texto: 'Marmelo', data: '2026-02-01', autorUid: 'a' }];
    expect(ids(calcularBadges(gente, new Map(), apelidos, [], AGORA), 'm')).toContain('rei-dos-apelidos');
    expect(ids(calcularBadges(gente, new Map(), apelidos, [], AGORA), 'a')).toEqual([]);
    expect(ids(calcularBadges(gente, new Map(), [], [], AGORA), 'm')).toEqual([]);
  });

  it('maior peça e maior salário', () => {
    const porUid = new Map([
      ['a', [m('peca', '2026-10-01', 12), m('salario', '2026-10-01', 5000)]],
      ['b', [m('peca', '2026-10-01', 15), m('salario', '2026-10-01', 4000)]],
    ]);
    const r = calcularBadges([c('a', 'Ana'), c('b', 'Bia')], porUid, [], [], AGORA);
    expect(ids(r, 'b')).toContain('maior-peca');
    expect(ids(r, 'a')).toContain('maior-salario');
  });

  it('todo canarinho aparece no resultado, mesmo sem nenhum badge', () => {
    const r = calcularBadges(gente, new Map(), [], [], AGORA);
    expect([...r.keys()]).toEqual(['a', 'b', 'm']);
    expect(r.get('a')).toEqual([]);
  });
});
