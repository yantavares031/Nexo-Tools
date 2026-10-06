import Form from "next/form";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  /** Rota da listagem (ex.: "/solicitantes"). */
  action: string;
  q?: string;
  placeholder: string;
  label: string;
  /** Filtros ativos que devem ser preservados ao buscar. */
  hiddenParams?: Record<string, string | undefined>;
  /** Link para limpar só a busca, mantendo os demais filtros. */
  clearHref: string;
  className?: string;
};

export function SearchPill({ action, q, placeholder, label, hiddenParams = {}, clearHref, className }: Props) {
  return (
    <Form
      action={action}
      role="search"
      className={cn(
        "flex h-9 w-full items-center rounded-full border border-neutral-300 bg-white transition-colors focus-within:border-neutral-700 focus-within:ring-2 focus-within:ring-neutral-900/5 hover:border-neutral-400 sm:w-80",
        className,
      )}
    >
      {Object.entries(hiddenParams).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <Search className="ml-3.5 size-4 shrink-0 text-neutral-400" aria-hidden />
      <input
        key={q ?? ""}
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label={label}
        className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[13px] outline-none placeholder:text-neutral-400 [&::-webkit-search-cancel-button]:hidden"
      />
      {q && (
        <Link
          href={clearHref}
          aria-label="Limpar busca"
          className="mr-2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <X className="size-3.5" />
        </Link>
      )}
      <button type="submit" className="sr-only">
        Buscar
      </button>
    </Form>
  );
}
