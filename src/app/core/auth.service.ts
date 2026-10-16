import { Injectable, signal } from '@angular/core';
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  User,
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface Perfil {
  nome: string;
  apelido: string;
  avatar: string;
}

export const AVATARES = ['🐤', '🐥', '🐣', '🦜', '🦅', '🐔', '🦆', '🦉'];

// Logou no Auth mas não tem doc em canarinhos/{uid}: não está na lista de convidados.
export class SemPerfilError extends Error {}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly usuario = signal<User | null>(null);
  readonly perfil = signal<Perfil | null>(null);

  /** Resolve quando o estado inicial (logado ou não, com perfil ou não) já foi lido. */
  readonly pronto = new Promise<void>((resolve) => {
    onAuthStateChanged(auth, async (u) => {
      this.usuario.set(u);
      this.perfil.set(u ? await this.carregarPerfil(u.uid) : null);
      resolve();
    });
  });

  async login(email: string, senha: string) {
    const { user } = await signInWithEmailAndPassword(auth, email, senha);
    const perfil = await this.carregarPerfil(user.uid);
    if (!perfil) {
      await signOut(auth);
      throw new SemPerfilError();
    }
    this.usuario.set(user);
    this.perfil.set(perfil);
  }

  logout() {
    return signOut(auth);
  }

  /** Confirma a senha atual (o Firebase exige login recente pra isso) e troca pela nova. */
  async trocarSenha(atual: string, nova: string) {
    const u = auth.currentUser;
    if (!u?.email) throw new Error('sem usuário logado');
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, atual));
    await updatePassword(u, nova);
  }

  async salvarPerfil(perfil: Perfil) {
    const uid = this.usuario()!.uid;
    await updateDoc(doc(db, 'canarinhos', uid), { ...perfil });
    this.perfil.set(perfil);
  }

  // As rules negam a leitura de quem não tem perfil, então permission-denied também vira null.
  private async carregarPerfil(uid: string): Promise<Perfil | null> {
    try {
      const snap = await getDoc(doc(db, 'canarinhos', uid));
      return snap.exists() ? (snap.data() as Perfil) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}
