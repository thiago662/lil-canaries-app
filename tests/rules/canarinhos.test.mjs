import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

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

describe('collectionGroup (placar)', () => {
  it('canarinho lê os checkpoints de todos numa consulta só', async () => {
    const snap = await assertSucceeds(getDocs(collectionGroup(como('igor'), 'medidas')));
    assert.equal(snap.size, 1);
  });

  it('nega sem login e sem perfil', async () => {
    await assertFails(getDocs(collectionGroup(env.unauthenticatedContext().firestore(), 'medidas')));
    await assertFails(getDocs(collectionGroup(como('intruso'), 'medidas')));
  });

  it('lista os perfis só pra canarinho', async () => {
    const snap = await assertSucceeds(getDocs(collection(como('igor'), 'canarinhos')));
    assert.equal(snap.size, 2);
    await assertFails(getDocs(collection(como('intruso'), 'canarinhos')));
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
    await assertFails(setDoc(ref('thiago', 'apelidos_2026-10-15'), { tipo: 'apelidos', data: '2026-10-15', valor: 21 }));
    await assertFails(setDoc(ref('thiago', 'ouro_2026-10-15'), { tipo: 'ouro', data: '2026-10-15', valor: 1 }));
  });
});

describe('apelidos com M', () => {
  const novo = (uid, extra = {}) => ({ texto: 'Marmelo', data: '2026-10-15', autorUid: uid, ...extra });
  const ref = (uid, id) => doc(como(uid), `apelidos/${id}`);

  it('canarinho lança e todo canarinho lê; sem perfil não lê nem lança', async () => {
    await assertSucceeds(setDoc(ref('thiago', 'marmelo'), novo('thiago')));
    await assertSucceeds(getDoc(ref('igor', 'marmelo')));
    await assertFails(getDoc(ref('intruso', 'marmelo')));
    await assertFails(setDoc(ref('intruso', 'martelo'), novo('intruso', { texto: 'Martelo' })));
  });

  it('o mesmo apelido não pode ser lançado de novo nem sobrescrito', async () => {
    await assertSucceeds(setDoc(ref('thiago', 'marmelo'), novo('thiago')));
    await assertFails(setDoc(ref('igor', 'marmelo'), novo('igor')));
    await assertFails(setDoc(ref('thiago', 'marmelo'), novo('thiago', { data: '2026-10-16' })));
  });

  it('autor tem que ser quem lança', async () => {
    await assertFails(setDoc(ref('igor', 'marmelo'), novo('thiago')));
  });

  it('tem que começar com M e o id tem que ser o texto normalizado', async () => {
    await assertFails(setDoc(ref('thiago', 'banana'), novo('thiago', { texto: 'Banana' })));
    await assertFails(setDoc(ref('thiago', 'Marmelo'), novo('thiago'))); // id com maiúscula
    await assertFails(setDoc(ref('thiago', 'mármore'), novo('thiago', { texto: 'Mármore' }))); // id com acento
    await assertFails(setDoc(ref('thiago', 'm'), novo('thiago', { texto: 'M' }))); // curto demais
    await assertSucceeds(setDoc(ref('thiago', 'mandragora'), novo('thiago', { texto: 'Mandrágora' })));
  });

  it('data inválida ou campo extra são negados', async () => {
    await assertFails(setDoc(ref('thiago', 'marmelo'), novo('thiago', { data: '15/10/2026' })));
    await assertFails(setDoc(ref('thiago', 'marmelo'), novo('thiago', { extra: 1 })));
  });

  it('só o autor apaga', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'apelidos/marmelo'), novo('thiago')),
    );
    await assertFails(deleteDoc(ref('igor', 'marmelo')));
    await assertSucceeds(deleteDoc(ref('thiago', 'marmelo')));
  });
});

describe('metas', () => {
  const meta = (extra = {}) => ({ tipo: 'peso', valor: 78, ...extra });
  const ref = (uid, id, alvo = 'thiago') => doc(como(uid), `canarinhos/${alvo}/metas/${id}`);

  it('dono cria, troca e apaga a própria meta, com ou sem prazo', async () => {
    await assertSucceeds(setDoc(ref('thiago', 'peso'), meta()));
    await assertSucceeds(setDoc(ref('thiago', 'peso'), meta({ valor: 75, data: '2026-12-31' })));
    await assertSucceeds(setDoc(ref('thiago', 'altura'), { tipo: 'altura', valor: 182 }));
    await assertSucceeds(deleteDoc(ref('thiago', 'peso')));
  });

  it('outro canarinho não escreve nem apaga a meta de ninguém', async () => {
    await assertFails(setDoc(ref('igor', 'peso'), meta()));
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'canarinhos/thiago/metas/peso'), meta()),
    );
    await assertFails(deleteDoc(ref('igor', 'peso')));
    await assertFails(setDoc(ref('igor', 'peso'), meta({ valor: 1 }))); // nem trocar
  });

  it('todo canarinho lê as metas (inclusive numa consulta só); sem perfil não', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'canarinhos/thiago/metas/peso'), meta()),
    );
    await assertSucceeds(getDoc(ref('igor', 'peso')));
    const snap = await assertSucceeds(getDocs(collectionGroup(como('igor'), 'metas')));
    assert.equal(snap.size, 1);
    await assertFails(getDoc(ref('intruso', 'peso')));
    await assertFails(getDocs(collectionGroup(como('intruso'), 'metas')));
  });

  it('id tem que ser o tipo; valor na faixa; prazo com data válida; sem campo extra', async () => {
    await assertFails(setDoc(ref('thiago', 'qualquer'), meta()));
    await assertFails(setDoc(ref('thiago', 'altura'), meta())); // id diferente do tipo
    await assertFails(setDoc(ref('thiago', 'peso'), meta({ valor: 5 })));
    await assertFails(setDoc(ref('thiago', 'peso'), meta({ valor: '78' })));
    await assertFails(setDoc(ref('thiago', 'peso'), meta({ data: '31/12/2026' })));
    await assertFails(setDoc(ref('thiago', 'peso'), meta({ data: 20261231 })));
    await assertFails(setDoc(ref('thiago', 'peso'), meta({ extra: 1 })));
    await assertFails(setDoc(ref('thiago', 'peso'), { tipo: 'peso' }));
    await assertFails(setDoc(ref('thiago', 'imc'), { tipo: 'imc', valor: 25 })); // categoria derivada
  });
});
