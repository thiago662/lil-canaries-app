import { Component, input } from '@angular/core';
import type { Badge } from '../core/badges';

// Os títulos de um canarinho. `compacto` mostra só o emoji (no placar); o texto fica no tooltip.
@Component({
  selector: 'app-badges',
  template: `
    @for (b of badges(); track b.id) {
      <span class="badge" [class.compacto]="compacto()" [attr.title]="b.descricao" [attr.aria-label]="b.rotulo + ': ' + b.descricao" role="img">
        <span aria-hidden="true">{{ b.emoji }}</span>
        @if (!compacto()) {
          <span class="texto" aria-hidden="true">{{ b.rotulo }}</span>
        }
      </span>
    }
  `,
  styles: `
    :host { display: inline-flex; flex-wrap: wrap; gap: 0.3rem; align-items: center; }
    .badge { display: inline-flex; align-items: center; gap: 0.25rem; font-weight: 800; font-size: 0.8rem; background: var(--amarelo); border: 2px solid var(--tinta); border-radius: 2rem; padding: 0.05rem 0.55rem; box-shadow: 2px 2px 0 var(--tinta); cursor: help; white-space: nowrap; }
    .badge.compacto { padding: 0 0.3rem; font-size: 0.95rem; box-shadow: none; border-width: 0; background: transparent; }
  `,
})
export class Badges {
  readonly badges = input.required<Badge[]>();
  readonly compacto = input(false);
}
