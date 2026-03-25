import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SplashScreenClient } from "./sub/SplashScreenClient";

export default async function SplashPage() {
  // Verifica se o usuário está autenticado
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.mustChangePassword) {
    redirect("/primeiro-acesso");
  }

  return <SplashScreenClient />;
}
