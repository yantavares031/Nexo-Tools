import { Skeleton } from "@/components/ui/skeleton";

export function OrdensCompraContentSkeleton() {
  return (
    <div role="status" aria-label="Carregando ordens de compra" className="space-y-3">
      <Skeleton className="h-6 w-36 rounded-full" />
      <div className="divide-y divide-neutral-100 border-t border-neutral-200">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-6 px-3 py-4">
            <div className="w-56 space-y-1.5">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-2.5 w-14" />
            </div>
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-20" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="size-8 rounded-field" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-4">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-40" />
      </div>
    </div>
  );
}
