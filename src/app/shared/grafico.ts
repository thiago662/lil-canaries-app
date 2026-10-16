import { Component, effect, ElementRef, input, viewChild } from '@angular/core';
import {
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { dataBr, Ponto } from '../core/medidas';

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Legend);

export interface Serie {
  nome: string;
  cor: string;
  pontos: Ponto[];
  /** Só a linha, sem bolinhas (a reta do planejado). */
  semPontos?: boolean;
}

// Cores distintas pra até 12 canarinhos no mesmo gráfico.
export const PALETA = [
  '#1d4fa3', '#f26b21', '#009c3b', '#d62828', '#7b3fa0', '#0aa5b5',
  '#e0a800', '#c2185b', '#6d4c41', '#2e7d32', '#3949ab', '#546e7a',
];

const dia = 86_400_000;
const epoch = (data: string) => Date.parse(data); // yyyy-MM-dd vira meia-noite UTC
const curta = (ms: number) => dataBr(new Date(ms).toISOString().slice(0, 10)).slice(0, 5);
const mesAno = (ms: number) => {
  const iso = new Date(ms).toISOString();
  return `${iso.slice(5, 7)}/${iso.slice(2, 4)}`;
};

/** Séries de mais de ~4 meses marcam o eixo todo dia 1 (de 1 em 1 mês, ou de k em k pra caber). */
const LONGA = 120 * dia;

function ticksMensais(min: number, max: number) {
  const meses = Math.round((max - min) / (30.4 * dia));
  const passo = Math.max(1, Math.ceil(meses / 7));
  const ini = new Date(min);
  const ticks: { value: number }[] = [];
  let d = new Date(Date.UTC(ini.getUTCFullYear(), ini.getUTCMonth() + 1, 1));
  while (d.getTime() <= max) {
    ticks.push({ value: d.getTime() });
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + passo, 1));
  }
  return ticks;
}

// Eixo X numérico (data em ms) pra que o espaço entre checkpoints reflita o tempo de verdade.
@Component({
  selector: 'app-grafico',
  template: `
    <div class="caixa"><canvas #tela></canvas></div>
    @if (vazio()) {
      <p class="vazio">Sem dados pra esse gráfico ainda.</p>
    }
  `,
  styles: `
    .caixa { position: relative; height: 16rem; }
    .vazio { margin: 0.5rem 0 0; opacity: 0.7; text-align: center; }
  `,
})
export class Grafico {
  readonly series = input.required<Serie[]>();
  readonly formato = input<(v: number) => string>((v) => String(v));
  readonly legenda = input(false);

  private readonly tela = viewChild.required<ElementRef<HTMLCanvasElement>>('tela');

  protected vazio() {
    return this.series().every((s) => !s.pontos.length);
  }

  constructor() {
    effect((onCleanup) => {
      const formato = this.formato();
      // Limites do eixo X explícitos: com um ponto só (min == max) o Chart.js esticaria o eixo.
      const xs = this.series().flatMap((s) => s.pontos.map((p) => epoch(p.data)));
      const [min, max] = xs.length ? [Math.min(...xs), Math.max(...xs)] : [Date.now(), Date.now()];
      const folga = Math.max(dia * 7, (max - min) * 0.05);
      const longa = max - min > LONGA;
      const chart = new Chart(this.tela().nativeElement, {
        type: 'line',
        data: {
          datasets: this.series().map((s) => ({
            label: s.nome,
            data: s.pontos.map((p) => ({ x: epoch(p.data), y: p.valor })),
            borderColor: s.cor,
            backgroundColor: s.cor,
            borderWidth: 3,
            // muitos pontos (ex.: uma série semanal) ficam menores pra não virar uma mancha
            pointRadius: s.semPontos ? 0 : s.pontos.length > 30 ? 2.5 : 5,
            pointHoverRadius: s.semPontos ? 0 : 7,
            pointBorderColor: '#1b1b2f',
            pointBorderWidth: s.pontos.length > 30 ? 1 : 2,
            tension: 0.2,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          parsing: false,
          animation: false,
          font: { family: 'Nunito, system-ui, sans-serif', weight: 700 },
          scales: {
            x: {
              type: 'linear',
              min: min - folga,
              max: max + folga,
              afterBuildTicks: longa
                ? (eixo) => {
                    eixo.ticks = ticksMensais(eixo.min, eixo.max);
                  }
                : undefined,
              ticks: { maxTicksLimit: 8, callback: (v) => (longa ? mesAno(Number(v)) : curta(Number(v))) },
              grid: { color: 'rgba(27,27,47,0.12)' },
            },
            y: {
              ticks: { callback: (v) => formato(Number(v)), maxTicksLimit: 6 },
              grid: { color: 'rgba(27,27,47,0.12)' },
            },
          },
          plugins: {
            legend: { display: this.legenda(), labels: { usePointStyle: true } },
            tooltip: {
              callbacks: {
                title: (itens) => dataBr(new Date(itens[0].parsed.x ?? 0).toISOString().slice(0, 10)),
                label: (item) => `${item.dataset.label}: ${formato(item.parsed.y ?? 0)}`,
              },
            },
          },
        },
      });
      onCleanup(() => chart.destroy());
    });
  }
}
