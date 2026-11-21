/* Independent backup of a published passport (decision #140): a copy kept outside MINMEG, per version */
export interface PassportBackup {
  id: string;
  passportVersionId: string;
  versionNumber: number;
  status: 'PENDING' | 'DELIVERED' | 'FAILED';
  provider: string | null;
  sizeBytes: number | null;
  contentHash: string | null;
  gaveUp: boolean;
  deliveredAt: string | null;
}
export interface PassportBackups {
  configured: boolean;
  provider: string | null;
  directLinks: boolean;
  passportId: string;
  passportCode: string;
  backups: PassportBackup[];
}
export interface RecoveryLink {
  url: string;
  expiresAt: string;
  provider: string;
  contentHash: string;
  versionNumber: number;
}
export const backupLabel = (b: PassportBackup) => (b.status === 'DELIVERED' ? 'Copied' : b.status === 'PENDING' ? 'Waiting' : b.gaveUp ? 'Not copied' : 'Trying again');
export const backupTone = (b: PassportBackup) => (b.status === 'DELIVERED' ? 'success' : b.gaveUp ? 'error' : 'neutral') as 'success' | 'error' | 'neutral';
