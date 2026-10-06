import { createHmac, timingSafeEqual } from "crypto";
import type {
  IPasswordResetTokenService,
  PasswordResetTokenSubject,
} from "@/lib/contracts/password-reset-token";

type Payload = { uid: string; exp: number };

/**
 * Token assinado (HMAC-SHA256) sem tabela no banco: `base64url(payload).assinatura`.
 * A assinatura inclui o hash atual da senha, então o link vale uma única vez.
 */
export class HmacPasswordResetTokenService implements IPasswordResetTokenService {
  constructor(private readonly secret: string) {}

  create(subject: PasswordResetTokenSubject, expiresAt: Date): string {
    const payload: Payload = { uid: subject.userId, exp: expiresAt.getTime() };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encoded}.${this.sign(encoded, subject.passwordHash)}`;
  }

  readUserId(token: string): string | null {
    return this.decode(token)?.payload.uid ?? null;
  }

  verify(token: string, subject: PasswordResetTokenSubject, now: Date): boolean {
    const decoded = this.decode(token);
    if (!decoded || decoded.payload.uid !== subject.userId || decoded.payload.exp < now.getTime()) {
      return false;
    }
    const expected = Buffer.from(this.sign(decoded.encoded, subject.passwordHash));
    const actual = Buffer.from(decoded.signature);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private sign(encoded: string, passwordHash: string): string {
    return createHmac("sha256", this.secret).update(`${encoded}.${passwordHash}`).digest("base64url");
  }

  private decode(token: string): { encoded: string; signature: string; payload: Payload } | null {
    const [encoded, signature, ...rest] = token.split(".");
    if (!encoded || !signature || rest.length > 0) return null;
    try {
      const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<Payload>;
      if (typeof payload.uid !== "string" || typeof payload.exp !== "number") return null;
      return { encoded, signature, payload: { uid: payload.uid, exp: payload.exp } };
    } catch {
      return null;
    }
  }
}

export function getPasswordResetTokenService(): IPasswordResetTokenService {
  const secret = process.env.PASSWORD_RESET_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("PASSWORD_RESET_SECRET não configurado (mínimo 32 caracteres).");
  }
  return new HmacPasswordResetTokenService(secret);
}
