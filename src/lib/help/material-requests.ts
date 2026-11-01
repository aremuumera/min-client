import type { PageHelpContent } from '@/components/ui';

/* "About this page" for My requests (decisions #98, #99). Keep in step with what the page does. */
export const materialRequestsHelp: PageHelpContent = {
  title: 'My requests',
  purpose: "When a material or category you need isn't on MINMEG's lists, or you need something else from MINMEG, you ask here. This page shows everything your company has asked for and what MINMEG answered. Everyone in your company with access to products sees the same requests. Other companies can't see them.",
  example: {
    title: 'asking for Beryl Ore',
    steps: [
      'You choose New request, or use the link under the material picker on a new listing, and enter Beryl Ore.',
      'It shows here as Waiting for MINMEG.',
      'MINMEG adds it, or points you to a material that already exists. You get a notification and an email, and it shows as Added.',
      'If MINMEG refuses, you see the reason here and can ask again with more detail.',
    ],
  },
  links: [
    { label: 'New listing', href: '/dashboard/supplier-list/create', why: 'Once a material is added, you can choose it when you create a listing.' },
  ],
  goodToKnow: [
    'Your request and note stay private to your company and MINMEG.',
    'A material or category MINMEG adds goes on the shared list, so everyone on MINMEG can use it.',
    "You can't have two requests of the same type waiting for the same name.",
  ],
};
