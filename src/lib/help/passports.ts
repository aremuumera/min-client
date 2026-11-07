import type { PageHelpContent } from '@/components/ui';

/* "About this page" for passports, certificates and template requests (step 2.9). Keep in step with what the pages do. */
export const templateRequestsHelp: PageHelpContent = {
  title: 'Template requests',
  purpose:
    'Ask MINMEG for a passport template your buyers need: a new one, a variant of an existing one, or a standard added to one. MINMEG may ask questions here; you answer in the same thread. When MINMEG publishes the template made for your request, the request is done and you can issue passports on it.',
  example: {
    title: 'an EU buyer needs OECD data per batch',
    steps: [
      'Ask for a new template: "Tin concentrate for EU buyers", standards OECD due diligence and CRMA, market EU.',
      'MINMEG asks which mine types you cover; you answer.',
      'MINMEG approves and builds the template. Once published, it shows when you issue a batch passport.',
    ],
  },
};

export const passportsHelp: PageHelpContent = {
  title: 'Passports',
  purpose:
    'The digital passport of each batch: where it comes from, what it is made of and what was checked. You issue it on a template MINMEG published, fill the fields, check it and publish it. Values you type show as declared; values taken from a checked reading, lab result or inspection show as verified. A published version never changes: a correction is a new version, and the buyers on your trades see the published one.',
  example: {
    title: 'a batch of tin concentrate',
    steps: [
      'Open the batch, Passport tab, and issue a passport on the default template.',
      'The batch code is filled for you. Type the mine country; take the grade from the released lab result.',
      'Press Check, fix what it lists, then Publish. The buyer on the trade now sees it.',
    ],
  },
};

export const certificatesHelp: PageHelpContent = {
  title: 'Certificates',
  purpose:
    'MINMEG’s formal statements about what it has already checked: an inspection, a lab result, a compliance check, a dispatched shipment, or your verified business. Only MINMEG issues them. Each one can be downloaded as a PDF, and you can share one with another company for a set time.',
  example: {
    title: 'a lab result certificate',
    steps: ['MINMEG checks and releases the lab result of your batch, then issues an assay certificate.', 'It shows here; download the PDF or share it with a bank by its company ID.'],
  },
};
