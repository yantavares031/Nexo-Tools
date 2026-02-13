"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Workflow } from "lucide-react";

export function SplashScreenClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Redireciona para o painel após 3.5 segundos
    const timer = setTimeout(() => {
      router.replace("/");
    }, 3500);

    return () => clearTimeout(timer);
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        {/* Ícone Workflow com animação bounce */}
        <div className="animate-bounce">
          <Workflow className="size-16 text-blue-500" strokeWidth={2.5} />
        </div>
        
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-800">
            <span className="text-blue-500">NEXO</span> Tools
          </h1>
          <p className="text-sm text-slate-500 animate-pulse">
            Carregando...
          </p>
        </div>
      </div>
    </div>
  );
}
