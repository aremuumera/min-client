import type { PageHelpContent } from '@/components/ui';

/* "About this page" for support chat (step 2.6d). Keep in step with what the page does. */
export const supportHelp: PageHelpContent = {
  title: 'MINMEG Support',
  purpose: 'Your company has one ongoing conversation with MINMEG staff, for anything at all, even with no trade running. Everyone on your team with chat access sees the same conversation.',
  example: {
    title: 'a question about a listing',
    steps: [
      'You write "Why was my listing refused?" and choose the listing under About.',
      'A staff member answers here. You get a notice, and an email if the answer stays unread for over an hour.',
      'Staff close the conversation when it is sorted. If you write again, it opens again.',
    ],
  },
  links: [{ label: 'Trade Chat', href: '/dashboard/chat', why: 'Talk about a specific trade in its own trade room.' }],
  goodToKnow: ['Talk about a running trade in its trade room. Use this chat for everything else.', 'You can attach up to 5 files to a message.'],
};
