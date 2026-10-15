import { TestBed } from '@angular/core/testing';
import { Home } from './home';

describe('Home', () => {
  it('mostra o nome da família', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      'Canarinho Pistola',
    );
  });
});
