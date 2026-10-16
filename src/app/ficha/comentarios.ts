import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { Comentario, MAX_COMENTARIO, quando, validarComentario } from '../core/comentarios';
import { ComentariosService } from '../core/comentarios.service';
import { Ninho } from '../core/ninho';

// Recados na ficha de um canarinho: qualquer canarinho escreve, só o autor apaga o próprio.
@Component({
  selector: 'app-comentarios',
  imports: [FormsModule],
  template: `
    <section class="card">
      <h2>💬 {{ proprio() ? 'Recados pra você' : 'Zueira na ficha do ' + nome() }}</h2>

      <form (ngSubmit)="enviar()" class="form">
        <label class="campo">
          <span>{{ proprio() ? 'Fala sozinho, ninguém te julga' : 'Deixa o seu recado' }}</span>
          <textarea
            name="texto"
            rows="2"
            [attr.maxlength]="limite"
            placeholder="Escreve aqui..."
            [ngModel]="texto()"
            (ngModelChange)="texto.set($event)"
          ></textarea>
        </label>
        <div class="rodape">
          <small [class.estourou]="texto().trim().length > limite">{{ texto().length }}/{{ limite }}</small>
          <button class="btn verde" type="submit" [disabled]="enviando()">Mandar</button>
        </div>
      </form>
      @if (erro()) {
        <p class="erro" role="alert">{{ erro() }}</p>
      }

      @for (c of lista(); track c.id) {
        <article class="recado">
          <header>
            <strong>{{ autor(c) }}</strong>
            <small>{{ quandoFoi(c) }}</small>
            @if (c.autorUid === meuUid()) {
              <button class="btn mini" (click)="apagar(c)" aria-label="Apagar recado">🗑️</button>
            }
          </header>
          <p>{{ c.texto }}</p>
        </article>
      } @empty {
        <p class="vazio">{{ carregou() ? 'Ninguém falou nada ainda. Quebra o gelo!' : 'Carregando recados...' }}</p>
      }
    </section>
  `,
  styles: `
    textarea { width: 100%; font: inherit; padding: 0.55rem 0.75rem; border: 3px solid var(--tinta); border-radius: 0.6rem; background: var(--branco); resize: vertical; }
    textarea:focus-visible { outline: 3px solid var(--azul); outline-offset: 2px; }
    .rodape { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.9rem; }
    .rodape small { font-weight: 700; opacity: 0.65; }
    .rodape small.estourou { color: var(--vermelho); opacity: 1; }
    .erro { background: #ffe3e3; border: 3px solid var(--vermelho); border-radius: 0.6rem; padding: 0.5rem 0.75rem; font-weight: 800; margin: 0 0 0.9rem; }
    .recado { border-top: 2px dashed rgba(27, 27, 47, 0.25); padding: 0.7rem 0; }
    .recado header { display: flex; align-items: center; gap: 0.6rem; }
    .recado header small { flex: 1; font-weight: 700; opacity: 0.6; }
    .recado p { margin: 0.25rem 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    .mini { font-size: 1rem; padding: 0.15rem 0.5rem; }
    .vazio { margin: 0; opacity: 0.7; }
  `,
})
export class Comentarios {
  /** De quem é a ficha. */
  readonly uid = input.required<string>();
  readonly nome = input.required<string>();
  readonly proprio = input(false);

  private readonly auth = inject(AuthService);
  private readonly ninho = inject(Ninho);
  private readonly servico = inject(ComentariosService);

  protected readonly limite = MAX_COMENTARIO;
  protected readonly lista = signal<Comentario[]>([]);
  protected readonly carregou = signal(false);
  protected readonly texto = signal('');
  protected readonly erro = signal('');
  protected readonly enviando = signal(false);
  protected readonly meuUid = computed(() => this.auth.usuario()?.uid);

  // pra "há 3 min" não ficar parado: reavalia a cada abertura de lista, o suficiente aqui
  protected quandoFoi(c: Comentario) {
    return quando(c.criadoEm);
  }

  constructor() {
    // um listener por ficha aberta; trocar de ficha troca o listener
    effect((onCleanup) => {
      this.lista.set([]);
      this.carregou.set(false);
      const parar = this.servico.observar(
        this.uid(),
        (l) => {
          this.lista.set(l);
          this.carregou.set(true);
        },
        (e) => {
          console.error(e);
          this.erro.set('Não consegui carregar os recados.');
        },
      );
      onCleanup(parar);
    });
  }

  protected autor(c: Comentario) {
    const x = this.ninho.canarinhos().find((k) => k.uid === c.autorUid);
    return x ? `${x.perfil.avatar} ${x.perfil.nome}` : 'alguém';
  }

  protected async enviar() {
    const v = validarComentario(this.texto());
    if ('erro' in v) return this.erro.set(v.erro);
    this.erro.set('');
    this.enviando.set(true);
    const digitado = this.texto();
    this.texto.set(''); // limpa já (o recado aparece antes da confirmação); volta se falhar
    try {
      await this.servico.comentar(this.uid(), this.meuUid()!, v.texto);
    } catch (e) {
      console.error(e);
      if (!this.texto()) this.texto.set(digitado);
      this.erro.set('Não consegui mandar o recado. Tenta de novo.');
    } finally {
      this.enviando.set(false);
    }
  }

  protected async apagar(c: Comentario) {
    if (!confirm('Apagar esse recado?')) return;
    try {
      await this.servico.apagar(this.uid(), c.id);
    } catch (e) {
      console.error(e);
      this.erro.set('Não consegui apagar.');
    }
  }
}
