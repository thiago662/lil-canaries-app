import { hoje, Ponto, TipoMedida } from './medidas';

// A meta de um canarinho numa categoria (uma por tipo; o id do doc é o próprio tipo).
export interface Meta {
  tipo: TipoMedida;
  valor: number;
  data?: string; // prazo opcional, yyyy-MM-dd
}

export interface MetaDe extends Meta {
  uid: string;
}

export interface StatusMeta {
  atual: number;
  /** meta − atual: negativo se falta descer, positivo se falta subir. */
  falta: number;
  batida: boolean;
}

/**
 * Onde o canarinho está em relação à meta. A direção vem de onde ele começou: quem partiu de
 * cima da meta precisa descer até ela, quem partiu de baixo precisa subir.
 */
export function statusMeta(serie: Ponto[], meta: Meta): StatusMeta | undefined {
  const inicio = serie.at(0);
  const atual = serie.at(-1);
  if (!inicio || !atual) return undefined;
  const batida =
    inicio.valor > meta.valor
      ? atual.valor <= meta.valor
      : inicio.valor < meta.valor
        ? atual.valor >= meta.valor
        : atual.valor === meta.valor;
  return { atual: atual.valor, falta: meta.valor - atual.valor, batida };
}

/** A linha "planejado": reta na altura da meta, do primeiro checkpoint até o prazo (ou o último). */
export function seriePlanejada(serie: Ponto[], meta: Meta, agora = hoje()): Ponto[] {
  const inicio = serie.at(0);
  const ultimo = serie.at(-1);
  if (!inicio || !ultimo) return [];
  const fimMinimo = agora > ultimo.data ? agora : ultimo.data;
  const fim = meta.data && meta.data > fimMinimo ? meta.data : fimMinimo;
  return [
    { data: inicio.data, valor: meta.valor },
    { data: fim, valor: meta.valor },
  ];
}

const dia = 86_400_000;

/** Dias de `de` até `data` (negativo se já passou). */
export function diasAte(data: string, de = hoje()): number {
  return Math.round((Date.parse(data) - Date.parse(de)) / dia);
}
