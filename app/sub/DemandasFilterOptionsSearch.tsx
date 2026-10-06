"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DropdownItem } from "@/components/ui/dropdown-item";

export type FilterOptionLink = { label: string; href: string; active: boolean };

export function DemandasFilterOptionsSearch({
  allOption,
  options,
  placeholder,
}: {
  allOption: FilterOptionLink;
  options: FilterOptionLink[];
  placeholder: string;
}) {
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, term]);

  return (
    <>
      <div className="sticky -top-1 z-10 -mx-1 -mt-1 mb-1 border-b border-neutral-100 bg-white p-1">
        <div className="flex h-8 items-center rounded-field border border-neutral-300 focus-within:border-neutral-700">
          <Search className="ml-2.5 size-3.5 shrink-0 text-neutral-400" aria-hidden />
          <input
            type="search"
            autoFocus
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-[13px] outline-none placeholder:text-neutral-400 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
      </div>
      {!term && (
        <DropdownItem href={allOption.href} active={allOption.active}>
          {allOption.label}
        </DropdownItem>
      )}
      {filtered.length === 0 ? (
        <p className="px-2.5 py-2 text-[13px] text-neutral-500">Nenhuma opção encontrada.</p>
      ) : (
        filtered.map((option) => (
          <DropdownItem key={option.href} href={option.href} active={option.active}>
            {option.label}
          </DropdownItem>
        ))
      )}
    </>
  );
}
