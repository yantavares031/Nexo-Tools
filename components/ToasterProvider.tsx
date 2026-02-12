"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: "12px",
          border: "1px solid rgb(226 232 240)",
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        },
      }}
    />
  );
}
