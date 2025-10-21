import { getEntityReconciliationStatements } from "@/lib/reconciliation-service";
import { EntityType } from "@/app/types/reconciliationTypes";
import ReconciliationStatementListWithSheet from "./ReconciliationStatementListWithSheet";

interface ReconciliationStatementsContentProps {
  entityType: EntityType;
  entityId: string;
}

/**
 * 通用对账单内容组件
 */
export default async function ReconciliationStatementsContent({ 
  entityType, 
  entityId 
}: ReconciliationStatementsContentProps) {
  const statements = await getEntityReconciliationStatements({
    entityType,
    entityId
  });
  
  return (
    <ReconciliationStatementListWithSheet 
      statements={statements} 
      customerId={entityId}
      tenantType={entityType}
    />
  );
} 