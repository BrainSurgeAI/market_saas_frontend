"use client";

import { useParams } from "next/navigation";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { MarketExchangeInspectPage } from "@/app/workspace/components/orders/MarketExchangeInspectPage";

export default function MarketExchangePage() {
  const params = useParams();
  const { organization } = useWorkspace();

  return (
    <MarketExchangeInspectPage
      orderCode={params.order_code as string}
      orgId={params.market_id as string}
      tenantType={organization.tenantType}
    />
  );
}
