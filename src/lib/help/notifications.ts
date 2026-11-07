import type { PageHelpContent } from '@/components/ui';

/* "About this page" for notifications (step 2.13). Keep in step with what the page does. */
export const notificationsHelp: PageHelpContent = {
  title: 'Notifications',
  purpose:
    'Everything MINMEG tells your company: trades, shipments, passports, certificates, compliance, ESG and carbon, and more. New ones appear at once. Opening a notice marks it as read and takes you to the record. Some notices ask you to acknowledge them; they stay at the top until you do. Chat messages are not here: they are with the chat, under the message icon.',
  example: {
    title: 'a certificate issued',
    steps: ['The bell shows 1 unread.', 'Open "Certificate issued: CERT-INS-2026-…": it goes to the certificate.', 'Choose what also reaches you by email in Settings, Notifications.'],
  },
};

export const alertsHelp: PageHelpContent = {
  title: 'Alerts',
  purpose:
    'Problems MINMEG’s tracking found on your shipments: a truck running late, off its route, stopped for too long, a seal opened, a tracker gone quiet. MINMEG looks into every alert and resolves it. Acknowledge an alert to show you have seen it, and add a note if you know what happened.',
  example: {
    title: 'a truck running late',
    steps: ['The alert "Shipment SHP-2026-… is running late" appears, with the bell.', 'Open it and acknowledge it with a note: "Stopped at the Sagamu checkpoint."', 'MINMEG resolves it once the truck moves; you see what was done.'],
  },
};
