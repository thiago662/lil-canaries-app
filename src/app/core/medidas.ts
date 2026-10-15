export type TipoMedida = 'peso' | 'altura' | 'salario' | 'peca';

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
}

// Faixas espelhadas à mão em firestore.rules (validValor).
export const TIPOS: Record<TipoMedida, InfoTipo> = {
  peso: { rotulo: 'Peso', emoji: '⚖️', unidade: 'kg', min: 20, max: 400, passo: 0.1 },
  altura: { rotulo: 'Altura', emoji: '📏', unidade: 'cm', min: 100, max: 250, passo: 1 },
  salario: { rotulo: 'Salário', emoji: '💰', unidade: 'R$/mês', min: 0, max: 10_000_000, passo: 0.01 },
  peca: { rotulo: 'Tamanho da peça', emoji: '🍆', unidade: 'cm', min: 0, max: 100, passo: 0.1 },
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

export function imcAtual(medidas: Medida[]): number | undefined {
  const peso = valorAtual(medidas, 'peso');
  const altura = valorAtual(medidas, 'altura');
  return peso && altura ? imc(peso.valor, altura.valor) : undefined;
}

export function validar(tipo: TipoMedida, valor: number, data: string): string | null {
  const t = TIPOS[tipo];
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(data)) return 'Data inválida.';
  if (!Number.isFinite(valor)) return 'Valor inválido.';
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

export const dataBr = (data: string) => data.split('-').reverse().join('/');

export function hoje(): string {
  const d = new Date();
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}
