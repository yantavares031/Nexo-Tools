"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "./button";

type Props = Omit<ComponentProps<typeof Button>, "type" | "loading"> & {
  pendingLabel?: string;
};

export function SubmitButton({ children, pendingLabel, ...props }: Props) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
