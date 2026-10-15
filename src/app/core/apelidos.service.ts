import { Injectable } from '@angular/core';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { limpar, normalizar } from './apelidos';
import { db } from './firebase';

@Injectable({ providedIn: 'root' })
export class ApelidosService {
  /**
   * Lança um apelido novo. As rules só permitem criar (id = texto normalizado), então se alguém
   * lançou o mesmo agora há pouco o Firestore nega: não há como sobrescrever nem duplicar.
   */
  lancar(autorUid: string, texto: string, data: string) {
    const limpo = limpar(texto);
    return setDoc(doc(db, 'apelidos', normalizar(limpo)), { texto: limpo, data, autorUid });
  }

  apagar(id: string) {
    return deleteDoc(doc(db, 'apelidos', id));
  }
}
