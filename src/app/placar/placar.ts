import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Categoria,
  CATEGORIAS,
  formatarCategoria,
  ORDEM_CATEGORIAS,
} from '../core/medidas';
import { Ninho } from '../core/ninho';
import { ranking, serieCanarinho } from '../core/placar';
import { Grafico, PALETA, Serie } from '../shared/grafico';

const MEDALHAS = ['🥇', '🥈', '🥉'];

@Component({
  imports: [RouterLink, Grafico],
  template: `
    <section class="card">
      <h1>Placar</h1>
      <div class="filtros" role="tablist" aria-label="Categoria">
        @for (c of categorias; track c) {
          <button
            class="chip"
            role="tab"
            [attr.aria-selected]="cat() === c"
            [class.ativo]="cat() === c"
            (click)="cat.set(c)"
          >
            {{ info[c].emoji }} {{ info[c].rotulo }}
          </button>
        }
        <button class="chip ordem" (click)="crescente.update((v) => !v)">
          {{ crescente() ? '⬆️ menor primeiro' : '⬇️ maior primeiro' }}
        </button>
      </div>

      @if (ninho.erro()) {
        <p class="aviso">Não consegui carregar o placar. Recarrega a página.</p>
      } @else if (!ninho.pronto()) {
        <p class="aviso">Chamando os canarinhos...</p>
      } @else {
        @if (ranque().com.length) {
          <div class="podio">
            @for (i of ordemPodio; track i) {
              @if (ranque().com[i]; as l) {
                <a class="degrau d{{ i + 1 }}" [routerLink]="['/canarinho', l.canarinho.uid]">
                  <span class="medalha">{{ medalhas[i] }}</span>
                  <span class="avatar">{{ l.canarinho.perfil.avatar }}</span>
                  <strong>{{ l.canarinho.perfil.nome }}</strong>
                  <span class="valor">{{ fmt(l.valor) }}</span>
                </a>
              }
            }
          </div>

          <ol class="tabela">
            @for (l of ranque().com; track l.canarinho.uid; let i = $index) {
              <li>
                <a [routerLink]="['/canarinho', l.canarinho.uid]">
                  <span class="pos">{{ medalhas[i] ?? i + 1 }}</span>
                  <span class="nome">
                    {{ l.canarinho.perfil.avatar }} {{ l.canarinho.perfil.nome }}
                    @if (l.canarinho.perfil.apelido) {
                      <small>"{{ l.canarinho.perfil.apelido }}"</small>
                    }
                  </span>
                  <strong>{{ fmt(l.valor) }}</strong>
                  <span class="var" [class.sobe]="(l.variacao ?? 0) > 0" [class.desce]="(l.variacao ?? 0) < 0">
                    {{ l.legenda ?? variacao(l.variacao) }}
                  </span>
                </a>
              </li>
            }
          </ol>
        } @else {
          <p class="aviso">Ninguém lançou {{ info[cat()].rotulo }} ainda. Bora preencher a ficha!</p>
        }

        @if (ranque().sem.length) {
          <p class="sem">
            Sem dados:
            @for (c of ranque().sem; track c.uid) {
              <a [routerLink]="['/canarinho', c.uid]">{{ c.perfil.avatar }} {{ c.perfil.nome }}</a>
            }
          </p>
        }
      }
    </section>

    <section class="card">
      <h2>Evolução: {{ info[cat()].rotulo }}</h2>
      <app-grafico [series]="series()" [formato]="fmt" [legenda]="true" />
    </section>
  `,
  styles: `
    :host { display: grid; gap: 1.25rem; }
    .filtros { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
    .chip { font: inherit; font-weight: 800; cursor: pointer; background: var(--branco); border: 3px solid var(--tinta); border-radius: 2rem; padding: 0.2rem 0.75rem; }
    .chip.ativo { background: var(--azul); color: var(--amarelo); }
    .chip.ordem { background: var(--amarelo); margin-left: auto; }
    .aviso { margin: 0; font-weight: 800; opacity: 0.75; }

    .podio { display: flex; justify-content: center; align-items: flex-end; gap: 0.6rem; margin: 1.25rem 0 1.5rem; }
    .degrau { flex: 1; max-width: 9.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.1rem; text-align: center; text-decoration: none; color: var(--tinta); border: 3px solid var(--tinta); border-radius: 0.9rem 0.9rem 0 0; box-shadow: 4px 4px 0 var(--tinta); padding: 0.6rem 0.3rem; background: #d9dee5; }
    .degrau .medalha { font-size: 1.8rem; line-height: 1; }
    .degrau .avatar { font-size: 2.4rem; line-height: 1; }
    .degrau strong { overflow-wrap: anywhere; }
    .degrau .valor { font-family: var(--fonte-titulo); font-size: 1.25rem; letter-spacing: 1px; color: var(--azul); }
    .d1 { order: 2; min-height: 11rem; background: var(--amarelo); }
    .d2 { order: 1; min-height: 9rem; }
    .d3 { order: 3; min-height: 7.5rem; background: #e0a96d; }

    .tabela { list-style: none; margin: 0; padding: 0; }
    .tabela li { border-top: 2px dashed rgba(27, 27, 47, 0.25); }
    .tabela a { display: grid; grid-template-columns: 2.2rem 1fr auto; gap: 0.1rem 0.5rem; align-items: center; padding: 0.6rem 0.2rem; color: var(--tinta); text-decoration: none; font-weight: 700; }
    .tabela a:hover { background: var(--papel); }
    .pos { font-family: var(--fonte-titulo); font-size: 1.4rem; text-align: center; }
    .nome small { display: block; opacity: 0.65; }
    .tabela strong { text-align: right; }
    .var { grid-column: 3; text-align: right; font-size: 0.85rem; opacity: 0.8; }
    .var.sobe { color: var(--laranja); }
    .var.desce { color: var(--azul); }
    .sem { margin: 1rem 0 0; font-weight: 700; }
    .sem a { margin-left: 0.6rem; white-space: nowrap; }
  `,
})
export class Placar {
  protected readonly ninho = inject(Ninho);

  protected readonly categorias = ORDEM_CATEGORIAS;
  protected readonly info = CATEGORIAS;
  protected readonly medalhas = MEDALHAS;
  protected readonly ordemPodio = [0, 1, 2];

  protected readonly cat = signal<Categoria>('peso');
  protected readonly crescente = signal(false);

  protected readonly ranque = computed(() =>
    ranking(
      this.ninho.canarinhos(),
      this.ninho.medidasPorUid(),
      this.cat(),
      this.crescente(),
      this.ninho.apelidos(),
    ),
  );

  protected readonly series = computed<Serie[]>(() =>
    this.ninho.canarinhos().map((c, i) => ({
      nome: `${c.perfil.avatar} ${c.perfil.nome}`,
      cor: PALETA[i % PALETA.length],
      pontos: serieCanarinho(
        c,
        this.ninho.medidasPorUid().get(c.uid) ?? [],
        this.cat(),
        this.ninho.apelidos(),
      ),
    })),
  );

  // seta, pra passar como `formato` do gráfico mantendo o `this`
  protected readonly fmt = (v: number) => formatarCategoria(this.cat(), v);

  protected variacao(v: number | undefined) {
    if (v === undefined) return 'primeiro checkpoint';
    if (v === 0) return '= igual ao anterior';
    return `${v > 0 ? '▲ +' : '▼ −'}${this.fmt(Math.abs(v))} desde o anterior`;
  }
}
