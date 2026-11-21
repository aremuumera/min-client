/* Decision #143: a company key's signature on a sealed record (B2 and B) */
export interface CompanySignature {
  status: 'VALID' | 'COMPROMISED' | 'INVALID' | 'PENDING' | 'FAILED';
  reason: string | null;
  organizationId: string;
  address: string | null;
  keyNumber: number | null;
  signedAt: string | null;
  signerUserId: string | null;
  message: string | null;
  signature: string | null;
  standard: string;
}
export const SIGNATURE_LABEL: Record<CompanySignature['status'], string> = {
  VALID: 'Signed with the company key',
  COMPROMISED: 'Signed with a key that may have been stolen',
  INVALID: 'Signature does not hold',
  PENDING: 'Being signed',
  FAILED: 'Not signed yet (retrying)',
};
export const signatureTone = (s: CompanySignature['status']) => (s === 'VALID' ? 'success' : s === 'PENDING' || s === 'FAILED' ? 'neutral' : 'error') as 'success' | 'neutral' | 'error';
