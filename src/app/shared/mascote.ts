import { Component, DestroyRef, HostListener, inject, input, signal } from '@angular/core';

let proximo = 0;

// Canarinho Pistola de cara brava, em SVG próprio (as fotos do mascote são da CBF, não vão pro repo).
// Proporções do mascote de verdade: cabeça larga e quadradona de topo achatado com um cachinho de
// topete, uma ruga na testa, olhos pequenos e juntos espremidos por sobrancelhas em V, bico
// vermelho-laranja enorme com sorrisinho de canto, camisa amarela de gola redonda verde.
// Mexe: olhos seguem o ponteiro, rosto inclina, bico acompanha, pisca sozinho e, ao clicar,
// ele fica bravo (veia, estrelinhas e tremor).
@Component({
  selector: 'app-mascote',
  template: `
    <svg
      [attr.viewBox]="rosto() ? '0 8 240 199' : '0 0 240 262'"
      role="img"
      aria-label="Canarinho Pistola, o mascote de cara brava"
      [style.transform]="'rotate(' + inclina() + 'deg)'"
      [style.overflow]="rosto() ? 'hidden' : 'visible'"
    >
      <defs>
        <!-- mesmo gradiente (em coordenadas fixas) na cabeça e nas pálpebras: emenda invisível -->
        <radialGradient
          [attr.id]="id + 'g'"
          gradientUnits="userSpaceOnUse"
          cx="92"
          cy="70"
          r="170"
        >
          <stop offset="0" stop-color="#ffc83f" />
          <stop offset="0.6" stop-color="#fdb827" />
          <stop offset="1" stop-color="#ee9e12" />
        </radialGradient>
        <clipPath [attr.id]="id + 'h'"><path [attr.d]="cabeca" /></clipPath>
        <clipPath [attr.id]="id + 'e'"><ellipse cx="84" cy="112" rx="18" ry="17" /></clipPath>
        <clipPath [attr.id]="id + 'd'"><ellipse cx="156" cy="112" rx="18" ry="17" /></clipPath>
      </defs>

      <g class="tudo" [class.bravo]="bravo()">
        <!-- camisa -->
        <path
          d="M24 262C28 226 70 206 120 206s92 20 96 56z"
          fill="#ffd21f"
          stroke="#231709"
          stroke-width="6"
          stroke-linejoin="round"
        />
        <path
          d="M86 208Q120 238 154 208"
          fill="none"
          stroke="#009c3b"
          stroke-width="11"
          stroke-linecap="round"
        />
        <path
          d="M52 228h26v14c0 11-13 16-13 16s-13-5-13-16z"
          fill="#1d4fa3"
          stroke="#231709"
          stroke-width="3"
        />
        <path d="M65 231v24M55 240h20" stroke="#fff" stroke-width="4" />
        <text x="164" y="254" font-family="Bangers, sans-serif" font-size="32" fill="#009c3b">10</text>

        <!-- topete: um cachinho -->
        <path
          d="M100 52C92 32 112 14 132 22 146 30 142 48 126 46 114 46 112 34 122 32"
          fill="#fdb827"
          stroke="#231709"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- cabeça larga e quadradona -->
        <path [attr.d]="cabeca" [attr.fill]="'url(#' + id + 'g)'" />

        <!-- olhos pequenos e juntos: branco, íris (clipada, segue o ponteiro) e brilho -->
        <ellipse cx="84" cy="112" rx="18" ry="17" fill="#fff" />
        <ellipse cx="156" cy="112" rx="18" ry="17" fill="#fff" />
        <g [attr.clip-path]="'url(#' + id + 'e)'">
          <circle [attr.cx]="90 + dx() * 0.6" [attr.cy]="115 + dy() * 0.5" r="10.5" fill="#6b2a10" />
          <circle [attr.cx]="90 + dx() * 0.6" [attr.cy]="115 + dy() * 0.5" r="6.8" fill="#150b04" />
          <circle [attr.cx]="93 + dx() * 0.6" [attr.cy]="111.5 + dy() * 0.5" r="2.8" fill="#fff" />
        </g>
        <g [attr.clip-path]="'url(#' + id + 'd)'">
          <circle [attr.cx]="150 + dx() * 0.6" [attr.cy]="115 + dy() * 0.5" r="10.5" fill="#6b2a10" />
          <circle [attr.cx]="150 + dx() * 0.6" [attr.cy]="115 + dy() * 0.5" r="6.8" fill="#150b04" />
          <circle [attr.cx]="153 + dx() * 0.6" [attr.cy]="111.5 + dy() * 0.5" r="2.8" fill="#fff" />
        </g>
        <ellipse cx="84" cy="112" rx="18" ry="17" fill="none" stroke="#231709" stroke-width="4.5" />
        <ellipse cx="156" cy="112" rx="18" ry="17" fill="none" stroke="#231709" stroke-width="4.5" />

        @if (piscando()) {
          <ellipse cx="84" cy="112" rx="19" ry="18" [attr.fill]="'url(#' + id + 'g)'" stroke="#231709" stroke-width="4.5" />
          <ellipse cx="156" cy="112" rx="19" ry="18" [attr.fill]="'url(#' + id + 'g)'" stroke="#231709" stroke-width="4.5" />
        }

        <!-- sobrancelhas em V: a testa cobre o alto dos olhos e desce até o bico -->
        <g [attr.clip-path]="'url(#' + id + 'h)'">
          <path d="M38 87Q84 91 118 132L128 58 24 58z" [attr.fill]="'url(#' + id + 'g)'" />
          <path d="M202 87Q156 91 122 132L112 58 216 58z" [attr.fill]="'url(#' + id + 'g)'" />
        </g>
        <path d="M42 86Q84 90 118 132" fill="none" stroke="#231709" stroke-width="9" stroke-linecap="round" />
        <path d="M198 86Q156 90 122 132" fill="none" stroke="#231709" stroke-width="9" stroke-linecap="round" />
        <path d="M56 76Q90 76 112 102" fill="none" stroke="#c88410" stroke-width="3.5" stroke-linecap="round" opacity="0.7" />
        <path d="M184 76Q150 76 128 102" fill="none" stroke="#c88410" stroke-width="3.5" stroke-linecap="round" opacity="0.7" />

        <!-- ruga na testa e o v do meio -->
        <path d="M80 66Q120 53 160 66" fill="none" stroke="#8a5a00" stroke-width="4" stroke-linecap="round" opacity="0.85" />
        <path d="M114 94L120 102 126 94" fill="none" stroke="#231709" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M62 62Q74 56 88 58M152 58Q166 56 178 62" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.6" />

        <!-- contorno da cabeça por cima de tudo -->
        <path [attr.d]="cabeca" fill="none" stroke="#231709" stroke-width="6.5" stroke-linejoin="round" />

        <!-- bico enorme com sorrisinho de canto; acompanha o ponteiro de leve -->
        <g [attr.transform]="'translate(' + dx() * 0.3 + ' ' + dy() * 0.25 + ')'">
          <path d="M78 138C88 122 152 122 162 138 166 162 146 188 120 197 94 188 74 162 78 138z" fill="#f2541b" />
          <path d="M84 158Q120 184 156 158C152 178 140 189 120 197 100 189 88 178 84 158z" fill="#c93e10" />
          <path d="M84 158Q120 184 156 158" fill="none" stroke="#231709" stroke-width="5" stroke-linecap="round" />
          <path d="M78 138C88 122 152 122 162 138 166 162 146 188 120 197 94 188 74 162 78 138z" fill="none" stroke="#231709" stroke-width="6" stroke-linejoin="round" />
          <path d="M98 134Q110 127 126 129" fill="none" stroke="#ff9a6a" stroke-width="5" stroke-linecap="round" opacity="0.9" />
          <ellipse cx="106" cy="143" rx="2.6" ry="3.4" fill="#231709" />
          <ellipse cx="134" cy="143" rx="2.6" ry="3.4" fill="#231709" />
          <path d="M114 190L120 198 126 190" fill="none" stroke="#231709" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
        </g>

        @if (bravo()) {
          <g stroke="#d62828" stroke-width="4" stroke-linecap="round" fill="none" transform="translate(166 70)">
            <path d="M-11-3Q-3-3-3-11M11-3Q3-3 3-11M-11 3Q-3 3-3 11M11 3Q3 3 3 11" />
          </g>
          <g fill="#ffd21f" stroke="#231709" stroke-width="2.5" stroke-linejoin="round">
            <path transform="translate(198 46) scale(1.2)" [attr.d]="estrela" />
            <path transform="translate(220 78) scale(0.95)" [attr.d]="estrela" />
            <path transform="translate(22 56) scale(1)" [attr.d]="estrela" />
          </g>
        }
      </g>
    </svg>
  `,
  styles: `
    :host { display: block; cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; }
    svg { width: 100%; height: auto; display: block; transition: transform 0.25s ease-out; }
    .tudo { transform-box: fill-box; transform-origin: 50% 100%; }
    .bravo { animation: treme 0.4s ease-in-out 2; }
    @keyframes treme {
      0%, 100% { transform: rotate(0); }
      25% { transform: rotate(-4deg); }
      75% { transform: rotate(4deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .bravo { animation: none; }
      svg { transition: none; }
    }
  `,
})
export class Mascote {
  /** Só o rosto (sem a camisa): pro cabeçalho. */
  readonly rosto = input(false);

