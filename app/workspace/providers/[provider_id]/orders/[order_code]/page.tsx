"use client";

import { useParams } from "next/navigation";
import ProviderOrderDetail from "@/app/workspace/components/orders/ProviderOrderDetails";


export default function OrderDetailPage() {
  const params = useParams();  

  console.log('🚀 PROVIDER DEDICATED ROUTE - OrderDetailPage');
  console.log('🚀 PROVIDER ROUTE - orderCode:', params.order_code);
  console.log('🚀 PROVIDER ROUTE - providerId:', params.provider_id);

  return (
    <ProviderOrderDetail
      orderCode={params.order_code as string}
      orgId={params.provider_id as string}
    />
  );
} 