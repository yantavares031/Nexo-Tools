import type { IBackupStorageProvider } from "@/lib/contracts/backup-storage";
import { uploadBackupToR2 } from "@/lib/r2-upload";

export class R2BackupStorageService implements IBackupStorageProvider {
  async uploadBackup(buffer: Buffer, filename: string): Promise<string> {
    return uploadBackupToR2(buffer, filename);
  }
}
