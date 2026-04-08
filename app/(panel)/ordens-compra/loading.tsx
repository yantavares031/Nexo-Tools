import { OrdensCompraContentSkeleton } from "./sub/OrdensCompraContentSkeleton";

export default function OrdensCompraLoading() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="min-h-[40vh]">
          <OrdensCompraContentSkeleton />
        </div>
      </div>
    </div>
  );
}
