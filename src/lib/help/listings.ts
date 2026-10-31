import type { PageHelpContent } from '@/components/ui';

/* "About this page" for My listings (step 2.6). Keep in step with what the page does. */
export const listingsHelp: PageHelpContent = {
  title: 'My listings',
  purpose: 'What you offer for sale on MINMEG. A listing is the advert: name, price and terms. Its batches are the real material behind it, and buyers see what those batches have available. Stock in Inventory is only for sale once it is on a listing.',
  example: {
    title: 'selling tin ore',
    steps: [
      'You have two batches of tin ore in Inventory: 60 t and 40 t.',
      'Create a listing, tick both batches, add pictures and a price, and publish. Buyers see 100 t.',
      'You sell 30 t to someone outside MINMEG, so you record that on the batch in Inventory. Buyers now see 70 t.',
      'One batch goes on hold while an assay is checked. It stops counting until it is released, and the Stock tab says why.',
    ],
  },
  links: [
    { label: 'Inventory', href: '/dashboard/batches', why: 'The batches behind your listings. Quantities change there, not here.' },
    { label: 'My sites', href: '/dashboard/sites', why: 'Where a listing is offered from.' },
  ],
  goodToKnow: [
    "Quantity can't be typed. It always comes from the batches.",
    'To publish you need stock and at least 5 pictures. Drafts need neither.',
    'One batch can only be on one active listing, and it is listed whole. To sell part of it, split it in Inventory first.',
    'Pausing hides a listing for now. Closing frees its batches for another listing, and you can relist it later. Stock is never touched.',
    "Listings aren't deleted. Archive one to keep it as history.",
  ],
};
