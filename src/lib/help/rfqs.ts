import type { PageHelpContent } from '@/components/ui';

/* "About this page" for RFQs and offers (step 2.6b). Keep in step with what the pages do. */
export const myRfqsHelp: PageHelpContent = {
  title: 'My RFQs',
  purpose: "An RFQ tells suppliers and MINMEG what you need, how much, and where. It doesn't need to be on any list: type what you are looking for, and MINMEG helps source it. Suppliers answer with offers, you compare and shortlist them, and the MINMEG Trade Desk accepts one, which starts the trade.",
  example: {
    title: 'sourcing lithium ore',
    steps: [
      'You post "Lithium ore, 200 t" with a deadline at the end of the month and a delivery address in Lagos.',
      'Suppliers send offers until the deadline. Each sees only their own offer.',
      'You open the Offer Board, compare three offers and shortlist the best.',
      'The Trade Desk accepts it and the trade room opens with that supplier.',
    ],
  },
  links: [{ label: 'Offer Board', href: '/dashboard/rfq/offers', why: 'Where you compare and shortlist the offers on an RFQ.' }],
  goodToKnow: [
    'A draft can be saved without a deadline, but publishing needs one.',
    'Suppliers see the country and state. Only the supplier whose offer is accepted sees your full address.',
    'You can edit or cancel while it is draft or published. An RFQ that has offers can be cancelled but not deleted.',
    'An RFQ past its deadline expires by itself, and any offers still open are declined.',
  ],
};

export const offerBoardHelp: PageHelpContent = {
  title: 'Offer Board',
  purpose: 'The offers suppliers sent on your RFQ, side by side. Shortlisting tells the MINMEG Trade Desk which ones you prefer. The Trade Desk accepts the final one.',
  example: {
    title: 'choosing between three offers',
    steps: [
      'Choose your RFQ at the top to see its offers.',
      'Tick up to three and press Compare to see them side by side.',
      'Shortlist the ones you like. You can remove one from the shortlist until it is accepted.',
    ],
  },
  links: [{ label: 'My RFQs', href: '/dashboard/rfq-list', why: 'The RFQs these offers answer.' }],
  goodToKnow: ['Suppliers can revise an offer until it is accepted. You always see the latest version.'],
};

export const myOffersHelp: PageHelpContent = {
  title: 'My Submitted Offers',
  purpose: "Every offer your company sent on an RFQ, and where each one stands. Other suppliers can't see your offers, and you can't see theirs.",
  example: {
    title: 'improving an offer',
    steps: [
      'You send an offer on an RFQ for 30 t at a price per tonne.',
      'Before it is accepted, you open the RFQ again and revise your price. This makes a new version, and the old one stays in its history.',
      'Once the Trade Desk accepts it, it becomes a trade and can no longer be changed.',
    ],
  },
  links: [{ label: 'Live RFQs', href: '/dashboard/products/rfq-products', why: 'Find RFQs to answer.' }],
  goodToKnow: ['After your offer is accepted, you allocate the batches that supply it in the trade.'],
};
