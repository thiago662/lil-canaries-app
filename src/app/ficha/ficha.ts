import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, AVATARES } from '../core/auth.service';
import {
  Categoria,
  CATEGORIAS,
  dataBr,
  formatar,
  formatarApelidos,
  formatarCategoria,
  formatarImc,
  hoje,
  imcAtual,
  ORDEM_CATEGORIAS,
  ORDEM_TIPOS,
  TIPOS,
  TipoMedida,
  validar,
  valorAtual,
} from '../core/medidas';
import { diasAte, seriePlanejada, statusMeta } from '../core/metas';
import { MetasService } from '../core/metas.service';
import { Ninho } from '../core/ninho';
import { serieCanarinho } from '../core/placar';
import { Badges } from '../shared/badges';
import { Grafico, Serie } from '../shared/grafico';
import { Checkpoints } from './checkpoints';

// Ficha de um canarinho: figurinha com os valores de hoje, gráfico e checkpoints.
// A própria ficha é editável; a dos outros é só leitura.
@Component({
  imports: [FormsModule, RouterLink, Checkpoints, Grafico, Badges],
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
            @if (badges().length) {
              <app-badges class="badges" [badges]="badges()" />
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
        <app-grafico [series]="serie()" [formato]="fmt" [legenda]="!!metaAtual()" />

        @if (metaTipo(); as tipo) {
          @if (statusTexto(); as texto) {
            <p class="meta-status" [class.batida]="status()?.batida">{{ texto }}</p>
          }
          @if (editavel()) {
            <form class="meta" (ngSubmit)="salvarMeta()">
              <label class="campo">
                <span>Meta de {{ info[tipo].rotulo }} ({{ tipos[tipo].unidade }})</span>
                <input
                  type="number"
                  name="metaValor"
                  inputmode="decimal"
                  [step]="tipos[tipo].passo"
                  [ngModel]="metaValor()"
                  (ngModelChange)="metaValor.set($event)"
                />
              </label>
              <label class="campo">
                <span>Até quando (opcional)</span>
                <input type="date" name="metaData" [ngModel]="metaData()" (ngModelChange)="metaData.set($event)" />
              </label>
              <button class="btn verde" type="submit">{{ metaAtual() ? 'Atualizar meta' : 'Definir meta' }}</button>
              @if (metaAtual()) {
                <button class="btn" type="button" (click)="removerMeta()">Remover</button>
              }
            </form>
            @if (erroMeta()) {
              <p class="erro" role="alert">{{ erroMeta() }}</p>
            }
          }
        }
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
    .badges { margin-top: 0.4rem; }
    .avatar { font-size: 3.5rem; line-height: 1; background: var(--branco); border: 3px solid var(--tinta); border-radius: 50%; width: 5rem; height: 5rem; display: grid; place-items: center; box-shadow: 3px 3px 0 var(--tinta); }
    .mini { font-size: 1rem; padding: 0.2rem 0.7rem; text-decoration: none; display: inline-block; }
    .perfil { margin-top: 1rem; padding: 1rem; background: var(--papel); border: 3px dashed var(--tinta); border-radius: 0.75rem; }
    .avatares { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .avatar-opcao { font-size: 1.8rem; cursor: pointer; background: var(--branco); border: 3px solid var(--tinta); border-radius: 0.75rem; width: 3.2rem; height: 3.2rem; }
    .avatar-opcao.ativo { background: var(--amarelo); box-shadow: 3px 3px 0 var(--tinta); }
    .erro { background: #ffe3e3; border: 3px solid var(--vermelho); border-radius: 0.6rem; padding: 0.5rem 0.75rem; font-weight: 800; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-top: 1.25rem; }
    @media (min-width: 768px) { .stats { grid-template-columns: repeat(3, 1fr); } }
    .stat { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.1rem; background: var(--branco); border: 3px solid var(--tinta); border-radius: 0.75rem; padding: 0.7rem 0.4rem; box-shadow: 3px 3px 0 var(--tinta); }
    .stat .emoji { font-size: 1.6rem; }
    .stat .rotulo { font-weight: 800; font-size: 0.85rem; }
    .stat strong { font-family: var(--fonte-titulo); font-weight: 400; font-size: 1.5rem; letter-spacing: 1px; color: var(--azul); text-wrap: balance; }
    .stat small { opacity: 0.65; font-weight: 700; }
    .filtros { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; }
    .chip { font: inherit; font-weight: 800; cursor: pointer; background: var(--branco); border: 3px solid var(--tinta); border-radius: 2rem; padding: 0.2rem 0.75rem; }
    .chip.ativo { background: var(--azul); color: var(--amarelo); }
    .meta-status { margin: 0.75rem 0 0; padding: 0.5rem 0.75rem; font-weight: 800; background: #fff3bf; border: 3px solid var(--tinta); border-radius: 0.6rem; }
    .meta-status.batida { background: #dff5e3; border-color: var(--verde); }
    .meta { display: grid; gap: 0 1rem; grid-template-columns: 1fr; align-items: end; margin-top: 1rem; }
    .meta .btn { margin-bottom: 0.9rem; }
    @media (min-width: 768px) { .meta { grid-template-columns: 2fr 2fr auto auto; } }
  `,
})
export class Ficha {
  /** Vem da rota /canarinho/:uid. */
  readonly uid = input.required<string>();

  private readonly auth = inject(AuthService);
  private readonly metas = inject(MetasService);
  protected readonly ninho = inject(Ninho);
  protected readonly tipos = TIPOS;

  protected readonly avatares = AVATARES;
  protected readonly categorias = ORDEM_CATEGORIAS;
  protected readonly info = CATEGORIAS;

  protected readonly perfil = computed(
    () => this.ninho.canarinhos().find((c) => c.uid === this.uid())?.perfil,
  );
  protected readonly editavel = computed(() => this.uid() === this.auth.usuario()?.uid);
  protected readonly medidas = computed(() => this.ninho.medidasPorUid().get(this.uid()) ?? []);
  protected readonly badges = computed(() => this.ninho.badgesPorUid().get(this.uid()) ?? []);

  protected readonly erro = signal('');
  protected readonly editandoPerfil = signal(false);
  protected readonly apelido = signal('');
  protected readonly avatar = signal(AVATARES[0]);
  protected readonly graficoCat = signal<Categoria>('peso');

  /** Série de uma categoria deste canarinho (apelidos só têm pontos pro Marco). */
  private serieDe(cat: Categoria) {
    const perfil = this.perfil();
    return perfil
      ? serieCanarinho({ uid: this.uid(), perfil }, this.medidas(), cat, this.ninho.apelidos())
      : [];
  }

  protected readonly fmt = (v: number) => formatarCategoria(this.graficoCat(), v);

  // ---- meta (só as categorias que são checkpoints; IMC e apelidos são derivados)
  protected readonly metaTipo = computed<TipoMedida | null>(() => {
    const cat = this.graficoCat();
    return cat in TIPOS ? (cat as TipoMedida) : null;
  });

  // `equal` por valor: um snapshot de metas alheias não deve apagar o que a pessoa está digitando
  protected readonly metaAtual = computed(
    () => {
      const tipo = this.metaTipo();
      return tipo
        ? this.ninho.metas().find((m) => m.uid === this.uid() && m.tipo === tipo)
        : undefined;
    },
    { equal: (a, b) => a?.tipo === b?.tipo && a?.valor === b?.valor && a?.data === b?.data },
  );

  protected readonly metaValor = signal<number | null>(null);
  protected readonly metaData = signal('');
  protected readonly erroMeta = signal('');

  protected readonly status = computed(() => {
    const meta = this.metaAtual();
    return meta ? statusMeta(this.serieDe(this.graficoCat()), meta) : undefined;
  });

  protected readonly statusTexto = computed(() => {
    const meta = this.metaAtual();
    if (!meta) return '';
    const alvo = this.fmt(meta.valor);
    const s = this.status();
    if (!s) return `Meta de ${alvo}. Sem checkpoints ainda pra comparar.`;
    if (s.batida) return `🎯 Meta batida! Tá em ${this.fmt(s.atual)} (meta ${alvo}).`;
    let texto = `Falta ${this.fmt(Math.abs(s.falta))} ${s.falta < 0 ? 'pra descer' : 'pra subir'} até ${alvo}`;
    if (meta.data) {
      const d = diasAte(meta.data);
      texto +=
        d > 0
          ? ` · sobram ${d} ${d === 1 ? 'dia' : 'dias'}`
          : d === 0
            ? ' · o prazo é hoje!'
            : ` · o prazo estourou há ${-d} ${-d === 1 ? 'dia' : 'dias'} 💀`;
    }
    return `${texto}.`;
  });

  protected readonly serie = computed<Serie[]>(() => {
    const real = this.serieDe(this.graficoCat());
    const meta = this.metaAtual();
    const lista: Serie[] = [
      { nome: meta ? 'Real' : this.info[this.graficoCat()].rotulo, cor: '#1d4fa3', pontos: real },
    ];
    if (meta) {
      lista.push({ nome: 'Planejado', cor: '#f26b21', pontos: seriePlanejada(real, meta), semPontos: true });
    }
    return lista;
  });

  constructor() {
    effect(() => {
      const meta = this.metaAtual();
      this.metaValor.set(meta?.valor ?? null);
      this.metaData.set(meta?.data ?? '');
      this.erroMeta.set('');
    });
  }

  protected async salvarMeta() {
    const tipo = this.metaTipo();
    if (!tipo) return;
    const valor = this.metaValor();
    if (valor === null || valor === undefined || `${valor}` === '') {
      return this.erroMeta.set('Falta o valor da meta.');
    }
    const data = this.metaData();
    const problema = validar(tipo, Number(valor), data || hoje());
    if (problema) return this.erroMeta.set(problema);
    this.erroMeta.set('');
    try {
      await this.metas.salvar(this.uid(), { tipo, valor: Number(valor), data: data || undefined });
    } catch (e) {
      console.error(e);
      this.erroMeta.set('Não consegui salvar a meta.');
    }
  }

  protected async removerMeta() {
    const tipo = this.metaTipo();
    if (!tipo || !confirm(`Remover a meta de ${TIPOS[tipo].rotulo}?`)) return;
    try {
      await this.metas.remover(this.uid(), tipo);
    } catch (e) {
      console.error(e);
      this.erroMeta.set('Não consegui remover a meta.');
    }
  }

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
    const apelidos = this.serieDe('apelidos').at(-1);
    linhas.push({
      rotulo: this.info.apelidos.rotulo,
      emoji: this.info.apelidos.emoji,
      valor: formatarApelidos(apelidos?.valor ?? 0),
      desde: apelidos ? `desde ${dataBr(this.serieDe('apelidos')[0].data)}` : 'ficha limpa',
    });
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
