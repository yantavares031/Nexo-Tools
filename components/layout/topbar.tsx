import type { UserRole } from "@/types/globals";
import { CommandSearch, type SearchGroup } from "./command-search";
import { DeveloperCredit } from "./developer-credit";

type Props = {
  role: UserRole;
  searchAction?: (term: string) => Promise<SearchGroup[]>;
  searchPlaceholder?: string;
  searchDialogPlaceholder?: string;
};

export function Topbar({ role, searchAction, searchPlaceholder, searchDialogPlaceholder }: Props) {
  return (
    <header className="flex h-16 items-center gap-4 pr-6 pl-16 lg:pl-6">
      <div className="flex min-w-0 flex-1 items-center">
        {searchAction && (
          <CommandSearch
            searchAction={searchAction}
            role={role}
            placeholder={searchPlaceholder}
            dialogPlaceholder={searchDialogPlaceholder}
          />
        )}
      </div>
      <DeveloperCredit isCompact />
    </header>
  );
}
