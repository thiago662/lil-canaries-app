import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, AVATARES } from '../core/auth.service';
import {
  Categoria,
  CATEGORIAS,
  dataBr,
  formatar,
  formatarCategoria,
  formatarImc,
  imcAtual,
  ORDEM_CATEGORIAS,
  ORDEM_TIPOS,
  serieDe,
  TIPOS,
  valorAtual,
} from '../core/medidas';
import { Ninho } from '../core/ninho';
import { Grafico, Serie } from '../shared/grafico';
import { Checkpoints } from './checkpoints';

// Ficha de um canarinho: figurinha com os valores de hoje, gráfico e checkpoints.
// A própria ficha é editável; a dos outros é só leitura.
@Component({
  imports: [FormsModule, RouterLink, Checkpoints, Grafico],
  template: `
    @if (perfil(); as p) {
      <section class="card figurinha">
        <div class="cabeca">
          <span class="avatar" aria-hidden="true">{{ p.avatar }}</span>
          <div>
            <h1>{{ p.nome }}</h1>
            @if (p.apelido) {
              <p class="apelido">"{{ p.apelido }}"</p>
            }
          </div>
          @if (editavel()) {
            <button class="btn mini" (click)="abrirPerfil()">✏️ Perfil</button>
          } @else {
            <a class="btn mini" routerLink="/">🏆 Placar</a>
          }
        </div>

        @if (editandoPerfil()) {
          <form class="perfil" (ngSubmit)="salvarPerfil()">
            <label class="campo">
              <span>Apelido</span>
              <input
                name="apelido"
                maxlength="30"
                [ngModel]="apelido()"
                (ngModelChange)="apelido.set($event)"
              />
            </label>
            <div class="avatares" role="radiogroup" aria-label="Avatar">
              @for (a of avatares; track a) {
                <button
                  type="button"
                  class="avatar-opcao"
                  role="radio"
                  [attr.aria-checked]="avatar() === a"
                  [class.ativo]="avatar() === a"
                  (click)="avatar.set(a)"
                >
                  {{ a }}
                </button>
              }
            </div>
            <button class="btn verde" type="submit">Salvar perfil</button>
          </form>
        }

        @if (erro()) {
          <p class="erro" role="alert">{{ erro() }}</p>
        }

        <div class="stats">
          @for (s of stats(); track s.rotulo) {
            <div class="stat">
              <span class="emoji" aria-hidden="true">{{ s.emoji }}</span>
              <span class="rotulo">{{ s.rotulo }}</span>
              <strong>{{ s.valor }}</strong>
              <small>{{ s.desde }}</small>
            </div>
          }
        </div>
      </section>

      <section class="card">
        <h2>Evolução</h2>
        <div class="filtros" role="tablist" aria-label="Categoria do gráfico">
          @for (c of categorias; track c) {
            <button
              class="chip"
              role="tab"
              [attr.aria-selected]="graficoCat() === c"
              [class.ativo]="graficoCat() === c"
              (click)="graficoCat.set(c)"
            >
              {{ info[c].emoji }} {{ info[c].rotulo }}
            </button>
          }
        </div>
        <app-grafico [series]="serie()" [formato]="fmt" />
      </section>

      <app-checkpoints [uid]="uid()" [medidas]="medidas()" [editavel]="editavel()" />
    } @else if (ninho.pronto()) {
      <section class="card">
        <h1>Canarinho não encontrado</h1>
        <p>Esse ninho não tem esse canarinho.</p>
        <a class="btn" routerLink="/">Voltar pro placar</a>
      </section>
    } @else {
      <p class="carregando">Chamando o canarinho...</p>
    }
  `,
  styles: `
    :host { display: grid; gap: 1.25rem; }
    .carregando { font-weight: 800; opacity: 0.75; }
    .figurinha { background: linear-gradient(180deg, var(--amarelo) 0, var(--amarelo) 7rem, var(--branco) 7rem); }
    .cabeca { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .cabeca > div { flex: 1; min-width: 8rem; }
    .cabeca h1 { margin: 0; }
    .apelido { margin: 0; font-weight: 800; }
    .avatar { font-size: 3.5rem; line-height: 1; background: var(--branco); border: 3px solid var(--tinta); border-radius: 50%; width: 5rem; height: 5rem; display: grid; place-items: center; box-shadow: 3px 3px 0 var(--tinta); }
    .mini { font-size: 1rem; padding: 0.2rem 0.7rem; text-decoration: none; display: inline-block; }
    .perfil { margin-top: 1rem; padding: 1rem; background: var(--papel); border: 3px dashed var(--tinta); border-radius: 0.75rem; }
    .avatares { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .avatar-opcao { font-size: 1.8rem; cursor: pointer; background: var(--branco); border: 3px solid var(--tinta); border-radius: 0.75rem; width: 3.2rem; height: 3.2rem; }
    .avatar-opcao.ativo { background: var(--amarelo); box-shadow: 3px 3px 0 var(--tinta); }
    .erro { background: #ffe3e3; border: 3px solid var(--vermelho); border-radius: 0.6rem; padding: 0.5rem 0.75rem; font-weight: 800; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-top: 1.25rem; }
    @media (min-width: 768px) { .stats { grid-template-columns: repeat(5, 1fr); } }
    .stat { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.1rem; background: var(--branco); border: 3px solid var(--tinta); border-radius: 0.75rem; padding: 0.7rem 0.4rem; box-shadow: 3px 3px 0 var(--tinta); }
    .stat .emoji { font-size: 1.6rem; }
    .stat .rotulo { font-weight: 800; font-size: 0.85rem; }
    .stat strong { font-family: var(--fonte-titulo); font-weight: 400; font-size: 1.5rem; letter-spacing: 1px; color: var(--azul); }
    .stat small { opacity: 0.65; font-weight: 700; }
    .filtros { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; }
    .chip { font: inherit; font-weight: 800; cursor: pointer; background: var(--branco); border: 3px solid var(--tinta); border-radius: 2rem; padding: 0.2rem 0.75rem; }
    .chip.ativo { background: var(--azul); color: var(--amarelo); }
  `,
})
export class Ficha {
  /** Vem da rota /canarinho/:uid. */
  readonly uid = input.required<string>();

