import { Apelido, ehAlvo } from './apelidos';
import { formatar, hoje, Medida, serie, TIPOS, TipoMedida } from './medidas';
import { MetaDe, statusMeta } from './metas';
import type { Canarinho } from './ninho';

export interface Badge {
  id: string;
  emoji: string;
  rotulo: string;
  descricao: string;
}

const dia = 86_400_000;
const JANELA_DIAS = 30;

const dataMenos = (data: string, dias: number) =>
  new Date(Date.parse(data) - dias * dia).toISOString().slice(0, 10);

const atual = (medidas: Medida[], tipo: TipoMedida) => serie(medidas, tipo).at(-1)?.valor;

/** Quem está no topo (ou no fim) de uma lista. Precisa de pelo menos 2 na disputa; empate leva todos. */
function extremo(valores: Map<string, number>, maior: boolean): string[] {
  if (valores.size < 2) return [];
  const alvo = maior ? Math.max(...valores.values()) : Math.min(...valores.values());
  return [...valores].filter(([, v]) => v === alvo).map(([uid]) => uid);
}

/**
 * Variação de peso na janela de 30 dias: último checkpoint contra o último de 30 dias atrás (ou o
 * primeiro, se ele é mais novo que isso). Sem 2 checkpoints, ou com o último fora da janela, não há.
 */
function variacaoNoMes(medidas: Medida[], agora: string): number | undefined {
  const s = serie(medidas, 'peso');
  const ultimo = s.at(-1);
  if (s.length < 2 || !ultimo) return undefined;
  const limite = dataMenos(agora, JANELA_DIAS);
  if (ultimo.data <= limite) return undefined;
  const base = s.filter((p) => p.data <= limite).at(-1) ?? s[0];
  return base.data < ultimo.data ? ultimo.valor - base.valor : undefined;
}

/** Os títulos de cada canarinho, calculados na hora a partir dos dados (nada é gravado). */
export function calcularBadges(
  canarinhos: Canarinho[],
  porUid: Map<string, Medida[]>,
  apelidos: Apelido[],
  metas: MetaDe[],
  agora = hoje(),
): Map<string, Badge[]> {
  const resultado = new Map<string, Badge[]>(canarinhos.map((c) => [c.uid, []]));
  const dar = (uids: string[], badge: Badge) => {
    for (const uid of uids) resultado.get(uid)?.push(badge);
  };
  const medidasDe = (uid: string) => porUid.get(uid) ?? [];

  const valoresDe = (tipo: TipoMedida) => {
    const mapa = new Map<string, number>();
    for (const c of canarinhos) {
      const v = atual(medidasDe(c.uid), tipo);
      if (v !== undefined) mapa.set(c.uid, v);
    }
    return mapa;
  };

  // peso: topo e fim da tabela
  const pesos = valoresDe('peso');
  const topo = extremo(pesos, true);
  const fim = extremo(pesos, false);
  dar(topo, {
    id: 'rei-do-peso',
    emoji: '👑',
    rotulo: 'Rei do Peso',
    descricao: `Maior peso do ninho (${formatar('peso', pesos.get(topo[0]) ?? 0)})`,
  });
  dar(fim, {
    id: 'lanterna',
    emoji: '🪶',
    rotulo: 'Lanterna',
    descricao: `Menor peso do ninho (${formatar('peso', pesos.get(fim[0]) ?? 0)})`,
  });

  // quem mais caiu / mais subiu nos últimos 30 dias
  const variacoes = new Map<string, number>();
  for (const c of canarinhos) {
    const v = variacaoNoMes(medidasDe(c.uid), agora);
    if (v !== undefined && v !== 0) variacoes.set(c.uid, v);
  }
  const quedas = new Map([...variacoes].filter(([, v]) => v < 0));
  const subidas = new Map([...variacoes].filter(([, v]) => v > 0));
  if (quedas.size) {
    const menor = Math.min(...quedas.values());
    dar([...quedas].filter(([, v]) => v === menor).map(([uid]) => uid), {
      id: 'mais-caiu',
      emoji: '📉',
      rotulo: 'Quem mais caiu',
      descricao: `Perdeu ${formatar('peso', -menor)} em 30 dias`,
    });
  }
  if (subidas.size) {
    const maior = Math.max(...subidas.values());
    dar([...subidas].filter(([, v]) => v === maior).map(([uid]) => uid), {
      id: 'mais-subiu',
      emoji: '📈',
      rotulo: 'Quem mais subiu',
      descricao: `Ganhou ${formatar('peso', maior)} em 30 dias`,
    });
  }

  // metas: bateu, ou estourou o prazo sem bater
  for (const c of canarinhos) {
    const batidas: string[] = [];
    const estouradas: string[] = [];
    for (const meta of metas.filter((m) => m.uid === c.uid)) {
      const status = statusMeta(serie(medidasDe(c.uid), meta.tipo), meta);
      if (!status) continue;
      if (status.batida) batidas.push(TIPOS[meta.tipo].rotulo);
      else if (meta.data && meta.data < agora) estouradas.push(TIPOS[meta.tipo].rotulo);
    }
    if (batidas.length) {
      dar([c.uid], {
        id: 'meta-batida',
        emoji: '🎯',
        rotulo: 'Meta batida',
        descricao: `Bateu a meta de ${batidas.join(' e ')}`,
      });
    }
    if (estouradas.length) {
      dar([c.uid], {
        id: 'prazo-estourado',
        emoji: '💀',
        rotulo: 'Prazo estourado',
        descricao: `Passou do prazo da meta de ${estouradas.join(' e ')}`,
      });
    }
  }

  // o contador do Marco
  const alvo = canarinhos.find((c) => ehAlvo(c.perfil));
  if (alvo && apelidos.length) {
    dar([alvo.uid], {
      id: 'rei-dos-apelidos',
      emoji: 'Ⓜ️',
      rotulo: 'Rei dos Apelidos',
      descricao: `${apelidos.length} apelidos com M`,
    });
  }

  // peça e salário
  const pecas = valoresDe('peca');
  const maiorPeca = extremo(pecas, true);
  dar(maiorPeca, {
    id: 'maior-peca',
    emoji: '🍆',
    rotulo: 'Maior peça',
    descricao: `Maior peça do ninho (${formatar('peca', pecas.get(maiorPeca[0]) ?? 0)})`,
  });
  const salarios = valoresDe('salario');
  const maiorSalario = extremo(salarios, true);
  dar(maiorSalario, {
    id: 'maior-salario',
    emoji: '💰',
    rotulo: 'Maior salário',
    descricao: `Maior salário do ninho (${formatar('salario', salarios.get(maiorSalario[0]) ?? 0)})`,
  });

  return resultado;
}
