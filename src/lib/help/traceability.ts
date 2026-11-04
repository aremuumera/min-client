import type { PageHelpContent } from '@/components/ui';

/* "About this page" for scanning and handovers (step 2.7c). Keep in step with what the pages do. */
export const scanHelp: PageHelpContent = {
  title: 'Scan a code',
  purpose: 'Check a MINMEG label on a bag, drum, container or batch. You see whether the code is genuine and active, and what the goods are when you are allowed to know.',
  example: {
    title: 'checking a delivery at the gate',
    steps: ['Point the camera at the label on a bag.', 'MINMEG says whether it is a genuine, active code.', 'A copied or changed label is flagged to MINMEG straight away.'],
  },
  goodToKnow: ['Every scan is recorded, with the place when your location is on.', 'If the camera does not work, type the MNG reference printed under the QR.'],
};

export const handoversHelp: PageHelpContent = {
  title: 'Handovers',
  purpose: 'Who physically holds the goods. When goods are handed to your company, you accept or refuse here. Handovers you sent wait here until the receiver answers.',
  example: {
    title: 'goods handed over at a warehouse',
    steps: ['The supplier hands a batch to your company.', 'It appears under Waiting for you. You check the goods, then accept.', 'If something is wrong, refuse it with a reason, or dispute it later. MINMEG decides disputes.'],
  },
  goodToKnow: ['Holding goods is not the same as owning them.', 'A handover not accepted within 2 hours sends MINMEG a reminder. It never blocks the trade.', 'Dispatch hands goods to the carrier, and delivery to the buyer, by themselves.'],
};
