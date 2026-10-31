import type { PageHelpContent } from '@/components/ui';

/* "About this page" for the documents pages (step 2.3). Keep in step with what the pages do. */

export const documentsHelp: PageHelpContent = {
  title: 'Documents',
  purpose:
    "Your company's secure document vault: licences, contracts, assay reports, certificates and evidence. Files are stored exactly as uploaded, with a fingerprint (SHA-256) that proves they were never changed. Only your company can open them until you share them, and every open is logged.",
  example: {
    title: 'proving a tin shipment to a buyer',
    steps: [
      'Make a folder "Lot 12 – cassiterite" and upload the mining licence, the export permit and the lab assay (PDF).',
      'The buyer in Rotterdam asks for the assay: open it, choose "Share links", and send a link to their compliance officer\'s email. They get a 6-digit code each time they open it.',
      'Their bank needs the contract for a week: give their company access until a date, view only.',
      'The access log shows exactly when the bank opened it. When the deal closes, revoke the link.',
    ],
  },
  links: [
    { label: 'Shared with me', href: '/dashboard/documents/shared', why: 'Documents other companies have given you access to.' },
    { label: 'Trades', why: "Documents can be shared with a trade's buyer, supplier and inspectors at once.", href: '/dashboard/my-trade-inquiries' },
    { label: 'Batches and passports', why: 'Evidence from your vault will be attached to batches and passports.', note: 'Coming in steps 2.5 and 2.9' },
  ],
  goodToKnow: [
    'PDF, pictures, Word, Excel, CSV and text, up to 20 MB each.',
    'Files are never compressed or changed, so they can serve as evidence.',
    'Preview and download links last 10 minutes; share links at most 30 days, unless a public link has no end date.',
    'Files under legal hold, or attached as evidence, cannot be deleted.',
  ],
};

export const sharedWithMeHelp: PageHelpContent = {
  title: 'Shared with me',
  purpose: 'Documents and records other companies on MINMEG have given your company access to, and until when. You can open what they allowed; they can take access back at any time.',
  example: {
    title: "a supplier's export permit",
    steps: [
      'Your supplier in Jos gives your company access to their export permit for Lot 12.',
      'It appears here with what you may do (see it, download it) and the end date.',
      'Open it to check before you pay the deposit. The supplier sees in their access log that you opened it.',
    ],
  },
  links: [{ label: 'Documents', href: '/dashboard/documents', why: "Your own company's vault." }],
  goodToKnow: ['Access ends on its end date, or as soon as the owner removes it.'],
};
