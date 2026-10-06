"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import loginIllustration from "@/public/images/login-illustration.png";

const ANIMATION_PATH = "/lottie/login-illustration.json";

export function LoginIllustration() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let destroy: (() => void) | undefined;
    let cancelled = false;

    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (cancelled) return;
      const animation = lottie.loadAnimation({
        container: stage,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: ANIMATION_PATH,
        rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      // A imagem estática só sai quando a animação renderizou; em erro, ela continua.
      animation.addEventListener("DOMLoaded", () => setIsAnimated(true));
      animation.addEventListener("data_failed", () => setIsAnimated(false));
      destroy = () => animation.destroy();
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  return (
    <>
      <Image
        src={loginIllustration}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 55vw, 0px"
        className={isAnimated ? "invisible object-contain" : "object-contain"}
      />
      <div ref={stageRef} className="absolute inset-0" aria-hidden />
    </>
  );
}
