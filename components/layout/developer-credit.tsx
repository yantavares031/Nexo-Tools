import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Esconde o texto em telas pequenas, mantendo só a logo. */
  isCompact?: boolean;
};

export function DeveloperCredit({ className, isCompact = false }: Props) {
  return (
    <a
      href="https://www.ytechsolution.com.br/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Desenvolvido por Ytech Solution"
      className={cn("group flex shrink-0 items-center gap-2 text-xs whitespace-nowrap text-neutral-500", className)}
    >
      <Image src="/ytech-logo.png" alt="" width={36} height={24} />
      <span className={cn(isCompact && "max-sm:hidden")}>
        Desenvolvido por <strong className="font-semibold text-link group-hover:underline">Ytech Solution</strong>
      </span>
    </a>
  );
}
