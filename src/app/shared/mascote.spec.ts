import { TestBed } from '@angular/core/testing';
import { Mascote } from './mascote';

describe('Mascote', () => {
  async function criar() {
    const fixture = TestBed.createComponent(Mascote);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const pupila = (el: HTMLElement) => el.querySelectorAll('circle')[0].getAttribute('cx');

  it('a pupila segue o ponteiro', async () => {
    const { fixture, el } = await criar();
    const parada = pupila(el);
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: window.innerWidth, clientY: 0 }));
    await fixture.whenStable();
    expect(Number(pupila(el))).toBeGreaterThan(Number(parada));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 0, clientY: 0 }));
    await fixture.whenStable();
    expect(Number(pupila(el))).toBeLessThan(Number(parada));
  });

  it('ao clicar ele fica bravo (veia e estrelas) e depois acalma', async () => {
    const { fixture, el } = await criar();
    expect(el.querySelector('.bravo')).toBeNull();
    el.click();
    await fixture.whenStable();
    expect(el.querySelector('.bravo')).not.toBeNull();
    expect(el.querySelectorAll('path[d^="M0-9"]')).toHaveLength(3); // as 3 estrelinhas
    await new Promise((r) => setTimeout(r, 1100)); // o tempo que ele leva pra acalmar
    await fixture.whenStable();
    expect(el.querySelector('.bravo')).toBeNull();
  });

  it('cada mascote tem ids próprios (vários na mesma página)', async () => {
    const a = await criar();
    const b = await criar();
    const ids = (el: HTMLElement) => [...el.querySelectorAll('[id]')].map((n) => n.id);
    expect(ids(a.el).some((id) => ids(b.el).includes(id))).toBe(false);
  });
});
