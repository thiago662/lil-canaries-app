import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';

let proximo = 0;

// Canarinho Pistola, só a cabeça, em SVG próprio (as fotos do mascote são da CBF, não vão pro repo).
// Desenhado em cima das proporções do mascote: cúpula laranja com bochechas inchadas cuja borda de
// cima (uma diagonal) fecha o olho por baixo; sobrancelha única em asa de gaivota que desce em V
// até uma linha reta no bico; olhos em fenda com a íris preta enorme; bico pequeno em losango
// arredondado; topete amassado; contorno grosso escuro de adesivo.
// Mexe: íris seguem o ponteiro, rosto inclina, bico acompanha, pisca sozinho e, ao clicar,
// ele fica bravo (veia, estrelinhas e tremor).
@Component({
  selector: 'app-mascote',
  template: `
    <svg
      viewBox="165 95 810 815"
      role="img"
      aria-label="Canarinho Pistola, o mascote de cara brava"
      [style.transform]="'rotate(' + inclina() + 'deg)'"
    >
      <defs>
        <clipPath [attr.id]="id + 'h'"><path [attr.d]="cabeca" /></clipPath>
        <clipPath [attr.id]="id + 'e'">
          <ellipse cx="400" cy="600" rx="84" ry="72" transform="rotate(24 400 600)" />
        </clipPath>
        <clipPath [attr.id]="id + 'd'">
          <ellipse cx="690" cy="592" rx="84" ry="72" transform="rotate(-24 690 592)" />
        </clipPath>
        <linearGradient [attr.id]="id + 'c'" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f9a424" />
          <stop offset="1" stop-color="#fdb93d" />
        </linearGradient>
        <linearGradient [attr.id]="id + 'b'" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f4772f" />
          <stop offset="1" stop-color="#e65a19" />
        </linearGradient>
      </defs>

      <g class="tudo" [class.bravo]="bravo()">
        <!-- contorno grosso de adesivo -->
        <g fill="#3d3d3d" stroke="#3d3d3d" stroke-width="36" stroke-linejoin="round">
          <path [attr.d]="cabeca" />
          <path [attr.d]="topete" />
        </g>

        <!-- topete amassado -->
        <path [attr.d]="topete" fill="#f9a21b" stroke="#160d06" stroke-width="9" stroke-linejoin="round" />
        <path d="M520 170C536 178 546 192 541 208" fill="none" stroke="#160d06" stroke-width="7" stroke-linecap="round" />

        <!-- cabeça -->
        <path [attr.d]="cabeca" fill="#f7981d" />
        <g [attr.clip-path]="'url(#' + id + 'h)'">
          <ellipse cx="410" cy="330" rx="130" ry="64" transform="rotate(-28 410 330)" fill="#fff" opacity="0.16" />
          <path d="M800 290C860 350 892 440 882 560L830 560C846 450 816 365 760 312z" fill="#e0840e" opacity="0.4" />
        </g>

        <!-- olhos em fenda: branco, íris preta enorme (segue o ponteiro) e brilho -->
        <ellipse cx="400" cy="600" rx="84" ry="72" transform="rotate(24 400 600)" fill="#fff" stroke="#160d06" stroke-width="7" />
        <ellipse cx="690" cy="592" rx="84" ry="72" transform="rotate(-24 690 592)" fill="#fff" stroke="#160d06" stroke-width="7" />
        <g [attr.clip-path]="'url(#' + id + 'e)'">
          <circle [attr.cx]="410 + dx() * 2.2" [attr.cy]="622 + dy() * 2" r="60" fill="#43200f" />
          <circle [attr.cx]="410 + dx() * 2.2" [attr.cy]="622 + dy() * 2" r="43" fill="#0b0604" />
          <circle [attr.cx]="384 + dx() * 2.2" [attr.cy]="586 + dy() * 2" r="13" fill="#fff" />
        </g>
        <g [attr.clip-path]="'url(#' + id + 'd)'">
          <circle [attr.cx]="686 + dx() * 2.2" [attr.cy]="614 + dy() * 2" r="60" fill="#43200f" />
          <circle [attr.cx]="686 + dx() * 2.2" [attr.cy]="614 + dy() * 2" r="43" fill="#0b0604" />
          <circle [attr.cx]="708 + dx() * 2.2" [attr.cy]="578 + dy() * 2" r="13" fill="#fff" />
        </g>

        <!-- pálpebras diagonais descendo pro bico -->
        <path d="M300 480L330 526Q410 556 480 632L560 632L560 480z" fill="#f7981d" />
        <path d="M790 476L760 522Q680 552 610 628L530 628L530 476z" fill="#f7981d" />
        <path d="M330 526Q410 556 480 632" fill="none" stroke="#160d06" stroke-width="9" stroke-linecap="round" />
        <path d="M760 522Q680 552 610 628" fill="none" stroke="#160d06" stroke-width="9" stroke-linecap="round" />

        @if (piscando()) {
          <ellipse cx="400" cy="600" rx="88" ry="76" transform="rotate(24 400 600)" fill="#f7981d" stroke="#160d06" stroke-width="7" />
          <ellipse cx="690" cy="592" rx="88" ry="76" transform="rotate(-24 690 592)" fill="#f7981d" stroke="#160d06" stroke-width="7" />
        }

        <!-- bochechas inchadas: a borda de cima é a diagonal que fecha o olho por baixo -->
        <path
          d="M230 562C300 588 380 640 432 692L548 760 660 692C712 640 800 588 868 560 890 566 912 590 916 622 910 700 890 790 800 840 720 872 640 872 556 872 470 872 400 868 320 835 240 795 218 700 213 625 212 596 218 570 230 562z"
          [attr.fill]="'url(#' + id + 'c)'"
        />
        <g [attr.clip-path]="'url(#' + id + 'h)'" fill="none" stroke="#e98b14" stroke-width="30" stroke-linecap="round" opacity="0.32">
          <path d="M240 600C308 626 376 676 428 722" />
          <path d="M858 598C792 626 724 676 668 722" />
        </g>
        <path d="M230 562C300 588 380 640 432 692" fill="none" stroke="#160d06" stroke-width="9" stroke-linecap="round" />
        <path d="M868 560C800 588 712 640 660 692" fill="none" stroke="#160d06" stroke-width="9" stroke-linecap="round" />

        <!-- sobrancelha única em asa de gaivota: arco alto e descida em V até o centro -->
        <path
          d="M288 468C300 430 340 412 395 418 450 425 500 480 545 535L545 548C480 545 400 540 340 525 310 515 285 495 288 468z"
          fill="#f7981d"
          stroke="#160d06"
          stroke-width="9"
          stroke-linejoin="round"
        />
        <path
          d="M802 464C790 426 750 408 695 414 640 421 590 478 545 535L545 548C610 545 690 538 750 522 780 512 806 490 802 464z"
          fill="#f7981d"
          stroke="#160d06"
          stroke-width="9"
          stroke-linejoin="round"
        />
        <path d="M312 470C328 446 360 438 392 444" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="0.28" />
        <path d="M778 466C762 442 730 434 698 440" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="0.28" />
        <!-- linha reta do V até o bico -->
        <path d="M545 548L545 624" fill="none" stroke="#160d06" stroke-width="9" stroke-linecap="round" />

        <!-- contorno da cabeça -->
        <path [attr.d]="cabeca" fill="none" stroke="#160d06" stroke-width="10" stroke-linejoin="round" />

        <!-- bico pequeno em losango arredondado; acompanha o ponteiro de leve -->
        <g [attr.transform]="'translate(' + dx() * 1.2 + ' ' + dy() + ')'">
          <path
            d="M425 700C430 665 470 640 520 625 540 620 556 620 575 625 625 640 675 665 688 695 690 715 650 760 548 812 450 760 422 725 425 700z"
            [attr.fill]="'url(#' + id + 'b)'"
            stroke="#160d06"
            stroke-width="9"
            stroke-linejoin="round"
          />
          <path d="M452 738Q548 792 646 738" fill="none" stroke="#7a2f0c" stroke-width="7" stroke-linecap="round" />
          <path d="M470 750Q548 800 630 750" fill="none" stroke="#c24a16" stroke-width="6" stroke-linecap="round" />
          <path d="M478 666Q520 644 566 650" fill="none" stroke="#ffa070" stroke-width="10" stroke-linecap="round" opacity="0.75" />
          <ellipse cx="490" cy="677" rx="6" ry="9" transform="rotate(-20 490 677)" fill="#160d06" />
          <ellipse cx="606" cy="681" rx="6" ry="9" transform="rotate(20 606 681)" fill="#160d06" />
        </g>

        @if (bravo()) {
          <g stroke="#d62828" stroke-width="3.6" stroke-linecap="round" fill="none" transform="translate(738 340) scale(3.4)">
            <path d="M-11-3Q-3-3-3-11M11-3Q3-3 3-11M-11 3Q-3 3-3 11M11 3Q3 3 3 11" />
          </g>
          <g fill="#ffd21f" stroke="#160d06" stroke-width="2.2" stroke-linejoin="round">
            <path transform="translate(890 235) scale(4.2)" [attr.d]="estrela" />
            <path transform="translate(942 420) scale(3.4)" [attr.d]="estrela" />
            <path transform="translate(215 290) scale(3.6)" [attr.d]="estrela" />
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
  protected readonly id = `mascote${proximo++}`;
  protected readonly dx = signal(0);
  protected readonly dy = signal(0);
  protected readonly inclina = signal(0);
  protected readonly piscando = signal(false);
  protected readonly bravo = signal(false);

  // cúpula + bochechas inchadas, num só contorno
  protected readonly cabeca =
    'M213 625C208 585 222 560 246 545 236 440 262 340 340 270 410 212 500 200 560 202 640 202 730 225 800 290 860 350 892 440 882 548 908 565 920 590 916 622 910 700 890 790 800 840 720 872 640 872 556 872 470 872 400 868 320 835 240 795 218 700 213 625z';
  protected readonly topete =
    'M478 268C466 238 468 196 488 168 496 158 508 150 520 152 530 142 556 140 574 146 590 152 600 168 596 184 580 188 566 196 560 212 562 240 552 270 528 282 506 288 486 282 478 268z';
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
