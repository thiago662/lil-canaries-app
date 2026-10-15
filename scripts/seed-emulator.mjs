// Popula o Auth + Firestore Emulator com 3 canarinhos de teste (senha password123) e uns checkpoints.
// Uso: `npm run emulators` num terminal e `npm run seed` em outro. Só fala com 127.0.0.1.
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const DOCS = 'http://127.0.0.1:8080/v1/projects/demo-canarinhos/databases/(default)/documents';

// Só quem tem `checkpoints` lança dado; o resto fica no zero dos apelidos (a piada).
const usuarios = [
  {
    email: 'thiago@teste.local',
    nome: 'Thiago',
    avatar: '🐤',
    checkpoints: [
      ['peso', '2026-08-15', 86],
      ['peso', '2026-09-15', 83.5],
      ['peso', '2026-10-15', 81],
      ['altura', '2026-01-01', 180],
      ['salario', '2026-10-01', 5000],
      ['peca', '2026-10-01', 12],
    ],
  },
  { email: 'igor@teste.local', nome: 'Igor', avatar: '🦜', checkpoints: [] },
  {
    email: 'marco@teste.local',
    nome: 'Marco',
    avatar: '🐔',
    checkpoints: [
      ['peso', '2026-10-15', 107],
    ],
  },
];

// Apelidos com M pro Marco: [texto, data, autor (índice em `usuarios`)], em datas espalhadas.
const apelidos = [
  ['Marcelo', '2026-01-12', 0],
  ['Martelo', '2026-02-03', 1],
  ['Marmelo', '2026-02-20', 0],
  ['Marlon', '2026-03-14', 2],
  ['Maicon', '2026-04-02', 1],
  ['Malaquias', '2026-04-27', 0],
  ['Melancia', '2026-05-19', 1],
  ['Mortadela', '2026-06-08', 2],
  ['Mastodonte', '2026-06-30', 0],
  ['Mandrágora', '2026-07-15', 1],
  ['Macarrão', '2026-08-01', 0],
  ['Marsupial', '2026-08-22', 2],
  ['Mefistófeles', '2026-09-05', 1],
  ['Muriçoca', '2026-09-18', 0],
  ['Matusalém', '2026-10-01', 1],
  ['Mamute', '2026-10-09', 0],
];

// mesma regra de src/app/core/apelidos.ts (normalizar)
const normalizar = (t) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function criarConta(email) {
  const corpo = { email, password: 'password123', returnSecureToken: true };
  const r = await fetch(`${AUTH}/accounts:signUp?key=fake`, post(corpo));
  const j = await r.json();
  if (j.localId) return j.localId;
  // já existe (seed rodado antes): entra pra descobrir o uid
  const l = await fetch(`${AUTH}/accounts:signInWithPassword?key=fake`, post(corpo));
  return (await l.json()).localId;
}

const post = (corpo) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo),
});

// "Bearer owner" ignora as rules no emulador (as rules negam criar perfil pelo cliente).
async function gravar(caminho, campos) {
  const fields = Object.fromEntries(
    Object.entries(campos).map(([k, v]) => [k, typeof v === 'number' ? { doubleValue: v } : { stringValue: v }]),
  );
  const r = await fetch(`${DOCS}/${caminho}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields }),
  });
  if (!r.ok) throw new Error(`${caminho}: ${r.status} ${await r.text()}`);
}

const uids = [];
for (const u of usuarios) {
  const uid = await criarConta(u.email);
  uids.push(uid);
  await gravar(`canarinhos/${uid}`, { nome: u.nome, apelido: '', avatar: u.avatar });
  for (const [tipo, data, valor] of u.checkpoints) {
    await gravar(`canarinhos/${uid}/medidas/${tipo}_${data}`, { tipo, data, valor });
  }
  console.log(`${u.nome}: ${u.email} / password123 (uid ${uid})`);
}

for (const [texto, data, autor] of apelidos) {
  await gravar(`apelidos/${normalizar(texto)}`, { texto, data, autorUid: uids[autor] });
}
console.log(`${apelidos.length} apelidos com M lançados`);
