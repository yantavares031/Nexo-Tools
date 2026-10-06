"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Workflow } from "lucide-react";
import { APP_CONFIG } from "@/config/app";

export function SplashScreenClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Redireciona para a página inicial do painel após 3.5 segundos
    const timer = setTimeout(() => {
      router.replace(APP_CONFIG.homeHref);
    }, 3500);

    return () => clearTimeout(timer);
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        {/* Ícone Workflow com animação bounce */}
        <div className="animate-bounce">
          <Workflow className="size-16 text-rail" strokeWidth={2.25} />
        </div>
        
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl leading-none font-extrabold tracking-tighter text-rail">
            NEXO <span className="font-light tracking-tight">Tools</span>
          </h1>
          <p className="text-sm text-neutral-500 animate-pulse">
            Carregando...
          </p>
        </div>
      </div>
    </div>
  );
}
