export interface IBackupStorageProvider {
  uploadBackup(buffer: Buffer, filename: string): Promise<string>;
}
