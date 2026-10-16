import { MAX_COMENTARIO, quando, validarComentario } from './comentarios';

describe('comentarios', () => {
  it('validarComentario tira os espaços das pontas e devolve o texto', () => {
    expect(validarComentario('  tá magro, hein  ')).toEqual({ texto: 'tá magro, hein' });
  });

  it('rejeita vazio, só espaço e acima do limite', () => {
    expect(validarComentario('')).toEqual({ erro: 'Escreve alguma coisa antes.' });
    expect(validarComentario('   \n ')).toEqual({ erro: 'Escreve alguma coisa antes.' });
    const longo = validarComentario('x'.repeat(MAX_COMENTARIO + 1));
    expect('erro' in longo && longo.erro).toContain('Máximo de 200');
    expect(validarComentario('x'.repeat(MAX_COMENTARIO))).toEqual({ texto: 'x'.repeat(MAX_COMENTARIO) });
  });

  it('o limite conta o texto já sem os espaços das pontas', () => {
    expect('texto' in validarComentario(` ${'x'.repeat(MAX_COMENTARIO)} `)).toBe(true);
  });

  it('quando: minutos, horas e depois a data com hora', () => {
    const agora = new Date(2026, 9, 15, 14, 30);
    const atras = (min: number) => new Date(agora.getTime() - min * 60_000);
    expect(quando(atras(0), agora)).toBe('agora há pouco');
    expect(quando(atras(5), agora)).toBe('há 5 min');
    expect(quando(atras(59), agora)).toBe('há 59 min');
    expect(quando(atras(60), agora)).toBe('há 1 h');
    expect(quando(atras(3 * 60 + 20), agora)).toBe('há 3 h');
    expect(quando(new Date(2026, 9, 10, 9, 5), agora)).toBe('10/10/2026 09:05');
  });
});
