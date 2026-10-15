import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { Ninho } from './core/ninho';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    inject(Ninho); // instancia: o ninho liga os listeners sozinho ao logar
  }

  protected async sair() {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
