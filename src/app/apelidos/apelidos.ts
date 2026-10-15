import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApelidosService } from '../core/apelidos.service';
import { Apelido, ehAlvo, limpar, serieApelidos, validarApelido } from '../core/apelidos';
import { AuthService } from '../core/auth.service';
import { dataBr, formatarApelidos, hoje } from '../core/medidas';
import { Ninho } from '../core/ninho';
import { Grafico, Serie } from '../shared/grafico';

@Component({
  imports: [FormsModule, Grafico],
  template: `
    <section class="card topo">
      <h1>Ⓜ️ Apelidos com M</h1>
      <p class="contagem">
        <strong>{{ alvoNome() }}</strong> já foi chamado de
        <strong class="numero">{{ formatarApelidos(apelidos().length) }}</strong>
      </p>
      <p class="sub">Só o {{ alvoNome() }} pontua. Todo o resto continua em 0.</p>
    </section>

    <section class="card">
      <h2>Lançar apelido novo</h2>
      <form (ngSubmit)="lancar()" class="form">
        <label class="campo">
          <span>Apelido (tem que começar com M)</span>
          <input
            name="texto"
            maxlength="30"
            autocomplete="off"
            placeholder="Ex.: Marmelo"
            [ngModel]="texto()"
            (ngModelChange)="texto.set($event)"
          />
        </label>
        <label class="campo">
          <span>Desde quando</span>
          <input type="date" name="data" required [ngModel]="data()" (ngModelChange)="data.set($event)" />
        </label>
        <button class="btn verde" type="submit" [disabled]="enviando()">Lançar</button>
      </form>
      @if (erro()) {
        <p class="erro" role="alert">{{ erro() }}</p>
      }
      @if (ok()) {
        <p class="ok" role="status">{{ ok() }}</p>
      }
    </section>

    <section class="card">
      <h2>Evolução</h2>
      <app-grafico [series]="serie()" [formato]="inteiro" />
    </section>

    <section class="card">
      <h2>Todos os apelidos</h2>
      @for (a of lista(); track a.id) {
        <div class="linha">
          <strong class="texto">{{ a.texto }}</strong>
          <span class="data">{{ dataBr(a.data) }}</span>
          <span class="autor">por {{ autor(a) }}</span>
          @if (a.autorUid === meuUid()) {
            <button class="btn mini" (click)="apagar(a)" aria-label="Apagar apelido">🗑️</button>
          }
        </div>
      } @empty {
        <p class="vazio">Nenhum apelido ainda. Quem vai inaugurar?</p>
      }
    </section>
  `,
  styles: `
    :host { display: grid; gap: 1.25rem; }
    .topo { background: var(--amarelo); }
    .topo h1 { margin: 0 0 0.25rem; }
    .contagem { margin: 0; font-size: 1.15rem; }
    .numero { font-family: var(--fonte-titulo); font-weight: 400; font-size: 1.6rem; letter-spacing: 1px; color: var(--azul); }
    .sub { margin: 0.25rem 0 0; font-weight: 700; opacity: 0.75; }
    .form { display: grid; gap: 0 1rem; grid-template-columns: 1fr; align-items: end; }
    .form .btn { margin-bottom: 0.9rem; }
    @media (min-width: 768px) { .form { grid-template-columns: 2fr 1fr auto; } }
    .erro, .ok { border: 3px solid var(--tinta); border-radius: 0.6rem; padding: 0.5rem 0.75rem; font-weight: 800; margin: 0; }
    .erro { background: #ffe3e3; border-color: var(--vermelho); }
    .ok { background: #dff5e3; border-color: var(--verde); }
    .linha { display: grid; grid-template-columns: 1fr auto; gap: 0.1rem 0.75rem; align-items: center; padding: 0.55rem 0; border-top: 2px dashed rgba(27, 27, 47, 0.25); }
    .data, .autor { font-size: 0.9rem; font-weight: 700; opacity: 0.7; }
    .linha .btn { grid-row: 1 / span 2; grid-column: 2; }
    .mini { font-size: 1rem; padding: 0.2rem 0.6rem; }
    .vazio { margin: 0; opacity: 0.7; }
    @media (min-width: 600px) {
      .linha { grid-template-columns: 1fr 7rem 12rem auto; }
      .linha .btn { grid-row: auto; grid-column: auto; }
    }
  `,
})
export class Apelidos {
  private readonly auth = inject(AuthService);
  private readonly ninho = inject(Ninho);
  private readonly servico = inject(ApelidosService);

  protected readonly dataBr = dataBr;
  protected readonly formatarApelidos = formatarApelidos;
  protected readonly inteiro = (v: number) => String(Math.round(v));

  protected readonly texto = signal('');
  protected readonly data = signal(hoje());
  protected readonly erro = signal('');
  protected readonly ok = signal('');
  protected readonly enviando = signal(false);

  protected readonly meuUid = computed(() => this.auth.usuario()?.uid);
  protected readonly apelidos = this.ninho.apelidos;

  protected readonly alvoNome = computed(
    () => this.ninho.canarinhos().find((c) => ehAlvo(c.perfil))?.perfil.nome ?? 'Marco',
  );

  /** Mais novos primeiro. */
  protected readonly lista = computed(() =>
    [...this.apelidos()].sort((a, b) => (a.data === b.data ? a.texto.localeCompare(b.texto) : a.data < b.data ? 1 : -1)),
  );

  protected readonly serie = computed<Serie[]>(() => [
    { nome: this.alvoNome(), cor: '#1d4fa3', pontos: serieApelidos(this.apelidos()) },
  ]);

  protected autor(a: Apelido) {
    const c = this.ninho.canarinhos().find((x) => x.uid === a.autorUid);
    return c ? `${c.perfil.avatar} ${c.perfil.nome}` : 'alguém';
  }

  protected async lancar() {
    this.ok.set('');
    const problema = validarApelido(this.texto(), this.apelidos());
    if (problema) return this.erro.set(problema);
    this.erro.set('');
    this.enviando.set(true);
    try {
      await this.servico.lancar(this.meuUid()!, this.texto(), this.data());
      this.ok.set(
        `"${limpar(this.texto())}" lançado! ${this.alvoNome()} agora tem ${formatarApelidos(this.apelidos().length)}.`,
      );
      this.texto.set('');
    } catch (e) {
      console.error(e);
      // a checagem local já pegou os repetidos antigos; aqui só cai quem lançou o mesmo agora
      this.erro.set('Não consegui lançar. Pode ser que alguém acabou de lançar esse mesmo.');
    } finally {
      this.enviando.set(false);
    }
  }

  protected apagar(a: Apelido) {
    if (!confirm(`Apagar "${a.texto}"? O número do ${this.alvoNome()} diminui.`)) return;
    return this.servico.apagar(a.id).catch((e) => {
      console.error(e);
      this.erro.set('Não consegui apagar.');
    });
  }
}
