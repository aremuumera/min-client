import type { PageHelpContent } from '@/components/ui';

/* "About this page" for ESG and carbon (step 2.10). Keep in step with what the page does. */
export const esgHelp: PageHelpContent = {
  title: 'ESG & carbon',
  purpose:
    'Your carbon figures and ESG results, and those of the suppliers on your trades. For carbon you enter what you did (fuel, electricity, transport…) and your own emission factors, each with its source; MINMEG only adds them up and supplies no factor. You send the result to MINMEG with an independent verifier’s report, and MINMEG confirms it or returns it with notes. Buyers always see whose figures they are and how far they were checked: declared, declared with evidence, independently verified, or confirmed by MINMEG. MINMEG never rates the result.',
  example: {
    title: 'the carbon of a batch of tin concentrate',
    steps: [
      'Open the batch in Inventory, ESG & carbon tab, and start a carbon assessment (method GHG_PROTOCOL_PRODUCT 2011, cradle to gate).',
      'Add “Diesel for haul trucks”: 800 litres × 2.68 kgCO2e per litre, from DEFRA 2025, with the fuel invoice.',
      'Calculate, then send it to MINMEG with the verifier’s report. Once MINMEG confirms it, the buyer sees “Confirmed by MINMEG” and your passport can show the figure.',
    ],
  },
};
