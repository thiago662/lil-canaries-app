import type { Canarinho } from './ninho';
import { Categoria, Medida, serieDe, TIPOS } from './medidas';

export interface Linha {
  canarinho: Canarinho;
  valor: number;
  /** Diferença pro checkpoint anterior da mesma categoria. */
  variacao?: number;
  /** Preenchido quando o valor é o padrão da categoria (nunca lançou), não um checkpoint. */
  legenda?: string;
}

/** Ranking pelo valor atual (mais recente) da categoria; quem não tem dado vai pra `sem`. */
export function ranking(
  canarinhos: Canarinho[],
  porUid: Map<string, Medida[]>,
  cat: Categoria,
  crescente = false,
): { com: Linha[]; sem: Canarinho[] } {
  const com: Linha[] = [];
  const sem: Canarinho[] = [];
  for (const canarinho of canarinhos) {
    const s = serieDe(porUid.get(canarinho.uid) ?? [], cat);
    const atual = s.at(-1);
    if (!atual) {
      const padrao = cat === 'imc' ? undefined : TIPOS[cat].padrao;
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
