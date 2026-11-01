import type { PageHelpContent } from '@/components/ui';

/* "About this page" for Material requests (decision #98). Keep in step with what the page does. */
export const materialRequestsHelp: PageHelpContent = {
  title: 'Material requests',
  purpose: "When the material you sell isn't in the list, you ask MINMEG to add it. This page shows everything your company has asked for and what MINMEG answered. Everyone in your company with access to products sees the same requests. Other companies can't see them.",
  example: {
    title: 'asking for Beryl Ore',
    steps: [
      'You choose "Ask for a material", or use the link under the material picker on a new listing, and enter Beryl Ore.',
      'It shows here as Waiting for MINMEG.',
      'MINMEG adds it, or points you to a material that already exists. You get a notification and it shows as Added.',
      'If MINMEG refuses, you see the reason here and can ask again with more detail.',
    ],
  },
  links: [
    { label: 'New listing', href: '/dashboard/supplier-list/create', why: 'Once a material is added, you can choose it when you create a listing.' },
  ],
  goodToKnow: [
    'Your request and note stay private to your company and MINMEG.',
    'A material MINMEG adds goes on the shared list, so every supplier can use it.',
    'You can\'t have two requests waiting for the same name.',
  ],
};
