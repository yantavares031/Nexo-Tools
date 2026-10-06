import Link from "next/link";
import { LogOut } from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";
import { APP_CONFIG } from "@/config/app";
import { isNavGroup, type NavItem, type NavSection } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { APP_VERSION } from "@/lib/version";
import { NavGroup } from "./nav-group";
import { NavLink } from "./nav-link";
import { RailLabel, railItemClassName, railSubItemClassName } from "./rail-item";
import { SidebarDrawer } from "./sidebar-drawer";

type Props = {
  sections: NavSection[];
  userName: string;
  avatarUrl?: string | null;
  profileHref?: string;
  logoutAction?: () => Promise<void>;
};

function NavItemLink({ item, isSub = false }: { item: NavItem; isSub?: boolean }) {
  const { label, href, icon: Icon, enabled } = item;
  const content = (
    <>
      <Icon className={isSub ? "size-4 shrink-0" : "size-[18px] shrink-0"} strokeWidth={1.75} aria-hidden />
      <RailLabel>{label}</RailLabel>
      {!enabled && (
        <RailLabel className="ml-auto shrink-0 rounded-full bg-white/10 px-1.5 py-px text-[10px] text-neutral-400">
          em breve
        </RailLabel>
      )}
    </>
  );

  if (enabled) {
    return (
      <NavLink href={href} isSub={isSub}>
        {content}
      </NavLink>
    );
  }

  return (
    <span
      aria-disabled
      aria-label={`${label} (em breve)`}
      className={cn(isSub ? railSubItemClassName : railItemClassName, "cursor-not-allowed text-neutral-600")}
    >
      {content}
    </span>
  );
}

export function Sidebar({ sections, userName, avatarUrl, profileHref, logoutAction }: Props) {
  const initial = userName.trim().charAt(0).toUpperCase() || "?";

  const avatar = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- mesma origem, ícone pequeno no menu
    <img src={avatarUrl} alt="" width={26} height={26} className="size-[26px] shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
      {initial}
    </span>
  );

  return (
    <SidebarDrawer>
      <Link
        href={APP_CONFIG.homeHref}
        aria-label={`${APP_CONFIG.name} — Início`}
        className="flex h-16 shrink-0 items-center gap-3 px-[22px] whitespace-nowrap lg:px-[10px]"
      >
        <span className="flex w-11 shrink-0 justify-center">
          <AppLogo />
        </span>
        <RailLabel className="flex flex-col gap-0.5 border-l border-white/15 pl-3 leading-tight">
          <span className="text-xs font-medium text-neutral-300">{APP_CONFIG.name}</span>
          <span className="text-[10px] text-neutral-500 tabular-nums">v{APP_VERSION}</span>
        </RailLabel>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto px-3 pt-2 pb-3" aria-label="Principal">
        {sections.map((section, index) => (
          <div key={section.label ?? index} className="flex flex-col gap-1">
            {section.label && (
              <div className="mt-4 mb-1 h-4 px-[11px] text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                <RailLabel>{section.label}</RailLabel>
              </div>
            )}
            {section.items.map((node) =>
              isNavGroup(node) ? (
                <NavGroup
                  key={node.key}
                  groupKey={node.key}
                  label={node.label}
                  icon={<node.icon className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />}
                  hrefs={node.children.map((child) => child.href)}
                >
                  {node.children.map((child) => (
                    <NavItemLink key={child.href} item={child} isSub />
                  ))}
                </NavGroup>
              ) : (
                <NavItemLink key={node.href} item={node} />
              ),
            )}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 px-3 py-3">
        {profileHref ? (
          <Link
            href={profileHref}
            title="Meu perfil"
            className={cn(railItemClassName, "px-[7px] text-neutral-200 hover:bg-rail-hover hover:text-white")}
          >
            {avatar}
            <RailLabel>{userName}</RailLabel>
          </Link>
        ) : (
          <span className={cn(railItemClassName, "px-[7px] text-neutral-200")}>
            {avatar}
            <RailLabel>{userName}</RailLabel>
          </span>
        )}
        {logoutAction && (
          <form action={logoutAction}>
            <button
              type="submit"
              className={cn(railItemClassName, "text-neutral-400 hover:bg-rail-hover hover:text-white")}
            >
              <LogOut className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
              <RailLabel>Sair</RailLabel>
            </button>
          </form>
        )}
      </div>
    </SidebarDrawer>
  );
}
