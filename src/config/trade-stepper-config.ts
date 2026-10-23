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
  PAYMENT_MODE_SELECTED: 'Payment Mode Selected',
  INSPECTION_PAYMENT_PENDING: 'Inspection Payment Pending',
  INSPECTION_PAYMENT_SENT: 'Inspection Payment Sent',
  INSPECTION_PAYMENT_CONFIRMED: 'Inspection Payment Confirmed',
  INSPECTION_PAYMENT_REFUNDED: 'Inspection Payment Refunded',
  PRODUCT_DEPOSIT_PENDING: 'Product Deposit Pending',
  PRODUCT_DEPOSIT_SENT: 'Product Deposit Sent',
  PRODUCT_DEPOSIT_CONFIRMED: 'Product Deposit Confirmed',
  PRODUCT_DEPOSIT_REFUNDED: 'Product Deposit Refunded',
  PRODUCT_PAYMENT_PENDING: 'Product Payment Pending',
  PRODUCT_PAYMENT_SENT: 'Product Payment Sent',
  PRODUCT_PAYMENT_CONFIRMED: 'Product Payment Confirmed',
  PRODUCT_BALANCE_PENDING: 'Product Balance Pending',
  PRODUCT_BALANCE_SENT: 'Product Balance Sent',
  PRODUCT_BALANCE_CONFIRMED: 'Product Balance Confirmed',
  INSPECTOR_PENDING: 'Awaiting Inspector Assignment',
  INSPECTOR_ASSIGNED: 'Inspector Appointed',
  INSPECTION_DOCUMENT_SENT: 'Inspection Document Sent',
  INSPECTOR_DOCUMENT_SIGNED: 'Inspection Document Signed',
  INSPECTION_SCHEDULED: 'Inspection Scheduled',
  INSPECTION_FEE_PAID: 'Inspection Payment Confirmed',
  INSPECTION_IN_PROGRESS: 'Inspection In Progress',
  SITE_VISIT: 'On-Site Verification & Sampling',
  LAB_ANALYSIS: 'Lab Analysis',
  REPORT_WRITING: 'Compiling Report',
  INSPECTION_COMPLETED: 'Inspection Report Submitted',
  INSPECTION_APPROVED: 'Quality Report Approved',
  QUALITY_VERIFICATION_APPROVED: 'Quality Approved',
  INSPECTION_BALANCE_PAID: 'Inspection Balance Paid',
  INSPECTION_CLOSED: 'Inspection Closed',
  RE_INSPECTION_REQUESTED: 'Re-Inspection Requested',
  TRADE_INFO_IN_PROGRESS: 'Inspection In Progress',
  TRADE_AGREEMENT_SENT: 'Trade Agreement Sent',
  TRADE_AGREEMENT_ACCEPTED: 'Trade Agreement Signed',
  LOGISTICS_PAYMENT_PENDING: 'Logistics Payment Pending',
  LOGISTICS_PAYMENT_SENT: 'Logistics Payment Sent',
  LOGISTICS_PAYMENT_CONFIRMED: 'Logistics Payment Confirmed',
  SHIPMENT_SCHEDULED: 'Shipment Scheduled',
  SHIPMENT_DISPATCHED: 'Goods Dispatched',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  DELIVERY_CONFIRMED: 'Delivery Confirmed',
  ESCROW_SETTLED: 'Payment Settled',
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
  { order: 3, name: 'Initial Trade Payment (Inspection / Deposit / Full)', slug: 'initial_trade_payment' },
  { order: 4, name: 'Quality Inspection', slug: 'quality_inspection' },
  { order: 5, name: 'Contract & Trade Agreement', slug: 'contract_trade_agreement' },
  { order: 6, name: 'Final Trade Payment (Product Settlement & Logistics)', slug: 'final_trade_payment' },
  { order: 7, name: 'Logistics & Shipment', slug: 'logistics_shipment' },
  { order: 8, name: 'Trade Completed', slug: 'completed' },
] as const;

