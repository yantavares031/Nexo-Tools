"use client";

import { useState } from "react";

function initialsFromLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[parts.length - 1][0];
    return `${a}${b}`.toUpperCase();
  }
  if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return parts[0].charAt(0).toUpperCase();
}

type UserAvatarThumbProps = {
  userId?: string | null;
  /** Nome exibido ao lado — usado para iniciais quando não há foto ou userId. */
  label: string;
  className?: string;
};

/**
 * Miniatura circular da foto de perfil (rota autenticada `/api/users/[userId]/avatar`)
 * ou iniciais quando não há usuário vinculado ou imagem.
 */
export function UserAvatarThumb({ userId, label, className }: UserAvatarThumbProps) {
  const [failed, setFailed] = useState(false);
  const uid = userId?.trim();
  const showImage = Boolean(uid && !failed);

  const base =
    "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold uppercase text-slate-600";

  if (!showImage) {
    return (
      <span className={`${base} ${className ?? ""}`} title={label} aria-hidden>
        {initialsFromLabel(label)}
      </span>
    );
  }

  return (
    <span className={`relative inline-flex shrink-0 ${className ?? ""}`}>
      <img
        src={`/api/users/${encodeURIComponent(uid!)}/avatar`}
        alt=""
        width={32}
        height={32}
        className="size-8 rounded-full object-cover"
        title={label}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
