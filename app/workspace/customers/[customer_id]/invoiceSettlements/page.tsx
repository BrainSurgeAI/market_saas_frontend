import InvoiceSettlementsPageLayout from "@/app/components/InvoiceSettlementsPageLayout";
import ReconciliationStatementsContent from "@/app/components/ReconciliationStatementsContent";

interface InvoiceSettlementsPageProps {
  params: Promise<{
    customer_id: string;
  }>;
}

/**
 * 客户对账单总览页面
 */
export default async function InvoiceSettlementsPage({ params }: InvoiceSettlementsPageProps) {
  const { customer_id } = await params;

  return (
    <InvoiceSettlementsPageLayout
      entityType="customer"
      entityId={customer_id}
    >
      <ReconciliationStatementsContent 
        entityType="customer"
        entityId={customer_id}
      />
    </InvoiceSettlementsPageLayout>
  );
} 