export const BUYER_PRODUCT_STEPPER: RoleStepDefinition[] = [
  { step: 1, title: 'Inquiry Placed', matchingKeys: ['PENDING', 'ACKNOWLEDGED'], description: 'Buyer submitted inquiry with quantity, location, grade & delivery timeframe' },
  { step: 2, title: 'Procedural Documents Received', matchingKeys: ['BUYER_PROCEDURE_SENT', 'BUYER_PROCEDURE_ACCEPTED', 'SUPPLIER_TRADE_BRIEF_SENT', 'SUPPLIER_TRADE_BRIEF_ACCEPTED'], description: 'Admin sent procedural guide, T&C, and purchasing guidelines' },
  { step: 3, title: 'Trade Information Received', matchingKeys: ['FINAL_TRADE_PACK_SENT', 'FINAL_TRADE_PACK_ACCEPTED'], description: 'Received final trade document with confirmed specs, pricing & inspection scope' },
  { step: 4, title: 'Payment Mode Selected', matchingKeys: ['PAYMENT_MODE_SELECTED', 'INSPECTION_PAYMENT_PENDING', 'PRODUCT_DEPOSIT_PENDING', 'PRODUCT_PAYMENT_PENDING'], description: 'Buyer selected payment mode (full payment, inspection-only upfront, or part payment) for trade' },
  { step: 5, title: 'Initial / Trade Payment', matchingKeys: ['INSPECTION_PAYMENT_SENT', 'INSPECTION_PAYMENT_CONFIRMED', 'INSPECTION_PAYMENT_REFUNDED', 'PRODUCT_DEPOSIT_SENT', 'PRODUCT_DEPOSIT_CONFIRMED', 'PRODUCT_DEPOSIT_REFUNDED', 'PRODUCT_PAYMENT_SENT', 'PRODUCT_PAYMENT_CONFIRMED'], description: 'Buyer sent initial payment / deposit for invoice, verified by Admin' },
  { step: 6, title: 'Inspection In Progress', matchingKeys: ['INSPECTOR_PENDING', 'INSPECTOR_ASSIGNED', 'INSPECTION_DOCUMENT_SENT', 'INSPECTOR_DOCUMENT_SIGNED', 'INSPECTION_SCHEDULED', 'INSPECTION_PAYMENT_MODE_SELECTED', 'INSPECTION_INITIAL_PAYMENT_PENDING', 'INSPECTION_INITIAL_PAYMENT_CONFIRMED', 'SITE_VISIT', 'LAB_ANALYSIS', 'REPORT_WRITING', 'INSPECTION_COMPLETED'], description: 'Inspection partner conducting physical verification and lab testing' },
  { step: 7, title: 'Quality Approved / Re-Inspection', matchingKeys: ['INSPECTION_APPROVED', 'QUALITY_VERIFICATION_APPROVED', 'RE_INSPECTION_REQUESTED'], description: 'Buyer reviewed and approved inspection report or requested re-inspection' },
  { step: 8, title: 'Trade Agreement Confirmed', matchingKeys: ['TRADE_INFO_IN_PROGRESS', 'TRADE_AGREEMENT_SENT', 'TRADE_AGREEMENT_ACCEPTED'], description: 'Both parties signed the Min-meg Trade Agreement (Local/Incoterms)' },
  { step: 9, title: 'Product Settlement & Dispatch Authorization', matchingKeys: ['PRODUCT_BALANCE_PENDING', 'PRODUCT_BALANCE_SENT', 'PRODUCT_BALANCE_CONFIRMED', 'LOGISTICS_PAYMENT_PENDING', 'LOGISTICS_PAYMENT_SENT', 'LOGISTICS_PAYMENT_CONFIRMED'], description: 'Full product balance & logistics fee settled; supplier authorized to release shipment' },
  { step: 10, title: 'Dispatch & Transit Tracking', matchingKeys: ['SHIPMENT_SCHEDULED', 'SHIPMENT_DISPATCHED', 'IN_TRANSIT', 'DELIVERED'], description: 'Goods loaded and handed over to logistics carrier, in transit to destination' },
  { step: 11, title: 'Trade Completed', matchingKeys: ['DELIVERY_CONFIRMED', 'ESCROW_SETTLED', 'COMPLETED', 'CLOSED'], description: 'Buyer confirmed receipt of physical goods, funds released to supplier, trade closed' },
];


