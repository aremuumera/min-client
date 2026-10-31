import type { PageHelpContent } from '@/components/ui';

/* "About this page" for My sites (step 2.4). Keep in step with what the page does. */
export const sitesHelp: PageHelpContent = {
  title: 'My sites',
  purpose: "The real places your company uses: mines, warehouses, processing plants, delivery sites. You add each once, then batches and shipments point to it instead of retyping the address. Each site can have checkpoints, such as a gate or weighbridge, saying what a shipment must prove there. Only your company and MINMEG can see your exact positions.",
  example: {
    title: 'a tin mine in Jos',
    steps: [
      'Add "Jos tin mine, pit 3" (kind: Mine), drop a pin on the map and set a 500 m zone.',
      'Add the checkpoint "Main weighbridge": scan a code, be inside the zone, and record a Mass measurement compared with the quantity shipped.',
      'Register a batch of cassiterite with this mine as its origin.',
      'A truck leaves with 30 t. At the weighbridge MINMEG checks the GPS and the weight, and a difference is flagged instead of passing silently.',
    ],
  },
  links: [
    { label: 'Inventory', href: '/dashboard/batches', why: 'A batch names where it came from and where it is now.' },
    { label: 'Shipments', why: "A shipment goes from one site to another, through checkpoints.", note: 'Coming in step 2.7' },
  ],
  goodToKnow: [
    'Sites marked Shared are added by MINMEG, such as a public port. You can use them but not change them.',
    'The code is fixed once created. Sites are deactivated, not deleted; deactivate their checkpoints first.',
    'A checkpoint with a GPS check needs a position or outline, on itself or on its site.',
  ],
};
