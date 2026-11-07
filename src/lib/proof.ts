/*
 * Step 2.11c: the proof of a record, for companies and buyers (decision #111 D3). Plain words, the
 * fingerprint, the network and the transaction link; never keys, fees or MINMEG's internal queue.
 */
export type Paged<T> = { data: T[]; meta: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage?: number } };
export type Single<T> = { data: T };

export type ProofSubject = 'PASSPORT_VERSION' | 'CERTIFICATE_VERSION' | 'COMPLIANCE_ASSESSMENT' | 'ESG_ASSESSMENT' | 'CARBON_ASSESSMENT';

export interface Proof {
  id: string;
  subjectType: ProofSubject;
  subjectId: string;
  dataHash: string;
  hashAlgorithm: string;
  anchoringMode: 'DIRECT' | 'MERKLE_BATCH';
  status: string;
  anchoring: { state: string; onChain: boolean; note: string };
  createdAt: string;
  invalidatedAt: string | null;
  invalidationReason: string | null;
}
export interface ChainCheck {
  id: string;
  status: string;
  commitmentMatches: boolean | null;
  blockCanonical: boolean | null;
  confirmations: number | null;
  errorMessage: string | null;
  verifiedAt: string | null;
  metadata: { network?: string; onChain?: { explorerUrl?: string; transactionHash?: string; blockNumber?: number; anchoredAt?: string } } | null;
  createdAt: string;
}
export interface Inclusion {
  batchCode: string;
  leafIndex: number;
  leaf: { hashAlgorithm: string; dataHash: string; leafHash: string };
  proofPath: { position: 'LEFT' | 'RIGHT'; hash: string }[];
  rootHash: string;
  howToVerify: string;
}

export const NETWORK_TEXT: Record<string, string> = { POLYGON: 'Polygon', POLYGON_AMOY: 'Polygon Amoy (test network)', LOCAL: 'a local test chain' };
export const CHECK_TEXT: Record<string, string> = {
  VERIFIED: 'Verified on the blockchain',
  INSUFFICIENT_CONFIRMATIONS: 'On the blockchain, still being confirmed',
  TRANSACTION_NOT_FOUND: 'The transaction was not found',
  HASH_MISMATCH: 'The fingerprint does not match',
  MERKLE_PROOF_FAILED: 'The record is not in the anchored batch',
  REORG_DETECTED: 'The chain changed; MINMEG anchors it again',
  FAILED: 'The check failed',
  ERROR: 'The check could not be completed',
  PENDING: 'Being checked',
};
