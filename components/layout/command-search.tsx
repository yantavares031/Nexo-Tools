"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { LayoutGrid, Megaphone, Search, UserPlus, Workflow, type LucideIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { getNavItemsForRole } from "@/config/navigation";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/types/globals";

export type SearchItem = { key: string; href: string; title: string; subtitle?: string };
export type SearchGroup = { label: string; items: SearchItem[] };

type VisibleItem = SearchItem & { icon?: LucideIcon };

const MIN_LENGTH = 2;
const PAGES_LABEL = "Páginas";

const GROUP_ICONS: Record<string, LucideIcon> = {
  [PAGES_LABEL]: LayoutGrid,
  Demandas: Workflow,
  Solicitantes: UserPlus,
  Agências: Megaphone,
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

const subscribeNoop = () => () => {};

function useShortcutLabel() {
  return useSyncExternalStore(
    subscribeNoop,
    () => (/Mac|iPhone|iPad/i.test(navigator.userAgent) ? "⌘K" : "Ctrl K"),
    () => "⌘K",
  );
}

type Props = {
  searchAction: (term: string) => Promise<SearchGroup[]>;
  role: UserRole;
  placeholder?: string;
  dialogPlaceholder?: string;
};

export function CommandSearch({ searchAction, role, placeholder = "Buscar", dialogPlaceholder = placeholder }: Props) {
  const router = useRouter();
  const listId = useId();
  const shortcut = useShortcutLabel();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const requestId = useRef(0);

  const [term, setTerm] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const query = normalize(term);
  const pageItems: VisibleItem[] = getNavItemsForRole(role)
    .filter((item) => query === "" || normalize(item.label).includes(query))
    .map((item) => ({ key: `page-${item.href}`, href: item.href, title: item.label, icon: item.icon }));

  const visibleGroups: { label: string; items: VisibleItem[] }[] = [
    { label: PAGES_LABEL, items: pageItems },
    ...groups,
  ].filter((group) => group.items.length > 0);
  const items = visibleGroups.flatMap((group) => group.items);
  const ready = term.trim().length >= MIN_LENGTH;

  function open() {
    dialogRef.current?.showModal();
    inputRef.current?.select();
  }

  function reset() {
    clearTimeout(timer.current);
    requestId.current += 1;
    setTerm("");
    setGroups([]);
    setLoading(false);
    setActiveIndex(0);
  }

  function go(href: string) {
    dialogRef.current?.close();
    router.push(href);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialogRef.current?.open) dialogRef.current.close();
        else open();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleChange(value: string) {
    setTerm(value);
    setActiveIndex(0);
    clearTimeout(timer.current);
    const id = ++requestId.current;

    if (value.trim().length < MIN_LENGTH) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const data = await searchAction(value);
        if (id === requestId.current) setGroups(data);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 200);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + items.length) % items.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(items[Math.min(activeIndex, items.length - 1)].href);
    }
  }

  const offsets = visibleGroups.map((_, groupIndex) =>
    visibleGroups.slice(0, groupIndex).reduce((total, group) => total + group.items.length, 0),
  );

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="flex h-9 w-full max-w-sm items-center gap-2.5 rounded-full border border-neutral-300 bg-white pr-2 pl-3.5 text-[13px] text-neutral-400 transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left">{placeholder}</span>
        <kbd className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-sans text-[11px] text-neutral-500 max-sm:hidden">
          {shortcut}
        </kbd>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Busca rápida"
        onClose={reset}
        onClick={(event) => event.target === dialogRef.current && dialogRef.current.close()}
        className="fixed inset-x-0 top-[12vh] mx-auto w-[min(40rem,calc(100%-2rem))] overflow-hidden rounded-xl bg-white p-0 shadow-2xl ring-1 ring-neutral-900/10 backdrop:bg-neutral-950/30"
      >
        <div className="flex h-14 items-center gap-3 border-b border-neutral-200 px-4">
          <Search className="size-4 shrink-0 text-neutral-400" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={dialogPlaceholder}
            aria-label="Buscar"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls={listId}
            aria-activedescendant={items[activeIndex] ? `${listId}-${activeIndex}` : undefined}
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400"
          />
          {loading && <Spinner />}
        </div>

        <div id={listId} role="listbox" aria-label="Resultados" className="max-h-[60vh] overflow-y-auto p-2">
          {ready && !loading && items.length === 0 && (
            <p className="px-3 py-8 text-center text-[13px] text-neutral-500">Nada encontrado para “{term.trim()}”.</p>
          )}

          {visibleGroups.map((group, groupIndex) => {
            const GroupIcon = GROUP_ICONS[group.label];
            return (
              <div key={group.label} role="group" aria-label={group.label} className="pb-1">
                <p className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                  {GroupIcon && <GroupIcon className="size-3.5" aria-hidden />}
                  {group.label}
                </p>
                {group.items.map((item, itemIndex) => {
                  const index = offsets[groupIndex] + itemIndex;
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      id={`${listId}-${index}`}
                      href={item.href}
                      role="option"
                      aria-selected={index === activeIndex}
                      tabIndex={-1}
                      onMouseMove={() => setActiveIndex(index)}
                      onClick={() => dialogRef.current?.close()}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 outline-none",
                        index === activeIndex && "bg-sky-50",
                      )}
                    >
                      {ItemIcon && <ItemIcon className="size-4 shrink-0 text-neutral-500" aria-hidden />}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-neutral-950 tabular-nums">{item.title}</span>
                        {item.subtitle && (
                          <span className="block truncate text-xs text-neutral-500 tabular-nums">{item.subtitle}</span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-neutral-100 px-4 py-2 text-[11px] text-neutral-400">
          <span>↑↓ navegar</span>
          <span>Enter abrir</span>
          <span>Esc fechar</span>
        </div>
      </dialog>
    </>
  );
}
