/** Dados do usuário que amarram o token: ao trocar a senha, o hash muda e o token deixa de valer. */
export type PasswordResetTokenSubject = {
  userId: string;
  passwordHash: string;
};

/** Contrato para gerar e validar tokens de redefinição de senha. */
export interface IPasswordResetTokenService {
  create(subject: PasswordResetTokenSubject, expiresAt: Date): string;
  /** Lê o usuário do token sem validar assinatura (para buscar o hash e então chamar `verify`). */
  readUserId(token: string): string | null;
  verify(token: string, subject: PasswordResetTokenSubject, now: Date): boolean;
}
