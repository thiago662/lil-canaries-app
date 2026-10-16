export const MIN_SENHA = 8;

// Senhas que todo mundo tenta primeiro (e a que as contas do ninho começaram usando).
const COMUNS = ['password123', 'password', '12345678', '123456789', '1234567890', '87654321', 'qwerty123', 'senha123', 'senha1234', '12341234'];

/** O motivo de a troca não poder seguir, ou null se está tudo certo. */
export function validarNovaSenha(atual: string, nova: string, confirmacao: string): string | null {
  if (!atual) return 'Digita a senha atual.';
  if (nova.length < MIN_SENHA) return `A senha nova precisa de pelo menos ${MIN_SENHA} caracteres.`;
  if (nova === atual) return 'A senha nova tem que ser diferente da atual.';
  if (/^(.)\1+$/.test(nova)) return 'Senha fraca: não vale repetir o mesmo caractere.';
  if (COMUNS.includes(nova.toLowerCase())) return 'Essa senha é comum demais. Escolhe outra.';
  if (nova !== confirmacao) return 'A confirmação não bate com a senha nova.';
  return null;
}

const ERROS: Record<string, string> = {
  'auth/wrong-password': 'A senha atual está errada.',
  'auth/invalid-credential': 'A senha atual está errada.',
  'auth/weak-password': 'O Firebase achou essa senha fraca demais.',
  'auth/too-many-requests': 'Muita tentativa errada. Espera um pouco e tenta de novo.',
  'auth/requires-recent-login': 'Por segurança, sai e entra de novo antes de trocar a senha.',
  'auth/network-request-failed': 'Sem conexão. Confere a internet.',
};

/** Mensagem em português pro erro do Firebase Auth. */
export const erroDeSenha = (e: unknown) =>
  ERROS[(e as { code?: string })?.code ?? ''] ?? 'Não consegui trocar a senha. Tenta de novo.';
