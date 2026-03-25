import type { User, UserPublic } from "@/types/globals";

/** Remove campos sensíveis antes de enviar usuário ao client. */
export function sanitizeUserForClient(user: User): UserPublic {
  const { password: _p, temporaryPassword: _t, ...rest } = user;
  return rest;
}
