/**
 * Trade Stepper Configuration for Merchant Portal
 * Exported status arrays and helper functions for easy access, editing, and updating.
 */

export const TRADE_PACK_TYPES = {
  BUYER_PROCEDURE_GUIDE: 'buyer_procedure_guide',
  SUPPLIER_TRADE_BRIEF: 'supplier_trade_brief',
  FINAL_TRADE_PACK: 'final_trade_pack',
  TRADE_AGREEMENT_PACK: 'trade_agreement_pack',
  INSPECTION_ASSIGNMENT_BRIEF: 'inspection_assignment_brief',
} as const;

export const HUMAN_STATUS_MAP: Record<string, string> = {
  PENDING: 'Inquiry Placed',
  ACKNOWLEDGED: 'Inquiry Acknowledged',
  BUYER_PROCEDURE_SENT: 'Procedure Guide Sent',
  BUYER_PROCEDURE_ACCEPTED: 'Procedures Accepted',
  SUPPLIER_TRADE_BRIEF_SENT: 'Trade Brief Sent',
  SUPPLIER_TRADE_BRIEF_ACCEPTED: 'Trade Brief Accepted',
  FINAL_TRADE_PACK_SENT: 'Final Trade Pack Sent',
  FINAL_TRADE_PACK_ACCEPTED: 'Trade Info Pack Accepted',
  INSPECTION_PAYMENT_PENDING: 'Inspection Payment Pending',
  INSPECTION_PAYMENT_SENT: 'Inspection Payment Sent',
  INSPECTION_PAYMENT_CONFIRMED: 'Inspection Payment Confirmed',
  INSPECTOR_ASSIGNED: 'Inspection In Progress',
  INSPECTION_IN_PROGRESS: 'Inspection In Progress',
  SITE_VISIT: 'On-Site Audit',
  LAB_ANALYSIS: 'Lab Analysis',
  REPORT_WRITING: 'Report Writing',
  INSPECTION_COMPLETED: 'Inspection Completed',
  INSPECTION_APPROVED: 'Quality Approved',
  QUALITY_VERIFICATION_APPROVED: 'Quality Approved',
  RE_INSPECTION_REQUESTED: 'Re-Inspection Requested',
  TRADE_INFO_IN_PROGRESS: 'Inspection In Progress',
  TRADE_AGREEMENT_SENT: 'Trade Agreement Sent',
  TRADE_AGREEMENT_ACCEPTED: 'Trade Agreement Signed',
  LOGISTICS_PAYMENT_PENDING: 'Logistics Payment Pending',
  LOGISTICS_PAYMENT_CONFIRMED: 'Logistics Payment Confirmed',
  SHIPMENT_SCHEDULED: 'Shipment Scheduled',
  SHIPMENT_DISPATCHED: 'Goods Dispatched',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  DELIVERY_CONFIRMED: 'Delivery Confirmed',
  ESCROW_SETTLED: 'Escrow Settled',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  CLOSED: 'Closed',
};

export function formatTradeStatusLabel(rawStatus?: string): string {
  if (!rawStatus) return 'In Progress';
  const cleanKey = String(rawStatus).toUpperCase().trim();
  if (HUMAN_STATUS_MAP[cleanKey]) {
    return HUMAN_STATUS_MAP[cleanKey];
  }
  return cleanKey.replace(/_/g, ' ');
}

export interface RoleLabels {
  buyer: string;
  supplier: string;
  inspector: string;
  admin: string;
}

export interface SubStatusConfig {
  key: string;
  label: string;
  description?: string;
  role_labels: RoleLabels;
}

export interface TradeStageDefinition {
  stage_order: number;
  name: string;
  slug: string;
  trade_type: 'product' | 'rfq';
  trade_pack_type?: string | null;
  sub_statuses: SubStatusConfig[];
}

export interface RoleStepDefinition {
  step: number;
  title: string;
  matchingKeys: string[];
  description: string;
}

export const MAIN_TRADE_PHASES = [
  { order: 1, name: 'Trade Initiated', slug: 'trade_initiated' },
  { order: 2, name: 'Trade Documents & Confirmation', slug: 'trade_documents_confirmation' },
  { order: 3, name: 'Payment (Inspection)', slug: 'payment_inspection' },
  { order: 4, name: 'Quality Inspection', slug: 'quality_inspection' },
  { order: 5, name: 'Contract & Trade Agreement', slug: 'contract_trade_agreement' },
  { order: 6, name: 'Payment (Logistics & Product)', slug: 'payment_logistics_product' },
  { order: 7, name: 'Logistics & Shipment', slug: 'logistics_shipment' },
  { order: 8, name: 'Trade Completed', slug: 'completed' },
] as const;

