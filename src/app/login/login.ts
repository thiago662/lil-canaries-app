import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, SemPerfilError } from '../core/auth.service';
import { Mascote } from '../shared/mascote';

const ERROS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha errados.',
  'auth/wrong-password': 'E-mail ou senha errados.', // emulador
  'auth/user-not-found': 'E-mail ou senha errados.', // emulador
  'auth/invalid-email': 'E-mail inválido.',
  'auth/too-many-requests': 'Muita tentativa errada. Espera um pouco e tenta de novo.',
  'auth/network-request-failed': 'Sem conexão. Confere a internet.',
};

@Component({
  imports: [FormsModule, Mascote],
  template: `
    <section class="card login">
      <app-mascote class="mascote" />
      <h1>Entrar no ninho</h1>
      <form (ngSubmit)="entrar()">
        <label class="campo">
          <span>E-mail</span>
          <input
            type="email"
            name="email"
            autocomplete="username"
            required
            [ngModel]="email()"
            (ngModelChange)="email.set($event)"
          />
        </label>
        <label class="campo">
          <span>Senha</span>
          <input
            type="password"
            name="senha"
            autocomplete="current-password"
            required
            [ngModel]="senha()"
            (ngModelChange)="senha.set($event)"
          />
        </label>
        @if (erro()) {
          <p class="erro" role="alert">{{ erro() }}</p>
        }
        <button class="btn azul" type="submit" [disabled]="enviando()">
          {{ enviando() ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </section>
  `,
  styles: `
    .login { max-width: 24rem; margin: 1rem auto; }
    .mascote { width: 10rem; margin: 0 auto 0.75rem; }
    h1 { text-align: center; }
    .btn { width: 100%; }
    .erro {
      background: #ffe3e3;
      border: 3px solid var(--vermelho);
      border-radius: 0.6rem;
      padding: 0.5rem 0.75rem;
      font-weight: 800;
    }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly senha = signal('');
  protected readonly erro = signal('');
  protected readonly enviando = signal(false);

  protected async entrar() {
    this.erro.set('');
    this.enviando.set(true);
    try {
      await this.auth.login(this.email().trim(), this.senha());
      await this.router.navigateByUrl('/');
    } catch (e) {
      this.erro.set(
        e instanceof SemPerfilError
          ? 'Essa conta ainda não foi convidada pro ninho.'
          : (ERROS[(e as { code?: string }).code ?? ''] ?? 'Não deu pra entrar. Tenta de novo.'),
      );
    } finally {
      this.enviando.set(false);
    }
  }
}