  private readonly auth = inject(AuthService);
  protected readonly ninho = inject(Ninho);

  protected readonly avatares = AVATARES;
  protected readonly categorias = ORDEM_CATEGORIAS;
  protected readonly info = CATEGORIAS;

  protected readonly perfil = computed(
    () => this.ninho.canarinhos().find((c) => c.uid === this.uid())?.perfil,
  );
  protected readonly editavel = computed(() => this.uid() === this.auth.usuario()?.uid);
  protected readonly medidas = computed(() => this.ninho.medidasPorUid().get(this.uid()) ?? []);

  protected readonly erro = signal('');
  protected readonly editandoPerfil = signal(false);
  protected readonly apelido = signal('');
  protected readonly avatar = signal(AVATARES[0]);
  protected readonly graficoCat = signal<Categoria>('peso');

  protected readonly serie = computed<Serie[]>(() => [
    {
      nome: this.info[this.graficoCat()].rotulo,
      cor: '#1d4fa3',
      pontos: serieDe(this.medidas(), this.graficoCat()),
    },
  ]);

  protected readonly fmt = (v: number) => formatarCategoria(this.graficoCat(), v);

  protected readonly stats = computed(() => {
    const medidas = this.medidas();
    const linhas = ORDEM_TIPOS.map((tipo) => {
      const atual = valorAtual(medidas, tipo);
      return {
        rotulo: TIPOS[tipo].rotulo,
        emoji: TIPOS[tipo].emoji,
        valor: atual ? formatar(tipo, atual.valor) : '—',
        desde: atual ? `em ${dataBr(atual.data)}` : 'sem dados',
      };
    });
    const imc = imcAtual(medidas);
    // IMC entra logo depois da altura
    linhas.splice(2, 0, {
      rotulo: 'IMC',
      emoji: '🧮',
      valor: imc === undefined ? '—' : formatarImc(imc),
      desde: imc === undefined ? 'precisa de peso e altura' : 'calculado',
    });
    return linhas;
  });

  protected abrirPerfil() {
    this.apelido.set(this.perfil()?.apelido ?? '');
    this.avatar.set(this.perfil()?.avatar ?? AVATARES[0]);
    this.editandoPerfil.update((v) => !v);
  }

  protected async salvarPerfil() {
    try {
      await this.auth.salvarPerfil({
        nome: this.perfil()!.nome,
        apelido: this.apelido().trim(),
        avatar: this.avatar(),
      });
      this.editandoPerfil.set(false);
    } catch (e) {
      console.error(e);
      this.erro.set('Não consegui salvar o perfil.');
    }
  }
}
