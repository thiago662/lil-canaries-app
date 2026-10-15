import { Component, HostListener, signal } from '@angular/core';

// Canarinho de cara brava em SVG próprio. Os olhos seguem o ponteiro.
@Component({
  selector: 'app-mascote',
  template: `
    <svg viewBox="0 0 200 200" role="img" aria-label="Canarinho Pistola de cara brava">
      <path d="M92 28c-6-14 8-22 16-14-2 6 4 8 8 4 4 8-6 16-24 10z" fill="#F5B800" stroke="#1B1B2F" stroke-width="5" stroke-linejoin="round" />
      <ellipse cx="100" cy="104" rx="84" ry="74" fill="#FFD21F" stroke="#1B1B2F" stroke-width="6" />
      <ellipse cx="62" cy="92" rx="22" ry="25" fill="#fff" stroke="#1B1B2F" stroke-width="5" />
      <ellipse cx="138" cy="92" rx="22" ry="25" fill="#fff" stroke="#1B1B2F" stroke-width="5" />
      <circle [attr.cx]="62 + dx()" [attr.cy]="94 + dy()" r="9" fill="#1B1B2F" />
      <circle [attr.cx]="138 + dx()" [attr.cy]="94 + dy()" r="9" fill="#1B1B2F" />
      <path d="M34 64l56 18" stroke="#1B1B2F" stroke-width="9" stroke-linecap="round" />
      <path d="M166 64l-56 18" stroke="#1B1B2F" stroke-width="9" stroke-linecap="round" />
      <path d="M72 118c0-10 56-10 56 0 0 14-14 30-28 30s-28-16-28-30z" fill="#F26B21" stroke="#1B1B2F" stroke-width="6" stroke-linejoin="round" />
    </svg>
  `,
  styles: `
    :host { display: block; }
    svg { width: 100%; height: auto; display: block; }
  `,
})
export class Mascote {
  protected readonly dx = signal(0);
  protected readonly dy = signal(0);

  @HostListener('window:pointermove', ['$event'])
  protected onMove(e: PointerEvent) {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    this.dx.set(Math.round(nx * 8));
    this.dy.set(Math.round(ny * 7));
  }
}
