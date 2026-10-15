import { Injectable } from '@angular/core';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Meta } from './metas';
import { TipoMedida } from './medidas';

@Injectable({ providedIn: 'root' })
export class MetasService {
  private ref(uid: string, tipo: TipoMedida) {
    return doc(db, 'canarinhos', uid, 'metas', tipo);
  }

  /** Cria ou troca a meta da categoria. Sem prazo, o campo `data` nem é gravado. */
  salvar(uid: string, { tipo, valor, data }: Meta) {
    return setDoc(this.ref(uid, tipo), data ? { tipo, valor, data } : { tipo, valor });
  }

  remover(uid: string, tipo: TipoMedida) {
    return deleteDoc(this.ref(uid, tipo));
  }
}
