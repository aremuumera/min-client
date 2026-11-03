import type { PageHelpContent } from '@/components/ui';

/* "About this page" for shipments (step 2.7a). Keep in step with what the pages do. */
export const shipmentsHelp: PageHelpContent = {
  title: 'Shipments',
  purpose: 'A shipment is one truck, container or other movement of goods for a trade. One trade can need several. Suppliers plan and dispatch them; buyers record what arrived.',
  example: {
    title: 'two trucks for 30 t',
    steps: [
      'After Trade Accepted, the supplier plans truck 1 with 20 t and truck 2 with 10 t.',
      'When truck 1 leaves, the supplier dispatches it. The 20 t leaves the batch and the trade room moves to Shipped.',
      'At the port the buyer records 19.8 t received. A small difference is recorded at once; a bigger one waits for MINMEG staff.',
      'If the buyer rejects part of it, either side can start a return. The goods go back into the same batch, which is held for checking.',
    ],
  },
  links: [
    { label: 'Trade Chat', href: '/dashboard/chat', why: 'Each trade room has a Shipments tab for that trade.' },
    { label: 'My sites', href: '/dashboard/sites', why: 'Where goods leave from and arrive at.' },
  ],
  goodToKnow: [
    'MINMEG plans the checkpoints on the way. A MINMEG tracker records each passage when the truck enters the checkpoint zone. Without a tracker, the company that runs that checkpoint records it, never the supplier. The receiver marks the goods arrived.',
    'Only stock committed at Trade Accepted can go on a shipment. Tools, equipment and services have no shipments.',
    'Dispatch waits until MINMEG has proceeded the inspection and the goods carry active MINMEG codes.',
    'Buyers see the status, dates, quantities, material, batch codes and destination. The driver, vehicle, carrier and the supplier\'s site stay with the supplier and MINMEG. On a return, which the buyer can move, the buyer sees everything except the supplier\'s site.',
    'A planned shipment can be cancelled. Once it has left, it can only be delivered, rejected or returned.',
  ],
};
