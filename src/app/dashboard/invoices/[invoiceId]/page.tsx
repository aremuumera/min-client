import { InvoiceDetailPage } from "@/components/dashboard/invoice/detail_invoice";

export const metadata = {
    title: "Trade Agreement Details | Dashboard",
};

interface PageProps {
    params: Promise<{
        invoiceId: string;
    }>;
}

export default async function InvoicePage({ params }: PageProps) {
    const awaitedParams = await params;
    return <InvoiceDetailPage invoiceId={awaitedParams.invoiceId} />;
}
