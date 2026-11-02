import type { PageHelpContent } from '@/components/ui';

/* "About this page" for the trade inquiry pages (step 2.6c). Keep in step with what the pages do. */
export const myInquiriesHelp: PageHelpContent = {
  title: 'Trade Inquiries',
  purpose: 'The inquiries you sent on listed products, and where each one has got to. Every conversation about a trade goes through the MINMEG Trade Desk in its trade room.',
  example: {
    title: 'a supplier cannot supply',
    steps: [
      'You send an inquiry for 30 t of lithium ore. It waits for the supplier to answer.',
      'The supplier rejects it. You talk to the Trade Desk in your trade room.',
      'If you agree, staff give your request to another supplier. The old row says Replaced, and the new one says which inquiry it replaces.',
    ],
  },
  links: [{ label: 'Marketplace', href: '/marketplace/products', why: 'Where you find a listing and send an inquiry.' }],
  goodToKnow: [
    'You can only send an inquiry on a listing that is on sale.',
    'Stock is held for you when the supplier acknowledges. You can see it in the Stock tab of the trade room.',
  ],
};

export const receivedInquiriesHelp: PageHelpContent = {
  title: 'Received Inquiries',
  purpose: 'Inquiries from buyers on your listings. Acknowledge one to open the trade, or reject it with a reason.',
  example: {
    title: 'a buyer asks for 30 t',
    steps: [
      'An inquiry arrives as a New Request.',
      'You acknowledge it. 30 t is held on the batches behind the listing.',
      'If you only have 20 t free, the acknowledgement is refused and tells you what is available.',
    ],
  },
  links: [
    { label: 'Inventory', href: '/dashboard/batches', why: 'The batches that supply your listings.' },
    { label: 'My listings', href: '/dashboard/supplier-list', why: 'Add stock to a listing or check its quantity.' },
  ],
  goodToKnow: [
    'Held stock is released after 7 days without trade activity. Any step in the trade renews the hold.',
    'You can see, add and release holds in the Stock tab of the trade room.',
    'A tool, equipment or service has no batches. Its quantity goes down when the trade is accepted, and back up if the trade is cancelled.',
  ],
};
