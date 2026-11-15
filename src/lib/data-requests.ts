/* Data requests (decision #137): someone without a MINMEG account asks for more of one of your passports; MINMEG checks first, you decide */
export type DataRequestStatus = 'OWNER_REVIEW' | 'APPROVED' | 'DECLINED' | 'WITHDRAWN' | 'REVOKED' | 'EXPIRED';
export const OWNER_STATUSES: DataRequestStatus[] = ['OWNER_REVIEW', 'APPROVED', 'DECLINED', 'WITHDRAWN', 'REVOKED', 'EXPIRED'];
export type DisclosureScope = 'PARTNERS' | 'PARTNERS_AND_PRIVATE';

const STATUS_LABEL: Record<string, string> = { OWNER_REVIEW: 'Waiting for you', APPROVED: 'Approved', DECLINED: 'Declined', WITHDRAWN: 'Withdrawn', REVOKED: 'Access ended', EXPIRED: 'Expired' };
export const dataRequestStatusLabel = (s: string) => STATUS_LABEL[s] ?? s;
export const dataRequestTone = (s: string) => (s === 'APPROVED' ? 'success' : s === 'OWNER_REVIEW' ? 'warning' : s === 'DECLINED' || s === 'REVOKED' ? 'error' : 'neutral') as 'success' | 'warning' | 'error' | 'neutral';

export const ROLE_LABEL: Record<string, string> = { REGULATOR: 'Regulator or authority', AUDITOR: 'Auditor', CUSTOMER: 'Customer further down the supply chain', INVESTOR: 'Investor or lender', RESEARCHER: 'Researcher or journalist', OTHER: 'Other' };
export const SCOPE_LABEL: Record<DisclosureScope, string> = { PARTNERS: 'Partner data', PARTNERS_AND_PRIVATE: 'Partner and private data' };
export const EVENT_LABEL: Record<string, string> = {
  REQUESTED: 'They asked',
  EMAIL_CONFIRMED: 'They confirmed their email',
  FORWARDED_TO_OWNER: 'MINMEG passed it to you',
  QUESTION_ASKED: 'MINMEG asked them a question',
  ANSWERED: 'They answered',
  APPROVED: 'You approved',
  DECLINED: 'Declined',
  WITHDRAWN: 'They withdrew it',
  REVOKED: 'Access ended',
  OPENED: 'They opened the data',
};

export interface DataRequestRow {
  id: string;
  requestCode: string;
  passportId: string;
  passportCode: string | null;
  requester: { name: string; email: string; organization: string; role: string; purpose: string };
  status: DataRequestStatus;
  scope: DisclosureScope | null;
  expiresAt: string | null;
  forwardedAt: string | null;
  decidedAt: string | null;
  createdAt: string;
}
export interface DisclosedField {
  key: string;
  label: string;
  visibilityLevel: 'PUBLIC' | 'PARTNERS' | 'PRIVATE';
  value: unknown;
  document?: string;
}
export interface DataRequestDetail extends DataRequestRow {
  purpose: string;
  decisionNote: string | null;
  disclosureHash: string | null;
  disclosure: { versionNumber: number; approvedAt: string; fields: DisclosedField[] } | null;
  openCount: number;
  shareable: { published: boolean; publicFields: number; partnersFields: number; privateFields: number };
  events: { id: string; type: string; actorType: string; note: string | null; createdAt: string }[];
  nextSteps: ('APPROVE' | 'DECLINE' | 'REVOKE')[];
}
