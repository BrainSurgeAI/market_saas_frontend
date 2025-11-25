"use client";

import { useParams } from "next/navigation";

import OrdersList from "@/app/workspace/components/orders/OrdersList";

export default function CustomerOrdersPage() {
	const params = useParams();
	return (
		<div className="container mx-auto py-6">
			<div className="space-y-6">
				<OrdersList org_id={params.customer_id as string} redirectUrl={`/workspace/customers/${params.customer_id}/orders`} userType="CUSTOMER" />
			</div>
		</div>
	);
}
