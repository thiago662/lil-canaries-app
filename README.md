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
