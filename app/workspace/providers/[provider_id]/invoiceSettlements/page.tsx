import InvoiceSettlementsPageLayout from "@/app/components/InvoiceSettlementsPageLayout";
import ReconciliationStatementsContent from "@/app/components/ReconciliationStatementsContent";

interface ProviderInvoiceSettlementsPageProps {
  params: Promise<{
    provider_id: string;
  }>;
}

/**
 * 供应商对账单总览页面
 */
export default async function ProviderInvoiceSettlementsPage({ 
  params 
}: ProviderInvoiceSettlementsPageProps) {
  const { provider_id } = await params;

  return (
    <InvoiceSettlementsPageLayout
      entityType="provider"
      entityId={provider_id}
    >
      <ReconciliationStatementsContent 
        entityType="provider"
        entityId={provider_id}
      />
    </InvoiceSettlementsPageLayout>
  );
} 