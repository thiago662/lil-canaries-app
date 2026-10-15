import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { collection, collectionGroup, onSnapshot } from 'firebase/firestore';
import { AuthService, Perfil } from './auth.service';
import { db } from './firebase';
import { Apelido } from './apelidos';
import { Medida } from './medidas';

export interface Canarinho {
  uid: string;
  perfil: Perfil;
}

// O ninho inteiro ao vivo: todos os perfis e todos os checkpoints, com uma consulta de cada
// (collectionGroup em vez de um listener por canarinho). Liga ao logar, desliga ao sair.
// ponytail: relê tudo a cada abertura; com milhares de checkpoints, agregar no perfil.
@Injectable({ providedIn: 'root' })
export class Ninho {
  private readonly auth = inject(AuthService);

  readonly canarinhos = signal<Canarinho[]>([]);
  readonly apelidos = signal<Apelido[]>([]);
  readonly pronto = signal(false);
  readonly erro = signal(false);
  private readonly todas = signal<(Medida & { uid: string })[]>([]);

  /** Checkpoints de cada canarinho, do mais novo pro mais velho. */
  readonly medidasPorUid = computed(() => {
    const mapa = new Map<string, Medida[]>();
    for (const { uid, ...m } of this.todas()) {
      mapa.set(uid, [...(mapa.get(uid) ?? []), m]);
    }
    for (const lista of mapa.values()) lista.sort((a, b) => (a.data < b.data ? 1 : -1));
    return mapa;
  });

  constructor() {
    const logado = computed(() => this.auth.perfil() !== null);
    effect((onCleanup) => {
      if (!logado()) return;
      let perfis = false;
      let medidas = false;
      let apelidos = false;
      const chegou = () => this.pronto.set(perfis && medidas && apelidos);
      const falhou = (e: Error) => {
        console.error(e);
        this.erro.set(true);
      };

      const parar = [
        onSnapshot(
          collection(db, 'canarinhos'),
          (snap) => {
            this.canarinhos.set(
              snap.docs
                .map((d) => ({ uid: d.id, perfil: d.data() as Perfil }))
                .sort((a, b) => a.perfil.nome.localeCompare(b.perfil.nome)),
            );
            perfis = true;
            chegou();
          },
          falhou,
        ),
        onSnapshot(
          collectionGroup(db, 'medidas'),
          (snap) => {
            this.todas.set(
              snap.docs.map((d) => ({
                id: d.id,
                uid: d.ref.parent.parent!.id,
                ...(d.data() as Omit<Medida, 'id'>),
              })),
            );
            medidas = true;
            chegou();
          },
          falhou,
        ),
        onSnapshot(
          collection(db, 'apelidos'),
          (snap) => {
            this.apelidos.set(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Apelido, 'id'>) })),
            );
            apelidos = true;
            chegou();
          },
          falhou,
        ),
      ];

      onCleanup(() => {
        parar.forEach((p) => p());
        this.canarinhos.set([]);
        this.apelidos.set([]);
        this.todas.set([]);
        this.pronto.set(false);
        this.erro.set(false);
      });
    });
  }
}
