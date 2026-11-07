/* Payment and shipping terms offered on listings and RFQs */
export const paymentTerms = [
  { code: 'T/T', name: 'Telegraphic Transfer' },
  { code: 'L/C', name: 'Letter of Credit' },
  { code: 'D/P', name: 'Documents Against Payment' },
  { code: 'D/A', name: 'Documents Against Acceptance' },
  { code: 'D/D', name: 'Demand Draft' },
  { code: 'PayPal', name: 'Online Payment Service' },
  { code: 'Other', name: 'Other' },
];
export const shippingTerms = [
  { code: 'EXW', name: 'Ex Works' },
  { code: 'FAS', name: 'Free Alongside Ship' },
  { code: 'FOB', name: 'Free On Board' },
  { code: 'FCA', name: 'Free Carrier' },
  { code: 'CFR', name: 'Cost and Freight' },
  { code: 'CPT', name: 'Carriage Paid To' },
  { code: 'CIF', name: 'Cost, Insurance, and Freight' },
  { code: 'DAP', name: 'Delivered At Place' },
  { code: 'DDP', name: 'Delivered Duty Paid' },
  { code: 'DPU', name: 'Delivered at Place Unloaded' },
  { code: 'Other', name: 'Other' },
];

/** Packaging choices; the last one means the supplier or buyer types their own */
export const PACKAGING_OPTIONS = [
  { value: '50kg bags', label: '50kg Bags' },
  { value: '1 ton bags', label: '1 Ton Bags' },
  { value: 'Jumbo bags', label: 'Jumbo Bags (FIBC)' },
  { value: 'Bulk', label: 'Bulk (Loose)' },
  { value: 'Drums', label: 'Drums' },
  { value: 'Containers', label: 'Containers' },
  { value: 'Custom', label: 'Custom Packaging' },
];

export const SAMPLING_OPTIONS = [
  { value: 'SGS', label: 'SGS' },
  { value: 'Bureau Veritas', label: 'Bureau Veritas' },
  { value: 'Intertek', label: 'Intertek' },
  { value: 'Alex Stewart', label: 'Alex Stewart' },
  { value: 'ASTM standard', label: 'ASTM standard' },
];
