import { Ponto } from './medidas';

// Um apelido com M que alguém já usou pro Marco. O id é o texto normalizado (`normalizar`), então
// o mesmo apelido só existe uma vez, e as rules só deixam criar (nunca sobrescrever).
export interface Apelido {
  id: string;
  texto: string;
  data: string; // yyyy-MM-dd
  autorUid: string;
}

// O alvo dos apelidos: o canarinho cujo perfil se chama Marco. Só ele pontua; todo mundo
// vê os outros no zero. ponytail: casa pelo nome do perfil; um segundo "Marco" pontuaria junto,
// aí vale guardar o uid do alvo num config/apelidos.
const ALVO = 'marco';

/** Minúsculas, sem acento e só letras/números: "Mandrágora " e "mandragora" são o mesmo apelido. */
export const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const ehAlvo = (perfil: { nome: string }) => normalizar(perfil.nome) === ALVO;

/** Tira espaços sobrando e deixa a primeira letra maiúscula ("marmelo" vira "Marmelo"). */
export function limpar(texto: string): string {
  const t = texto.trim().replace(/\s+/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Mensagem de erro, ou null se o apelido pode ser lançado. `existentes` é a lista atual. */
export function validarApelido(texto: string, existentes: Apelido[]): string | null {
  const t = limpar(texto);
  if (t.length < 2 || t.length > 30) return 'O apelido tem que ter de 2 a 30 letras.';
  if (!/^[\p{L}][\p{L} '-]*$/u.test(t)) return 'Só letras, espaço, hífen e apóstrofo.';
  if (normalizar(t).charAt(0) !== 'm') return 'Tem que começar com M.';
  const id = normalizar(t);
  if (id.length < 2) return 'Esse apelido é curto demais.';
  const repetido = existentes.find((a) => a.id === id);
  return repetido ? `"${repetido.texto}" já foi lançado.` : null;
}

/** Quantos apelidos o Marco tinha a cada data em que entrou algum (acumulado). */
export function serieApelidos(apelidos: Apelido[]): Ponto[] {
  const porDia = new Map<string, number>();
  for (const a of apelidos) porDia.set(a.data, (porDia.get(a.data) ?? 0) + 1);
  let total = 0;
  return [...porDia.keys()].sort().map((data) => ({ data, valor: (total += porDia.get(data)!) }));
}