export const SUPPLIER_PRODUCT_STEPPER: RoleStepDefinition[] = [
  { step: 1, title: 'Inquiry Received', matchingKeys: ['PENDING'], description: 'Notification of new buyer inquiry on listed product' },
  { step: 2, title: 'Inquiry Acknowledged', matchingKeys: ['ACKNOWLEDGED'], description: 'Supplier acknowledged inquiry to open trade desk communication' },
  { step: 3, title: 'Trade Brief Received', matchingKeys: ['SUPPLIER_TRADE_BRIEF_SENT'], description: 'Received pre-filled Supplier Trade Brief from Admin' },
  { step: 4, title: 'Trade Brief Accepted', matchingKeys: ['PAYMENT_MODE_SELECTED', 'BUYER_PROCEDURE_SENT', 'BUYER_PROCEDURE_ACCEPTED', 'SUPPLIER_TRADE_BRIEF_ACCEPTED', 'FINAL_TRADE_PACK_SENT', 'FINAL_TRADE_PACK_ACCEPTED', 'INSPECTION_PAYMENT_PENDING', 'INSPECTION_PAYMENT_SENT', 'INSPECTION_PAYMENT_CONFIRMED'], description: 'Supplier confirmed product availability, specs & pricing breakdown' },
  { step: 5, title: 'Inspection Scheduled', matchingKeys: ['INSPECTOR_PENDING', 'INSPECTOR_ASSIGNED', 'INSPECTION_DOCUMENT_SENT', 'INSPECTOR_DOCUMENT_SIGNED', 'INSPECTION_SCHEDULED', 'INSPECTION_FEE_PAID', 'SITE_VISIT', 'LAB_ANALYSIS', 'REPORT_WRITING', 'INSPECTION_COMPLETED'], description: 'Admin appointed inspector for physical site audit and sample collection' },
  { step: 6, title: 'Inspection Approved', matchingKeys: ['INSPECTION_APPROVED', 'QUALITY_VERIFICATION_APPROVED', 'RE_INSPECTION_REQUESTED'], description: 'Buyer accepted quality inspection results' },
  { step: 7, title: 'Trade Agreement Confirmed', matchingKeys: ['TRADE_INFO_IN_PROGRESS', 'TRADE_AGREEMENT_SENT', 'TRADE_AGREEMENT_ACCEPTED'], description: 'Signed Min-meg Trade Agreement' },
  { step: 8, title: 'Dispatch Authorization', matchingKeys: ['PRODUCT_BALANCE_PENDING', 'PRODUCT_BALANCE_SENT', 'PRODUCT_BALANCE_CONFIRMED', 'LOGISTICS_PAYMENT_PENDING', 'LOGISTICS_PAYMENT_SENT', 'LOGISTICS_PAYMENT_CONFIRMED'], description: 'Buyer settled product balance; supplier authorized to release goods for loading' },
  { step: 9, title: 'Goods Dispatched & In Transit', matchingKeys: ['SHIPMENT_SCHEDULED', 'SHIPMENT_DISPATCHED', 'IN_TRANSIT', 'DELIVERED'], description: 'Product prepared, loaded and in transit to destination' },
  { step: 10, title: 'Payment Released / Closed', matchingKeys: ['DELIVERY_CONFIRMED', 'ESCROW_SETTLED', 'COMPLETED', 'CLOSED'], description: 'Payment released to supplier, trade closed' },
];

export const INSPECTOR_STEPPER: RoleStepDefinition[] = [
  { step: 1, title: 'Assignment Received', matchingKeys: ['ASSIGNED', 'INSPECTOR_ASSIGNED', 'INSPECTOR_PENDING'], description: 'Received new inspection request from Admin' },
  { step: 2, title: 'Review & Accept Job', matchingKeys: ['INSPECTION_DOCUMENT_SENT', 'INSPECTOR_DOCUMENT_SIGNED'], description: 'Inspector reviews terms and accepts job' },
  { step: 3, title: 'Inspection Scheduled', matchingKeys: ['ACCEPTED', 'SCHEDULED', 'INSPECTION_SCHEDULED'], description: 'Inspection date and site visit timeline confirmed' },
  { step: 4, title: 'Inspection Payment', matchingKeys: ['INSPECTION_FEE_PAID'], description: 'Inspection payment confirmed on the platform' },
  { step: 5, title: 'On-Site Verification & Sampling', matchingKeys: ['SITE_VISIT'], description: 'Inspector on-site conducting physical verification and sampling' },
  { step: 6, title: 'Laboratory Testing', matchingKeys: ['LAB_ANALYSIS', 'REPORT_WRITING'], description: 'Samples undergoing laboratory assay testing' },
  { step: 7, title: 'Report Submitted', matchingKeys: ['INSPECTION_COMPLETED'], description: 'Certificate of Analysis (COA) uploaded and submitted' },
  { step: 8, title: 'Quality Report Approved', matchingKeys: ['INSPECTION_APPROVED', 'QUALITY_VERIFICATION_APPROVED'], description: 'Quality verification approved and released' },
  { step: 9, title: 'Inspection Closed', matchingKeys: ['INSPECTION_BALANCE_PAID', 'INSPECTION_CLOSED', 'CLOSED', 'ESCROW_SETTLED', 'COMPLETED'], description: 'Final payout completed and inspection engagement closed' },
];

export function getRoleStepNumber(steps: RoleStepDefinition[], status?: string): number {
  if (!status) return 1;
  const upper = status.toUpperCase().trim();

  for (const stepDef of steps) {
    if (stepDef.matchingKeys.includes(upper)) {
      return stepDef.step;
    }
  }

  return 1;
}

export function resolveMerchantSpokeRole(userRole?: string, isSupplier?: boolean, isInspector?: boolean): 'buyer' | 'supplier' | 'inspector' {
  if (isInspector) return 'inspector';
  if (isSupplier) return 'supplier';
  const role = (userRole || 'buyer').toLowerCase();
  if (role === 'inspector') return 'inspector';
  if (role === 'supplier') return 'supplier';
  return 'buyer';
}
