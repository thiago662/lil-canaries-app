export type TipoMedida = 'peso' | 'altura' | 'salario' | 'peca' | 'apelidos';

// Um checkpoint: o valor de um tipo numa data. O id é `${tipo}_${data}`, então só existe um por
// tipo e dia (guardar de novo no mesmo dia corrige o valor sem mexer no resto da linha do tempo).
export interface Medida {
  id: string;
  tipo: TipoMedida;
  data: string; // yyyy-MM-dd
  valor: number;
}

interface InfoTipo {
  rotulo: string;
  emoji: string;
  unidade: string;
  min: number;
  max: number;
  passo: number;
  /** Só números inteiros (contagens). */
  inteiro?: boolean;
  /** Valor de quem nunca lançou: em vez de "sem dados", conta como isso (a piada do contador). */
  padrao?: { valor: number; legenda: string };
}

// Faixas espelhadas à mão em firestore.rules (validValor).
export const TIPOS: Record<TipoMedida, InfoTipo> = {
  peso: { rotulo: 'Peso', emoji: '⚖️', unidade: 'kg', min: 20, max: 400, passo: 0.1 },
  altura: { rotulo: 'Altura', emoji: '📏', unidade: 'cm', min: 100, max: 250, passo: 1 },
  salario: { rotulo: 'Salário', emoji: '💰', unidade: 'R$/mês', min: 0, max: 10_000_000, passo: 0.01 },
  peca: { rotulo: 'Tamanho da peça', emoji: '🍆', unidade: 'cm', min: 0, max: 100, passo: 0.1 },
  apelidos: {
    rotulo: 'Apelidos pro Marco',
    emoji: 'Ⓜ️',
    unidade: 'nomes com M',
    min: 0,
    max: 100_000,
    passo: 1,
    inteiro: true,
    padrao: { valor: 0, legenda: 'ficha limpa' },
  },
};

export const ORDEM_TIPOS = Object.keys(TIPOS) as TipoMedida[];

export const idMedida = (tipo: TipoMedida, data: string) => `${tipo}_${data}`;

/** Checkpoint mais recente de um tipo (é o "valor de hoje"). */
export function valorAtual(medidas: Medida[], tipo: TipoMedida): Medida | undefined {
  let atual: Medida | undefined;
  for (const m of medidas) {
    if (m.tipo === tipo && (!atual || m.data > atual.data)) atual = m;
  }
  return atual;
}

export const imc = (pesoKg: number, alturaCm: number) => pesoKg / (alturaCm / 100) ** 2;

export interface Ponto {
  data: string;
  valor: number;
}

const porData = (a: Ponto, b: Ponto) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0);

/** Checkpoints de um tipo em ordem cronológica. */
export function serie(medidas: Medida[], tipo: TipoMedida): Ponto[] {
  return medidas
    .filter((m) => m.tipo === tipo)
    .map(({ data, valor }) => ({ data, valor }))
    .sort(porData);
}

/**
 * IMC ao longo do tempo: um ponto em cada data em que peso ou altura mudou, usando o peso e a
 * altura vigentes nela. Antes da primeira altura medida, vale a primeira (altura quase não muda).
 */
export function serieImc(medidas: Medida[]): Ponto[] {
  const pesos = serie(medidas, 'peso');
  const alturas = serie(medidas, 'altura');
  if (!pesos.length || !alturas.length) return [];
  const vigente = (s: Ponto[], data: string) => s.filter((p) => p.data <= data).at(-1);
  const datas = [...new Set([...pesos, ...alturas].map((p) => p.data))].sort();
  const pontos: Ponto[] = [];
  for (const data of datas) {
    const peso = vigente(pesos, data);
    if (!peso) continue;
    const altura = vigente(alturas, data) ?? alturas[0];
    pontos.push({ data, valor: imc(peso.valor, altura.valor) });
  }
  return pontos;
}

export const imcAtual = (medidas: Medida[]): number | undefined => serieImc(medidas).at(-1)?.valor;

// O que dá pra ranquear e plotar: os 4 tipos mais o IMC (derivado).
export type Categoria = TipoMedida | 'imc';

export const CATEGORIAS: Record<Categoria, { rotulo: string; emoji: string }> = {
  peso: TIPOS.peso,
  imc: { rotulo: 'IMC', emoji: '🧮' },
  altura: TIPOS.altura,
  salario: TIPOS.salario,
  peca: TIPOS.peca,
  apelidos: TIPOS.apelidos,
};

export const ORDEM_CATEGORIAS = Object.keys(CATEGORIAS) as Categoria[];

export const serieDe = (medidas: Medida[], cat: Categoria): Ponto[] =>
  cat === 'imc' ? serieImc(medidas) : serie(medidas, cat);

export function validar(tipo: TipoMedida, valor: number, data: string): string | null {
  const t = TIPOS[tipo];
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(data)) return 'Data inválida.';
  if (!Number.isFinite(valor)) return 'Valor inválido.';
  if (t.inteiro && !Number.isInteger(valor)) return `${t.rotulo} tem que ser um número inteiro.`;
  if (valor < t.min || valor > t.max) {
    return `${t.rotulo} tem que ficar entre ${t.min} e ${t.max} ${t.unidade}.`;
  }
  return null;
}

const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatar(tipo: TipoMedida, valor: number): string {
  return tipo === 'salario' ? reais.format(valor) : `${numero.format(valor)} ${TIPOS[tipo].unidade}`;
}

export const formatarImc = (v: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v);

export const formatarCategoria = (cat: Categoria, valor: number) =>
  cat === 'imc' ? formatarImc(valor) : formatar(cat, valor);

export const dataBr =(data: string) => data.split('-').reverse().join('/');

export function hoje(): string {
  const d = new Date();
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}
