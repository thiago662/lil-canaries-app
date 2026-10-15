import { Apelido, ehAlvo, serieApelidos } from './apelidos';
import { Categoria, CATEGORIAS, Medida, Ponto, serieDe } from './medidas';
import type { Canarinho } from './ninho';

export interface Linha {
  canarinho: Canarinho;
  valor: number;
  /** Diferença pro checkpoint anterior da mesma categoria. */
  variacao?: number;
  /** Preenchido quando o valor é o padrão da categoria (nunca lançou), não um checkpoint. */
  legenda?: string;
}

/** Série de uma categoria pra um canarinho. Apelidos só têm série pro Marco (o alvo). */
export function serieCanarinho(
  canarinho: Canarinho,
  medidas: Medida[],
  cat: Categoria,
  apelidos: Apelido[],
): Ponto[] {
  if (cat === 'apelidos') return ehAlvo(canarinho.perfil) ? serieApelidos(apelidos) : [];
  return serieDe(medidas, cat);
}

/** Ranking pelo valor atual (mais recente) da categoria; quem não tem dado vai pra `sem`. */
export function ranking(
  canarinhos: Canarinho[],
  porUid: Map<string, Medida[]>,
  cat: Categoria,
  crescente = false,
  apelidos: Apelido[] = [],
): { com: Linha[]; sem: Canarinho[] } {
  const com: Linha[] = [];
  const sem: Canarinho[] = [];
  for (const canarinho of canarinhos) {
    const s = serieCanarinho(canarinho, porUid.get(canarinho.uid) ?? [], cat, apelidos);
    const atual = s.at(-1);
    if (!atual) {
      const padrao = CATEGORIAS[cat].padrao;
      if (padrao) com.push({ canarinho, valor: padrao.valor, legenda: padrao.legenda });
      else sem.push(canarinho);
      continue;
    }
    const anterior = s.at(-2);
    com.push({ canarinho, valor: atual.valor, variacao: anterior && atual.valor - anterior.valor });
  }
  com.sort(
    (a, b) =>
      (crescente ? a.valor - b.valor : b.valor - a.valor) ||
      a.canarinho.perfil.nome.localeCompare(b.canarinho.perfil.nome),
  );
  return { com, sem };
}
