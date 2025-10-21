"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import OrdersList from "@/app/workspace/components/orders/OrdersList";

export default function ProviderOrdersPage() {
  const params = useParams();

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">订单列表</h2>
          </div>
          <Button asChild size="sm">
            <a href={`/workspace/providers/${params.provider_id}/orders/today-summary`}>
              <Link className="mr-2 h-4 w-4" />
              查看今日订单汇总
            </a>
          </Button>
        </div>

        <OrdersList org_id={params.provider_id as string} redirectUrl={`/workspace/providers/${params.provider_id}/orders`} />
      </div>
    </div>
  );
}
