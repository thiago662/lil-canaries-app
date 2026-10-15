import { Injectable } from '@angular/core';
import { deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { idMedida, Medida, TipoMedida } from './medidas';

type Dados = { tipo: TipoMedida; data: string; valor: number };

@Injectable({ providedIn: 'root' })
export class MedidasService {
  private ref(uid: string, id: string) {
    return doc(db, 'canarinhos', uid, 'medidas', id);
  }

  /** Cria o checkpoint ou, se já existe um nesse tipo e dia, corrige o valor. */
  salvar(uid: string, { tipo, data, valor }: Dados) {
    return setDoc(this.ref(uid, idMedida(tipo, data)), { tipo, data, valor });
  }

  /** Corrige valor e/ou data de um checkpoint existente. Mudar a data move ele na linha do tempo. */
  async editar(uid: string, antigo: Medida, { data, valor }: { data: string; valor: number }) {
    const novo = { tipo: antigo.tipo, data, valor };
    if (data === antigo.data) return this.salvar(uid, novo);
    const lote = writeBatch(db);
    lote.delete(this.ref(uid, antigo.id));
    lote.set(this.ref(uid, idMedida(antigo.tipo, data)), novo);
    return lote.commit();
  }

  apagar(uid: string, medida: Medida) {
    return deleteDoc(this.ref(uid, medida.id));
  }
}
