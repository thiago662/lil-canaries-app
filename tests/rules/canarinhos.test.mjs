import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const perfil = { nome: 'Thiago', apelido: '', avatar: '🐤' };
const medida = { tipo: 'peso', data: '2026-10-15', valor: 81 };

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

after(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'canarinhos/thiago'), perfil);
    await setDoc(doc(db, 'canarinhos/igor'), { ...perfil, nome: 'Igor' });
    await setDoc(doc(db, 'canarinhos/thiago/medidas/peso_2026-10-15'), medida);
  });
});

const como = (uid) => env.authenticatedContext(uid).firestore();

describe('leitura', () => {
  it('nega sem login', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'canarinhos/thiago')));
  });

  it('nega logado sem perfil (conta criada via API)', async () => {
    await assertFails(getDoc(doc(como('intruso'), 'canarinhos/thiago')));
    await assertFails(getDoc(doc(como('intruso'), 'canarinhos/thiago/medidas/peso_2026-10-15')));
  });

  it('canarinho lê perfil e medidas de outro', async () => {
    await assertSucceeds(getDoc(doc(como('igor'), 'canarinhos/thiago')));
    await assertSucceeds(getDoc(doc(como('igor'), 'canarinhos/thiago/medidas/peso_2026-10-15')));
  });
});

describe('perfil', () => {
  it('dono edita o próprio', async () => {
    await assertSucceeds(updateDoc(doc(como('thiago'), 'canarinhos/thiago'), { apelido: 'Pistola' }));
  });

  it('outro não edita', async () => {
    await assertFails(updateDoc(doc(como('igor'), 'canarinhos/thiago'), { apelido: 'hack' }));
  });

  it('campo extra ou valor inválido é negado', async () => {
    const ref = doc(como('thiago'), 'canarinhos/thiago');
    await assertFails(updateDoc(ref, { admin: true }));
    await assertFails(updateDoc(ref, { nome: '' }));
    await assertFails(updateDoc(ref, { apelido: 'x'.repeat(31) }));
  });

  it('cliente não cria nem apaga perfil', async () => {
    await assertFails(setDoc(doc(como('intruso'), 'canarinhos/intruso'), perfil));
    await assertFails(deleteDoc(doc(como('thiago'), 'canarinhos/thiago')));
  });
});

describe('medidas', () => {
  const ref = (uid, id) => doc(como(uid), `canarinhos/thiago/medidas/${id}`);

  it('dono cria e corrige o valor do checkpoint', async () => {
    await assertSucceeds(setDoc(ref('thiago', 'altura_2026-01-01'), { tipo: 'altura', data: '2026-01-01', valor: 180 }));
    await assertSucceeds(setDoc(ref('thiago', 'peso_2026-10-15'), { ...medida, valor: 79 }));
  });

  it('outro canarinho não escreve nem apaga', async () => {
    await assertFails(setDoc(ref('igor', 'peso_2026-10-16'), { ...medida, data: '2026-10-16' }));
    await assertFails(deleteDoc(ref('igor', 'peso_2026-10-15')));
  });

  it('dono apaga o próprio', async () => {
    await assertSucceeds(deleteDoc(ref('thiago', 'peso_2026-10-15')));
  });

  it('id tem que ser tipo_data', async () => {
    await assertFails(setDoc(ref('thiago', 'qualquer'), medida));
    await assertFails(setDoc(ref('thiago', 'peso_2026-10-14'), medida));
  });

  it('valor fora da faixa, data ruim ou campo extra são negados', async () => {
    await assertFails(setDoc(ref('thiago', 'peso_2026-10-15'), { ...medida, valor: 5 }));
    await assertFails(setDoc(ref('thiago', 'peso_2026-10-15'), { ...medida, valor: '81' }));
    await assertFails(setDoc(ref('thiago', 'peso_2026-13-40'), { ...medida, data: '2026-13-40' }));
    await assertFails(setDoc(ref('thiago', 'peso_2026-10-15'), { ...medida, extra: 1 }));
    await assertFails(setDoc(ref('thiago', 'peso_2026-10-15'), { tipo: 'peso', data: '2026-10-15' }));
    await assertFails(setDoc(ref('thiago', 'ouro_2026-10-15'), { tipo: 'ouro', data: '2026-10-15', valor: 1 }));
  });
});
