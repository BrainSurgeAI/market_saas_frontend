"use client";

import { useParams } from "next/navigation";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { ExchangeOrderPage } from "@/app/workspace/components/orders/ExchangeOrderPage";

export default function ProviderExchangeOrderPage() {
  const params = useParams();
  const { organization } = useWorkspace();

  return (
    <ExchangeOrderPage
      orderCode={params.order_code as string}
      orgId={params.provider_id as string}
      tenantType={organization.tenantType}
    />
  );
}
