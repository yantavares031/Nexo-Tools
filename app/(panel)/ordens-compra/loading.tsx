import { Skeleton } from "@/components/ui/skeleton";
import { OrdensCompraContentSkeleton } from "./sub/OrdensCompraContentSkeleton";

export default function OrdensCompraLoading() {
  return (
    <div className="w-full">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-96 max-w-full" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full rounded-full sm:w-80" />
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
        <OrdensCompraContentSkeleton />
      </div>
    </div>
  );
}
