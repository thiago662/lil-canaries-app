import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, AVATARES } from '../core/auth.service';
import {
  dataBr,
  formatar,
  formatarImc,
  imcAtual,
  Medida,
  ORDEM_TIPOS,
  TIPOS,
  valorAtual,
} from '../core/medidas';
import { MedidasService } from '../core/medidas.service';
import { Checkpoints } from './checkpoints';

// "Minha ficha": figurinha com os valores de hoje, perfil editável e os checkpoints.
@Component({
  imports: [FormsModule, Checkpoints],
  template: `
    <section class="card figurinha">
      <div class="cabeca">
        <span class="avatar" aria-hidden="true">{{ perfil()?.avatar }}</span>
        <div>
          <h1>{{ perfil()?.nome }}</h1>
          @if (perfil()?.apelido) {
            <p class="apelido">"{{ perfil()?.apelido }}"</p>
          }
        </div>
        <button class="btn mini" (click)="abrirPerfil()">✏️ Perfil</button>
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

    @if (uid(); as id) {
      <app-checkpoints [uid]="id" [medidas]="medidas()" />
    }
  `,
  styles: `
    :host { display: grid; gap: 1.25rem; }
    .figurinha { background: linear-gradient(180deg, var(--amarelo) 0, var(--amarelo) 7rem, var(--branco) 7rem); }
    .cabeca { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .cabeca > div { flex: 1; min-width: 8rem; }
    .cabeca h1 { margin: 0; }
    .apelido { margin: 0; font-weight: 800; }
    .avatar { font-size: 3.5rem; line-height: 1; background: var(--branco); border: 3px solid var(--tinta); border-radius: 50%; width: 5rem; height: 5rem; display: grid; place-items: center; box-shadow: 3px 3px 0 var(--tinta); }
    .mini { font-size: 1rem; padding: 0.2rem 0.7rem; }
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
  `,
})
export class Ficha {
  private readonly auth = inject(AuthService);
  private readonly servico = inject(MedidasService);

  protected readonly perfil = this.auth.perfil;
  protected readonly uid = computed(() => this.auth.usuario()?.uid);
  protected readonly avatares = AVATARES;

  protected readonly medidas = signal<Medida[]>([]);
  protected readonly erro = signal('');
  protected readonly editandoPerfil = signal(false);
  protected readonly apelido = signal('');
  protected readonly avatar = signal(AVATARES[0]);

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

  constructor() {
    const uid = this.uid();
    if (!uid) return;
    const parar = this.servico.observar(
      uid,
      (m) => this.medidas.set(m),
      (e) => {
        console.error(e);
        this.erro.set('Não consegui carregar os checkpoints.');
      },
    );
    inject(DestroyRef).onDestroy(parar);
  }

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
