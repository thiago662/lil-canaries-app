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
      ['apelidos', '2026-06-01', 5],
      ['apelidos', '2026-08-01', 12],
      ['apelidos', '2026-10-01', 21],
    ],
  },
];

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

for (const u of usuarios) {
  const uid = await criarConta(u.email);
  await gravar(`canarinhos/${uid}`, { nome: u.nome, apelido: '', avatar: u.avatar });
  for (const [tipo, data, valor] of u.checkpoints) {
    await gravar(`canarinhos/${uid}/medidas/${tipo}_${data}`, { tipo, data, valor });
  }
  console.log(`${u.nome}: ${u.email} / password123 (uid ${uid})`);
}
