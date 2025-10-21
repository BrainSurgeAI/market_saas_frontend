import InvoiceSettlementsPageLayout from "@/app/components/InvoiceSettlementsPageLayout";
import ReconciliationStatementsContent from "@/app/components/ReconciliationStatementsContent";

interface MarketInvoiceSettlementsPageProps {
  params: Promise<{
    market_id: string;
  }>;
}

/**
 * 市场对账单总览页面
 */
export default async function MarketInvoiceSettlementsPage({ 
  params 
}: MarketInvoiceSettlementsPageProps) {
  const { market_id } = await params;

  return (
    <InvoiceSettlementsPageLayout
      entityType="market"
      entityId={market_id}
    >
      <ReconciliationStatementsContent 
        entityType="market"
        entityId={market_id}
      />
    </InvoiceSettlementsPageLayout>
  );
} 