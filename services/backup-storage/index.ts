import type { IBackupStorageProvider } from "@/lib/contracts/backup-storage";
import { R2BackupStorageService } from "./r2-backup-storage.service";

export function getBackupStorageProvider(): IBackupStorageProvider {
  const raw = process.env.ACTIVE_PROVIDER_BACKUP?.trim().toUpperCase();
  if (raw === "R2") {
    return new R2BackupStorageService();
  }
  throw new Error(
    'ACTIVE_PROVIDER_BACKUP deve ser "R2" para envio ao armazenamento de backups.'
  );
}
