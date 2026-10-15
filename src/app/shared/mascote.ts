import { Component, DestroyRef, HostListener, inject, input, signal } from '@angular/core';

let proximo = 0;

// Canarinho Pistola de cara brava, em SVG próprio (a foto do mascote é da CBF, não vai pro repo).
// Traços do mascote de verdade: testa em coração com dobra em V até o bico, olhos grandes com a
// pálpebra cortada na diagonal, bico laranja caído, dois tufos e camisa amarela de gola verde.
// Mexe: olhos seguem o ponteiro, rosto inclina, bico acompanha, pisca sozinho e, ao clicar,
// ele fica bravo (veia, estrelinhas e tremor).
@Component({
  selector: 'app-mascote',
  template: `
    <svg
      [attr.viewBox]="rosto() ? '0 8 240 200' : '0 0 240 262'"
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
          cy="66"
          r="170"
        >
          <stop offset="0" stop-color="#ffcb2b" />
          <stop offset="0.65" stop-color="#f7b500" />
          <stop offset="1" stop-color="#df9700" />
        </radialGradient>
        <clipPath [attr.id]="id + 'h'"><path [attr.d]="cabeca" /></clipPath>
        <clipPath [attr.id]="id + 'e'"><ellipse cx="72" cy="122" rx="27" ry="25" /></clipPath>
        <clipPath [attr.id]="id + 'd'"><ellipse cx="168" cy="122" rx="27" ry="25" /></clipPath>
      </defs>

      <g class="tudo" [class.bravo]="bravo()">
        <!-- camisa -->
        <path
          d="M26 262C30 224 72 204 120 204s90 20 94 58z"
          fill="#f2c300"
          stroke="#2b1a06"
          stroke-width="6"
          stroke-linejoin="round"
        />
        <path
          d="M88 208l32 32 32-32"
          fill="none"
          stroke="#009c3b"
          stroke-width="9"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M56 226h26v14c0 11-13 16-13 16s-13-5-13-16z"
          fill="#1d4fa3"
          stroke="#2b1a06"
          stroke-width="3"
        />
        <path d="M69 229v24M59 238h20" stroke="#fff" stroke-width="4" />
        <text x="164" y="252" font-family="Bangers, sans-serif" font-size="32" fill="#009c3b">10</text>

        <!-- tufos -->
        <path
          d="M106 54C96 36 102 16 122 14c-6 10-2 22 6 40z"
          fill="#f5b800"
          stroke="#2b1a06"
          stroke-width="5"
          stroke-linejoin="round"
        />
        <path
          d="M124 54c0-16 14-28 28-24-8 6-8 14-6 26z"
          fill="#f5b800"
          stroke="#2b1a06"
          stroke-width="5"
          stroke-linejoin="round"
        />

        <!-- cabeça -->
        <path [attr.d]="cabeca" [attr.fill]="'url(#' + id + 'g)'" />
        <ellipse cx="46" cy="154" rx="17" ry="11" fill="#ff8a2a" opacity="0.3" />
        <ellipse cx="194" cy="154" rx="17" ry="11" fill="#ff8a2a" opacity="0.3" />

        <!-- olhos: branco, íris (clipada, segue o ponteiro) e brilho -->
        <ellipse cx="72" cy="122" rx="27" ry="25" fill="#fff" />
        <ellipse cx="168" cy="122" rx="27" ry="25" fill="#fff" />
        <g [attr.clip-path]="'url(#' + id + 'e)'">
          <circle [attr.cx]="79 + dx()" [attr.cy]="125 + dy()" r="15" fill="#6b2a10" />
          <circle [attr.cx]="79 + dx()" [attr.cy]="125 + dy()" r="9.5" fill="#150b04" />
          <circle [attr.cx]="84 + dx()" [attr.cy]="119 + dy()" r="4" fill="#fff" />
        </g>
        <g [attr.clip-path]="'url(#' + id + 'd)'">
          <circle [attr.cx]="161 + dx()" [attr.cy]="125 + dy()" r="15" fill="#6b2a10" />
          <circle [attr.cx]="161 + dx()" [attr.cy]="125 + dy()" r="9.5" fill="#150b04" />
          <circle [attr.cx]="166 + dx()" [attr.cy]="119 + dy()" r="4" fill="#fff" />
        </g>
        <ellipse cx="72" cy="122" rx="27" ry="25" fill="none" stroke="#2b1a06" stroke-width="5" />
        <ellipse cx="168" cy="122" rx="27" ry="25" fill="none" stroke="#2b1a06" stroke-width="5" />

        @if (piscando()) {
          <ellipse cx="72" cy="122" rx="28" ry="26" [attr.fill]="'url(#' + id + 'g)'" stroke="#2b1a06" stroke-width="5" />
          <ellipse cx="168" cy="122" rx="28" ry="26" [attr.fill]="'url(#' + id + 'g)'" stroke="#2b1a06" stroke-width="5" />
        }

        <!-- pálpebras pesadas (a testa cobre o alto dos olhos, mais fundo perto do bico) -->
        <g [attr.clip-path]="'url(#' + id + 'h)'">
          <path d="M30 88Q74 92 116 124L122 56 24 56z" [attr.fill]="'url(#' + id + 'g)'" />
          <path d="M210 88Q166 92 124 124L118 56 216 56z" [attr.fill]="'url(#' + id + 'g)'" />
        </g>
        <path d="M32 88Q74 92 116 124" fill="none" stroke="#2b1a06" stroke-width="8" stroke-linecap="round" />
        <path d="M208 88Q166 92 124 124" fill="none" stroke="#2b1a06" stroke-width="8" stroke-linecap="round" />
        <path d="M44 72Q82 70 110 100" fill="none" stroke="#b97b00" stroke-width="4" stroke-linecap="round" opacity="0.6" />
        <path d="M196 72Q158 70 130 100" fill="none" stroke="#b97b00" stroke-width="4" stroke-linecap="round" opacity="0.6" />
        <!-- dobra em V da testa -->
        <path d="M120 56C123 80 118 100 120 128" fill="none" stroke="#b97b00" stroke-width="5" stroke-linecap="round" />

        <!-- brilhos -->
        <path d="M64 68Q80 60 94 64" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.85" />
        <path d="M146 64Q160 60 176 68" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.85" />
        <path d="M40 142Q44 134 52 132" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.8" />

        <!-- contorno da cabeça por cima de tudo -->
        <path [attr.d]="cabeca" fill="none" stroke="#2b1a06" stroke-width="6" stroke-linejoin="round" />

        <!-- bico grande e caído; acompanha o ponteiro de leve -->
        <g [attr.transform]="'translate(' + dx() * 0.35 + ' ' + dy() * 0.3 + ')'">
          <path
            d="M76 144C84 126 156 126 164 144 166 164 146 188 120 201 94 188 74 164 76 144z"
            fill="#ff7a1f"
            stroke="#2b1a06"
            stroke-width="6"
            stroke-linejoin="round"
          />
          <path d="M94 176Q120 168 146 176 134 194 120 201 106 194 94 176z" fill="#e85d10" />
          <path d="M88 171Q120 163 152 171" fill="none" stroke="#2b1a06" stroke-width="4.5" stroke-linecap="round" />
          <path d="M98 142Q112 135 128 138" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.85" />
          <ellipse cx="107" cy="152" rx="2.5" ry="3.5" fill="#2b1a06" />
          <ellipse cx="133" cy="152" rx="2.5" ry="3.5" fill="#2b1a06" />
        </g>

        @if (bravo()) {
          <g stroke="#d62828" stroke-width="4" stroke-linecap="round" fill="none" transform="translate(150 66)">
            <path d="M-11-3Q-3-3-3-11M11-3Q3-3 3-11M-11 3Q-3 3-3 11M11 3Q3 3 3 11" />
          </g>
          <g fill="#ffd21f" stroke="#2b1a06" stroke-width="2.5" stroke-linejoin="round">
            <path transform="translate(198 46) scale(1.2)" [attr.d]="estrela" />
            <path transform="translate(218 76) scale(0.95)" [attr.d]="estrela" />
            <path transform="translate(24 52) scale(1)" [attr.d]="estrela" />
          </g>
        }
      </g>
    </svg>
  `,
  styles: `
    :host { display: block; cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; }
    svg { width: 100%; height: auto; display: block; overflow: visible; transition: transform 0.25s ease-out; }
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

  // coração: dois montes na testa e um vale no meio
  protected readonly cabeca =
    'M28 128C22 86 44 54 78 44c18-6 34 0 42 10 8-10 24-16 42-10 34 10 56 42 50 84-4 48-44 78-92 78S32 176 28 128z';
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
