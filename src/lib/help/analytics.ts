import type { PageHelpContent } from '@/components/ui';

/* "About this page" for analytics (step 2.14). Keep in step with what the page does. */
export const analyticsHelp: PageHelpContent = {
  title: 'Analytics',
  purpose:
    'How your business on MINMEG is going, worked out from your own records: trades and requests, shipments, stock, inspections and lab grades, passports, certificates and compliance, ESG and carbon, and alerts. Only your company’s records are counted. Choose the period at the top; every tab follows it. Each chart has a “Show as a table” link with the same numbers.',
  example: {
    title: 'how many deliveries arrived on time last quarter',
    steps: ['Choose “Last 90 days” and “By month”.', 'Open the Shipments tab: “Arrived on time” shows the share, with how many had a planned date.', 'Open Quality to see the same for you as a seller, with the quantity buyers rejected.'],
  },
};
