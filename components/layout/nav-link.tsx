"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isNavHrefActive } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { railItemClassName, railSubItemClassName } from "./rail-item";

export function NavLink({
  href,
  isSub = false,
  children,
}: {
  href: string;
  isSub?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = isNavHrefActive(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        isSub ? railSubItemClassName : railItemClassName,
        active ? "bg-white/12 text-white" : "text-neutral-400 hover:bg-rail-hover hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}
