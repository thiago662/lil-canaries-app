import { dataBr } from './medidas';

// Um recado na ficha de um canarinho (canarinhos/{uid}/comentarios/{id}).
export interface Comentario {
  id: string;
  texto: string;
  autorUid: string;
  criadoEm: Date;
}

export const MAX_COMENTARIO = 200;

/** O texto pronto pra gravar (sem espaço sobrando nas pontas), ou o motivo de não poder. */
export function validarComentario(texto: string): { texto: string } | { erro: string } {
  const limpo = texto.trim();
  if (!limpo) return { erro: 'Escreve alguma coisa antes.' };
  if (limpo.length > MAX_COMENTARIO) {
    return { erro: `Máximo de ${MAX_COMENTARIO} caracteres (tem ${limpo.length}).` };
  }
  return { texto: limpo };
}

const dois = (n: number) => String(n).padStart(2, '0');

/** "agora há pouco", "há 5 min", "há 3 h", e a data com hora depois de um dia. */
export function quando(data: Date, agora = new Date()): string {
  const min = Math.floor((agora.getTime() - data.getTime()) / 60_000);
  if (min < 1) return 'agora há pouco';
  if (min < 60) return `há ${min} min`;
  if (min < 24 * 60) return `há ${Math.floor(min / 60)} h`;
  const iso = `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;
  return `${dataBr(iso)} ${dois(data.getHours())}:${dois(data.getMinutes())}`;
}