  protected readonly id = `mascote${proximo++}`;
  protected readonly dx = signal(0);
  protected readonly dy = signal(0);
  protected readonly inclina = signal(0);
  protected readonly piscando = signal(false);
  protected readonly bravo = signal(false);

  // larga e quadradona, de topo quase reto
  protected readonly cabeca =
    'M30 128C26 84 44 52 84 47c20-3 52-3 72 0 40 5 58 37 54 81-2 48-34 76-90 76S32 176 30 128z';
  protected readonly estrela =
    'M0-9L2.6-3 9-2.8 4 1.6 5.6 8 0 4.5-5.6 8-4 1.6-9-2.8-2.6-3z';

  constructor() {
    let timer: ReturnType<typeof setTimeout>;
    const piscar = () => {
      this.piscando.set(true);
      setTimeout(() => this.piscando.set(false), 140);
      timer = setTimeout(piscar, 2500 + Math.random() * 3500);
    };
    timer = setTimeout(piscar, 2000);
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  }

  @HostListener('window:pointermove', ['$event'])
  protected onMove(e: PointerEvent) {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    this.dx.set(Math.round(nx * 7));
    this.dy.set(Math.round(ny * 5));
    this.inclina.set(Math.round(nx * 4));
  }

  @HostListener('click')
  protected onClick() {
    this.bravo.set(true);
    setTimeout(() => this.bravo.set(false), 1000);
  }
}
