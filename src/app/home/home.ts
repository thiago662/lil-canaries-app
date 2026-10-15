import { Component } from '@angular/core';
import { Mascote } from '../shared/mascote';

@Component({
  imports: [Mascote],
  template: `
    <section class="card hero">
      <app-mascote class="hero-mascote" />
      <h1>Família Canarinho Pistola</h1>
      <p>O cercadinho da zueira tá sendo montado. Segura a pistola.</p>
    </section>
  `,
  styles: `
    .hero { text-align: center; max-width: 30rem; margin: 1.5rem auto; }
    .hero-mascote { width: min(60%, 14rem); margin: 0 auto 1rem; }
  `,
})
export class Home {}
