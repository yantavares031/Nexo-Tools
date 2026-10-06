import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-left text-[13px]", className)} {...props} />
    </div>
  );
}

export function TableHead(props: ComponentProps<"thead">) {
  return <thead {...props} />;
}

export function TableBody(props: ComponentProps<"tbody">) {
  return <tbody {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("border-b border-neutral-200/70", className)} {...props} />;
}

export function TableHeaderCell({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn("border-b border-neutral-200 px-3 py-3 text-[13px] font-semibold whitespace-nowrap text-neutral-800", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  // Cor padrão com especificidade zero para qualquer `text-*` passado em className vencer.
  return <td className={cn("px-3 py-3 align-middle [:where(&)]:text-neutral-600", className)} {...props} />;
}
