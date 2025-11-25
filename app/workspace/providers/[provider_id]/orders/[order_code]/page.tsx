"use client";

import { useParams } from "next/navigation";
import ProviderOrderDetail from "@/app/workspace/components/orders/ProviderOrderDetails";

export default function OrderDetailPage() {
  const params = useParams();

  return (
    <ProviderOrderDetail
      orderCode={params.order_code as string}
      orgId={params.provider_id as string}
    />
  );
} 