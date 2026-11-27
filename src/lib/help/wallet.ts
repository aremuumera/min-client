import type { PageHelpContent } from '@/components/ui';

/* "About this page" for the wallet. The page adds a last line for its mode (not live yet, or demo). Keep in step with the page. */
export const walletHelp: PageHelpContent = {
  title: 'Wallet',
  purpose:
    "Your company's money on MINMEG, in naira and in US dollars. Buyers pay MINMEG, never the seller: MINMEG holds the money in escrow until the goods are inspected and delivered, takes its fee and releases the rest to the seller and the inspector. Every entry links to its invoice and its trade.",
  example: {
    title: 'a German buyer pays for lithium ore',
    steps: [
      'MINMEG issues the invoice in naira and locks the dollar rate the same day.',
      'The buyer wires the dollars by SWIFT with the invoice ID as the reference; MINMEG confirms the money.',
      'MINMEG holds it while the lot is inspected at Apapa and shipped to Hamburg.',
      "When the buyer confirms delivery, the supplier's share less the MINMEG fee lands in the supplier's USD wallet, and is paid to its domiciliary account the next working day.",
    ],
  },
  links: [
    { label: 'Invoices', href: '/dashboard/invoices', why: 'Each payment in the wallet pays one of these invoices.' },
    { label: 'Trade chat', href: '/dashboard/chat', why: 'MINMEG tells each party in its own thread when money arrives or is released.' },
  ],
  goodToKnow: [
    'Buyers in Nigeria pay naira by bank transfer: to the company\'s permanent account number, or to a one-time account opened for one invoice and the exact amount.',
    'Buyers abroad pay US dollars by SWIFT wire, at the rate locked when the invoice is issued.',
    'Withdrawals, payments from the balance and changes to payout accounts need the 4-digit wallet PIN.',
    'Money is paid out only to verified accounts in the company\'s own name.',
  ],
};
