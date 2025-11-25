"use client";

import { useParams } from "next/navigation";
import OrdersList from "@/app/workspace/components/orders/OrdersList";

export default function ProviderOrdersPage() {
	const params = useParams();

	return (
		<div className="container mx-auto py-6">
			<div className="space-y-6">
				<OrdersList org_id={params.market_id as string} redirectUrl={`/workspace/markets/${params.market_id}/orders`} userType="MARKET" />
			</div>
		</div>
	);
}
