import type { PageHelpContent } from '@/components/ui';

/* "About this page" for Inventory (step 2.5). Keep in step with what the page does. */
export const inventoryHelp: PageHelpContent = {
  title: 'Inventory',
  purpose: 'All the material your company physically has, kept as batches. A batch is one specific lot, such as "100 t of tin ore mined at Jos pit 3 in January". Each batch keeps its own origin and quantity history, which is what lets a buyer trace what they bought back to where it came from.',
  example: {
    title: 'tin ore from Jos',
    steps: [
      'Register 100 t of tin ore with Jos pit 3 as its origin. The 100 t becomes the first ledger entry.',
      'Mine another 50 t in March: register a new batch. New stock is never added to an old batch.',
      'A customer wants 60 t: split the first batch into 60 t and 40 t. The 100 t batch is retired and two new ones carry on, with their family recorded.',
      '2 t spills at the yard: change the quantity with a reason. The weighbridge later shows a different figure: record the measurement, and the difference goes into the ledger.',
    ],
  },
  links: [
    { label: 'My sites', href: '/dashboard/sites', why: 'A batch names where it came from and where it is now.' },
    { label: 'My documents', href: '/dashboard/documents', why: 'Attach assay results and origin papers to a batch from here.' },
    { label: 'Listings', why: 'A listing is the advert; the batch is the physical material behind it.', note: 'Coming in step 2.6' },
  ],
  goodToKnow: [
    "Quantities are never typed over. They only change through recorded movements, and history can't be edited.",
    "Split, merge and process can't be undone. Only merge batches that were physically mixed.",
    'Some materials have a limit set by MINMEG. A change above it waits for approval before the quantity moves.',
    'A batch on hold can\'t be sold or changed. If MINMEG placed the hold, only MINMEG can lift it.',
    'Batches are never deleted. Ended ones stay readable with "Include ended batches".',
  ],
};
