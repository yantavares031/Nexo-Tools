"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return <Toaster theme="light" position="bottom-right" richColors closeButton />;
}
