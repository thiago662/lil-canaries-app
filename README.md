# Canarinhos Pistola App

Sistema de zueira da família Canarinho Pistola: peso, altura, IMC, salário, tamanho da peça e apelidos do Marco, tudo com histórico em checkpoints e placar entre os canarinhos.

Angular 22 + Firebase (Auth + Firestore, plano Spark) + GitHub Pages. Tudo gratuito.

## Rodar local (sem Firebase real)

```
npm install
cp src/environments/firebase.config.example.ts src/environments/firebase.config.ts   # já com useEmulators = true
npm run emulators   # Auth + Firestore locais (precisa de Java); UI em http://localhost:4000
npm start           # http://localhost:4200
```

Com `useEmulators = true` o app usa um projeto `demo-*` e nunca toca em produção.

Com o emulador de pé, `npm run seed` cria 2 canarinhos de teste (`thiago@teste.local` e `igor@teste.local`, senha `password123`) e alguns checkpoints pro Thiago. O emulador perde os dados ao reiniciar: é só rodar o seed de novo.

## Convidar um canarinho (produção)

Só entra quem tem perfil no Firestore, e o cliente nunca cria perfil (as rules negam). Pra cada pessoa nova, no Console do Firebase:

1. **Authentication > Usuários > Adicionar usuário** (e-mail e senha). Copie o **UID**.
2. **Firestore Database > Iniciar coleção** `canarinhos` (ou **Adicionar documento** se já existir), com **ID do documento = o UID** e os campos de texto `nome` (ex.: `Thiago`), `apelido` (vazio) e `avatar` (ex.: `🐤`).

Quem tem conta no Auth mas não tem esse documento vê "Essa conta ainda não foi convidada pro ninho".

Cada canarinho troca a própria senha no app, em **Minha ficha > 🔑 Senha** (pede a senha atual e a nova, com no mínimo 8 caracteres). Quem esqueceu a senha tem que pedir pro dono do projeto redefinir no Console (Authentication > três pontinhos do usuário).

## Comandos

- `npm start`: dev server
- `npm test`: testes (vitest)
- `npm run build`: build de produção em `dist/lil-canaries-app/browser`
- `npm run emulators`: Auth + Firestore Emulator
- `npm run test:rules`: testes das `firestore.rules` (emulator)

## Publicar (uma vez só)

1. **Firebase Console** (plano Spark): criar projeto, adicionar app Web, ativar Authentication (só e-mail/senha), criar o Firestore (região `southamerica-east1`). Não precisa autorizar domínio: isso só vale pra login com Google/link por e-mail.
2. **GitHub**: Settings > Pages > Source: GitHub Actions. Settings > Secrets > Actions > `FIREBASE_CONFIG` = o objeto `{ apiKey: "...", ... }` do Console.
3. Local: copiar `.firebaserc.example` para `.firebaserc` com o project id e rodar `npx firebase deploy --only firestore:rules`.
4. Push no `main` publica no Pages.

O `firebaseConfig` não é segredo (vai no JS publicado). A proteção real são as rules + a lista de convidados.
