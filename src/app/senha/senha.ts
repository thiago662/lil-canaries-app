import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { erroDeSenha, MIN_SENHA, validarNovaSenha } from '../core/senha';

@Component({
  imports: [FormsModule, RouterLink],
  template: `
    <section class="card tela">
      <h1>🔑 Trocar senha</h1>
      <p class="dica">
        Pra sua segurança, a gente confirma a senha atual antes. A nova precisa de pelo menos
        {{ minimo }} caracteres.
      </p>

      <form (ngSubmit)="trocar()">
        <label class="campo">
          <span>Senha atual</span>
          <input
            [type]="mostrar() ? 'text' : 'password'"
            name="atual"
            autocomplete="current-password"
            [ngModel]="atual()"
            (ngModelChange)="atual.set($event)"
          />
        </label>
        <label class="campo">
          <span>Senha nova</span>
          <input
            [type]="mostrar() ? 'text' : 'password'"
            name="nova"
            autocomplete="new-password"
            [ngModel]="nova()"
            (ngModelChange)="nova.set($event)"
          />
        </label>
        <label class="campo">
          <span>Repete a senha nova</span>
          <input
            [type]="mostrar() ? 'text' : 'password'"
            name="confirmacao"
            autocomplete="new-password"
            [ngModel]="confirmacao()"
            (ngModelChange)="confirmacao.set($event)"
          />
        </label>
        <label class="mostrar">
          <input type="checkbox" name="mostrar" [ngModel]="mostrar()" (ngModelChange)="mostrar.set($event)" />
          Mostrar as senhas
        </label>

        @if (erro()) {
          <p class="erro" role="alert">{{ erro() }}</p>
        }
        @if (ok()) {
          <p class="ok" role="status">{{ ok() }}</p>
        }

        <div class="acoes">
          <button class="btn verde" type="submit" [disabled]="enviando()">
            {{ enviando() ? 'Trocando...' : 'Trocar senha' }}
          </button>
          <a class="btn" routerLink="/">Voltar</a>
        </div>
      </form>
    </section>
  `,
  styles: `
    .tela { max-width: 28rem; margin: 1rem auto; }
    .dica { margin: 0 0 1rem; font-weight: 700; opacity: 0.75; }
    .mostrar { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; margin-bottom: 1rem; cursor: pointer; }
    .mostrar input { width: 1.2rem; height: 1.2rem; }
    .erro, .ok { border: 3px solid var(--tinta); border-radius: 0.6rem; padding: 0.5rem 0.75rem; font-weight: 800; margin: 0 0 1rem; }
    .erro { background: #ffe3e3; border-color: var(--vermelho); }
    .ok { background: #dff5e3; border-color: var(--verde); }
    .acoes { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .acoes a { text-decoration: none; display: inline-block; }
  `,
})
export class Senha {
  private readonly auth = inject(AuthService);

  protected readonly minimo = MIN_SENHA;
  protected readonly atual = signal('');
  protected readonly nova = signal('');
  protected readonly confirmacao = signal('');
  protected readonly mostrar = signal(false);
  protected readonly erro = signal('');
  protected readonly ok = signal('');
  protected readonly enviando = signal(false);

  protected async trocar() {
    this.ok.set('');
    const problema = validarNovaSenha(this.atual(), this.nova(), this.confirmacao());
    if (problema) return this.erro.set(problema);
    this.erro.set('');
    this.enviando.set(true);
    try {
      await this.auth.trocarSenha(this.atual(), this.nova());
      this.atual.set('');
      this.nova.set('');
      this.confirmacao.set('');
      this.ok.set('Senha trocada! Da próxima vez entra com a nova.');
    } catch (e) {
      console.error(e);
      this.erro.set(erroDeSenha(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
