"use client";

import { useParams } from "next/navigation";
import ProviderOrderDetail from "@/app/workspace/components/orders/ProviderOrderDetails";

export default function OrderDetailPage() {
  const params = useParams();

  console.log('🚀 OrderDetailPage - PROVIDER MODE ONLY');
  console.log('🚀 OrderDetailPage - orderCode:', params.order_code);
  console.log('🚀 OrderDetailPage - orgId:', params.market_id);

  return (
    <ProviderOrderDetail
      orderCode={params.order_code as string}
      orgId={params.market_id as string}
    />
  );
} 