export const BUYER_PRODUCT_STEPPER: RoleStepDefinition[] = [
  { step: 1, title: 'Inquiry Placed', matchingKeys: ['PENDING'], description: 'Buyer submitted inquiry with quantity, location, grade & delivery timeframe' },
  { step: 2, title: 'Procedural Documents Received', matchingKeys: ['BUYER_PROCEDURE_SENT', 'BUYER_PROCEDURE_ACCEPTED'], description: 'Admin sent procedural guide, T&C, purchasing and escrow guidelines' },
  { step: 3, title: 'Trade Information Received', matchingKeys: ['FINAL_TRADE_PACK_SENT', 'FINAL_TRADE_PACK_ACCEPTED'], description: 'Received final trade document with confirmed specs, pricing & inspection scope' },
  { step: 4, title: 'Payment Mode Selected', matchingKeys: ['INSPECTION_PAYMENT_PENDING'], description: 'Buyer selected payment mode (escrow, upfront, or full) for trade' },
  { step: 5, title: 'Inspection Payment Sent', matchingKeys: ['INSPECTION_PAYMENT_SENT', 'INSPECTION_PAYMENT_CONFIRMED'], description: 'Buyer sent payment for inspection, verified by Admin' },
  { step: 6, title: 'Inspection In Progress', matchingKeys: ['INSPECTOR_ASSIGNED', 'INSPECTION_IN_PROGRESS', 'SITE_VISIT', 'LAB_ANALYSIS', 'REPORT_WRITING', 'INSPECTION_COMPLETED'], description: 'Inspection partner conducting physical verification and lab testing' },
  { step: 7, title: 'Quality Approved / Re-Inspection', matchingKeys: ['INSPECTION_APPROVED', 'QUALITY_VERIFICATION_APPROVED', 'RE_INSPECTION_REQUESTED'], description: 'Buyer reviewed and approved inspection report or requested re-inspection' },
  { step: 8, title: 'Trade Agreement Confirmed', matchingKeys: ['TRADE_INFO_IN_PROGRESS', 'TRADE_AGREEMENT_SENT', 'TRADE_AGREEMENT_ACCEPTED'], description: 'Both parties signed the Min-meg Trade Agreement (Local/Incoterms)' },
  { step: 9, title: 'Logistics & Shipment', matchingKeys: ['LOGISTICS_PAYMENT_CONFIRMED', 'SHIPMENT_SCHEDULED', 'SHIPMENT_DISPATCHED', 'IN_TRANSIT', 'DELIVERED'], description: 'Logistics arranged, goods dispatched and in transit to destination' },
  { step: 10, title: 'Trade Completed', matchingKeys: ['DELIVERY_CONFIRMED', 'ESCROW_SETTLED', 'COMPLETED', 'CLOSED'], description: 'Buyer confirmed receipt, payment settled, transaction archived' },
];

export const SUPPLIER_PRODUCT_STEPPER: RoleStepDefinition[] = [
  { step: 1, title: 'Inquiry Received', matchingKeys: ['PENDING'], description: 'Notification of new buyer inquiry on listed product' },
  { step: 2, title: 'Inquiry Acknowledged', matchingKeys: ['ACKNOWLEDGED'], description: 'Supplier acknowledged inquiry to open trade desk communication' },
  { step: 3, title: 'Trade Brief Received', matchingKeys: ['SUPPLIER_TRADE_BRIEF_SENT'], description: 'Received pre-filled Supplier Trade Brief from Admin' },
  { step: 4, title: 'Trade Brief Accepted', matchingKeys: ['SUPPLIER_TRADE_BRIEF_ACCEPTED', 'FINAL_TRADE_PACK_SENT'], description: 'Supplier confirmed product availability, specs & pricing breakdown' },
  { step: 5, title: 'Inspection Scheduled', matchingKeys: ['INSPECTOR_ASSIGNED', 'INSPECTION_IN_PROGRESS', 'INSPECTION_COMPLETED'], description: 'Admin appointed inspector for physical site audit and sample collection' },
  { step: 6, title: 'Inspection Approved', matchingKeys: ['INSPECTION_APPROVED', 'QUALITY_VERIFICATION_APPROVED'], description: 'Buyer accepted quality inspection results' },

  { step: 7, title: 'Trade Agreement Confirmed', matchingKeys: ['TRADE_AGREEMENT_ACCEPTED'], description: 'Signed Min-meg Trade Agreement' },
  { step: 8, title: 'Goods Dispatched', matchingKeys: ['SHIPMENT_SCHEDULED', 'SHIPMENT_DISPATCHED', 'IN_TRANSIT', 'DELIVERED'], description: 'Product prepared and handed over to platform logistics' },
  { step: 9, title: 'Payment Released / Closed', matchingKeys: ['ESCROW_SETTLED', 'COMPLETED', 'CLOSED'], description: 'Escrow payment released to supplier, trade closed' },
];

export const INSPECTOR_STEPPER: RoleStepDefinition[] = [
  { step: 1, title: 'Assignment Received', matchingKeys: ['ASSIGNED', 'INSPECTOR_ASSIGNED'], description: 'Received new inspection assignment request from Admin' },
  { step: 2, title: 'Assignment Accepted', matchingKeys: ['ACCEPTED'], description: 'Inspector accepted assignment and confirmed site visit timeline' },
  { step: 3, title: 'On-Site Inspection', matchingKeys: ['SITE_VISIT'], description: 'Inspector on-site conducting physical verification & random sampling' },
  { step: 4, title: 'Lab Analysis', matchingKeys: ['LAB_ANALYSIS'], description: 'Samples undergoing laboratory quality & purity testing' },
  { step: 5, title: 'Report Writing', matchingKeys: ['REPORT_WRITING'], description: 'Compiling final verification certificate & test report' },
  { step: 6, title: 'Report Submitted', matchingKeys: ['INSPECTION_COMPLETED', 'COMPLETED'], description: 'Uploaded report to Admin for validation' },
  { step: 7, title: 'Admin Review & Release', matchingKeys: ['INSPECTION_APPROVED', 'QUALITY_VERIFICATION_APPROVED'], description: 'Admin reviewed and released report to Buyer' },
  { step: 8, title: 'Inspection Closed', matchingKeys: ['CLOSED', 'ESCROW_SETTLED'], description: 'Inspection payout authorized and assignment closed' },
];

export function resolveMerchantSpokeRole(userRole?: string, isSupplier?: boolean, isInspector?: boolean): 'buyer' | 'supplier' | 'inspector' {
  if (isInspector) return 'inspector';
  if (isSupplier) return 'supplier';
  const role = (userRole || 'buyer').toLowerCase();
  if (role === 'inspector') return 'inspector';
  if (role === 'supplier') return 'supplier';
  return 'buyer';
}
