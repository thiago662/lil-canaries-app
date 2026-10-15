import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MedidasService } from '../core/medidas.service';
import {
  dataBr,
  formatar,
  hoje,
  idMedida,
  Medida,
  ORDEM_TIPOS,
  TIPOS,
  TipoMedida,
  validar,
} from '../core/medidas';

// Formulário de novo checkpoint + lista editável (corrigir valor/data, apagar).
@Component({
  selector: 'app-checkpoints',
  imports: [FormsModule],
  template: `
    <section class="card">
      <h2>Novo checkpoint</h2>
      <form (ngSubmit)="adicionar()" class="form">
        <label class="campo">
          <span>O quê</span>
          <select name="tipo" [ngModel]="tipo()" (ngModelChange)="tipo.set($event)">
            @for (t of tipos; track t) {
              <option [value]="t">{{ info[t].emoji }} {{ info[t].rotulo }}</option>
            }
          </select>
        </label>
        <label class="campo">
          <span>Valor ({{ info[tipo()].unidade }})</span>
          <input
            type="number"
            name="valor"
            inputmode="decimal"
            required
            [min]="info[tipo()].min"
            [max]="info[tipo()].max"
            [step]="info[tipo()].passo"
            [ngModel]="valor()"
            (ngModelChange)="valor.set($event)"
          />
        </label>
        <label class="campo">
          <span>Data</span>
          <input
            type="date"
            name="data"
            required
            [ngModel]="data()"
            (ngModelChange)="data.set($event)"
          />
        </label>
        <button class="btn verde" type="submit" [disabled]="salvando()">Salvar</button>
      </form>
      @if (jaExiste()) {
        <p class="aviso">Já tem {{ info[tipo()].rotulo }} em {{ dataBr(data()) }}: salvar corrige esse valor.</p>
      }
      @if (erro()) {
        <p class="erro" role="alert">{{ erro() }}</p>
      }
    </section>

    <section class="card lista">
      <h2>Histórico</h2>
      <div class="filtros">
        <button class="chip" [class.ativo]="filtro() === 'todos'" (click)="filtro.set('todos')">Todos</button>
        @for (t of tipos; track t) {
          <button class="chip" [class.ativo]="filtro() === t" (click)="filtro.set(t)">
            {{ info[t].emoji }} {{ info[t].rotulo }}
          </button>
        }
      </div>
      @for (m of visiveis(); track m.id) {
        <div class="linha">
          @if (editando()?.id === m.id) {
            <div class="edicao">
              <span class="rotulo">{{ info[m.tipo].emoji }} {{ info[m.tipo].rotulo }}</span>
              <input
                type="date"
                aria-label="Data"
                [value]="editData()"
                (input)="editData.set($any($event.target).value)"
              />
              <input
                type="number"
                aria-label="Valor"
                inputmode="decimal"
                [step]="info[m.tipo].passo"
                [value]="editValor()"
                (input)="editValor.set($any($event.target).valueAsNumber)"
              />
              <button class="btn verde mini" (click)="salvarEdicao(m)" [disabled]="salvando()">Ok</button>
              <button class="btn mini" (click)="editando.set(null)">Cancelar</button>
            </div>
          } @else {
            <span class="data">{{ dataBr(m.data) }}</span>
            <span class="rotulo">{{ info[m.tipo].emoji }} {{ info[m.tipo].rotulo }}</span>
            <strong class="valor">{{ formatar(m.tipo, m.valor) }}</strong>
            @if (editavel()) {
              <span class="acoes">
                <button class="btn mini" (click)="comecarEdicao(m)" aria-label="Editar">✏️</button>
                <button class="btn mini" (click)="apagar(m)" aria-label="Apagar">🗑️</button>
              </span>
            }
          }
        </div>
      } @empty {
        <p class="vazio">Nenhum checkpoint ainda. Bota o primeiro aí em cima.</p>
      }
    </section>
  `,
  styles: `
    :host { display: grid; gap: 1.25rem; }
    .form { display: grid; gap: 0 1rem; grid-template-columns: 1fr; align-items: end; }
    .form .btn { margin-bottom: 0.9rem; }
    @media (min-width: 768px) { .form { grid-template-columns: 2fr 1.2fr 1.2fr auto; } }
    .aviso, .erro { border: 3px solid var(--tinta); border-radius: 0.6rem; padding: 0.5rem 0.75rem; font-weight: 800; margin: 0; }
    .aviso { background: #fff3bf; }
    .erro { background: #ffe3e3; border-color: var(--vermelho); }
    .filtros { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; }
    .chip { font: inherit; font-weight: 800; cursor: pointer; background: var(--branco); border: 3px solid var(--tinta); border-radius: 2rem; padding: 0.2rem 0.75rem; }
    .chip.ativo { background: var(--azul); color: var(--amarelo); }
    .linha { display: grid; grid-template-columns: auto 1fr auto; gap: 0.25rem 0.75rem; align-items: center; padding: 0.55rem 0; border-top: 2px dashed rgba(27, 27, 47, 0.25); }
    .data { font-weight: 800; opacity: 0.7; }
    .valor { text-align: right; }
    .acoes { grid-column: 1 / -1; display: flex; gap: 0.4rem; justify-content: flex-end; }
    .edicao { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .edicao input { font: inherit; padding: 0.35rem 0.5rem; border: 3px solid var(--tinta); border-radius: 0.5rem; width: 9rem; }
    .mini { font-size: 1rem; padding: 0.2rem 0.6rem; }
    .vazio { margin: 0; opacity: 0.7; }
    @media (min-width: 600px) {
      .linha { grid-template-columns: 7rem 1fr auto auto; }
      .acoes { grid-column: auto; }
    }
  `,
})
export class Checkpoints {
  readonly uid = input.required<string>();
  readonly medidas = input.required<Medida[]>();
  readonly editavel = input(true);

