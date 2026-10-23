import { redirect } from 'next/navigation';

export default async function TradeChatRedirectPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  redirect(`/dashboard/trade/details/${resolvedParams.id}`);
}
