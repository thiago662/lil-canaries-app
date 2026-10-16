import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { Comentario } from './comentarios';
import { db } from './firebase';

const RECENTES = 50;

@Injectable({ providedIn: 'root' })
export class ComentariosService {
  private colecao(uid: string) {
    return collection(db, 'canarinhos', uid, 'comentarios');
  }

  /** Os recados mais novos da ficha de `uid`, ao vivo, do mais novo pro mais velho. */
  observar(
    uid: string,
    aoMudar: (lista: Comentario[]) => void,
    aoErro: (e: Error) => void,
  ): Unsubscribe {
    const q = query(this.colecao(uid), orderBy('criadoEm', 'desc'), limit(RECENTES));
    return onSnapshot(
      q,
      (snap) =>
        aoMudar(
          snap.docs.map((d) => {
            // 'estimate': um recado recém-enviado ainda não tem a hora do servidor
            const x = d.data({ serverTimestamps: 'estimate' });
            return {
              id: d.id,
              texto: x['texto'] as string,
              autorUid: x['autorUid'] as string,
              criadoEm: (x['criadoEm'] as Timestamp).toDate(),
            };
          }),
        ),
      aoErro,
    );
  }

  comentar(uid: string, autorUid: string, texto: string) {
    return addDoc(this.colecao(uid), { texto, autorUid, criadoEm: serverTimestamp() });
  }

  apagar(uid: string, id: string) {
    return deleteDoc(doc(db, 'canarinhos', uid, 'comentarios', id));
  }
}
