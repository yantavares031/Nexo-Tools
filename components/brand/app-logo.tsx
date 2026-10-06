import { Workflow } from "lucide-react";

export function AppLogo() {
  return (
    <span className="flex size-10 items-center justify-center rounded-lg bg-white/10 text-white">
      <Workflow className="size-5" strokeWidth={2} aria-hidden />
    </span>
  );
}
