"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { disconnectUserAction } from "@/app/actions/realtime";
import { useConfirm } from "@/components/confirm-provider";
import { IconButton } from "@/components/ui/icon-button";

export function DisconnectUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [isPending, startTransition] = useTransition();
  const { confirm } = useConfirm();

  async function handleDisconnect() {
    const ok = await confirm({
      title: "Desconectar usuário",
      message: `"${userName}" sai de todas as abas e aparelhos agora e precisa entrar de novo.`,
      confirmLabel: "Desconectar",
      variant: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await disconnectUserAction(userId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`${userName} foi desconectado.`);
    });
  }

  return (
    <IconButton aria-label={`Desconectar ${userName}`} variant="danger" onClick={handleDisconnect} disabled={isPending}>
      <LogOut />
    </IconButton>
  );
}
