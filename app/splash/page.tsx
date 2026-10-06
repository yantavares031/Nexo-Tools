import { redirect } from "next/navigation";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/session-cookie";
import { getSession } from "@/lib/auth";
import { SplashScreenClient } from "./sub/SplashScreenClient";

export default async function SplashPage() {
  // Verifica se o usuário está autenticado
  const session = await getSession();
  if (!session) {
    redirect(SESSION_ENDED_LOGIN_PATH);
  }
  if (session.mustChangePassword) {
    redirect("/primeiro-acesso");
  }

  return <SplashScreenClient />;
}