  private readonly servico = inject(MedidasService);

  protected readonly tipos = ORDEM_TIPOS;
  protected readonly info = TIPOS;
  protected readonly dataBr = dataBr;
  protected readonly formatar = formatar;

  protected readonly tipo = signal<TipoMedida>('peso');
  protected readonly valor = signal<number | null>(null);
  protected readonly data = signal(hoje());
  protected readonly filtro = signal<TipoMedida | 'todos'>('todos');
  protected readonly erro = signal('');
  protected readonly salvando = signal(false);

  protected readonly editando = signal<Medida | null>(null);
  protected readonly editData = signal('');
  protected readonly editValor = signal(NaN);

  protected readonly visiveis = computed(() =>
    this.medidas().filter((m) => this.filtro() === 'todos' || m.tipo === this.filtro()),
  );

  protected readonly jaExiste = computed(() =>
    this.medidas().some((m) => m.id === idMedida(this.tipo(), this.data())),
  );

  protected async adicionar() {
    const valor = Number(this.valor());
    const problema = this.valor() === null ? 'Falta o valor.' : validar(this.tipo(), valor, this.data());
    if (problema) return this.erro.set(problema);
    await this.gravar(() => this.servico.salvar(this.uid(), { tipo: this.tipo(), data: this.data(), valor }));
    this.valor.set(null);
  }

  protected comecarEdicao(m: Medida) {
    this.editando.set(m);
    this.editData.set(m.data);
    this.editValor.set(m.valor);
  }

  protected async salvarEdicao(m: Medida) {
    const problema = validar(m.tipo, this.editValor(), this.editData());
    if (problema) return this.erro.set(problema);
    await this.gravar(() =>
      this.servico.editar(this.uid(), m, { data: this.editData(), valor: this.editValor() }),
    );
    this.editando.set(null);
  }

  protected apagar(m: Medida) {
    if (!confirm(`Apagar ${TIPOS[m.tipo].rotulo} de ${dataBr(m.data)}?`)) return;
    return this.gravar(() => this.servico.apagar(this.uid(), m));
  }

  private async gravar(acao: () => Promise<unknown>) {
    this.erro.set('');
    this.salvando.set(true);
    try {
      await acao();
    } catch (e) {
      console.error(e);
      this.erro.set('Não consegui salvar. Tenta de novo.');
    } finally {
      this.salvando.set(false);
    }
  }
}
