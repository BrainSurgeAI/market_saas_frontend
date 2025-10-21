"use client";

import { useParams } from "next/navigation";

import OrdersList from "@/app/workspace/components/orders/OrdersList";

export default function CustomerOrdersPage() {
	const params = useParams();
	return (
		<div className="container mx-auto py-6">
			<div className="space-y-6">
				<div>
					<h2 className="text-xl font-semibold">我的订单</h2>
					{/* <div className="flex justify-between items-center mt-4">
						<button
							onClick={() => window.location.href = "/workspace"}
							className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							返回工作台
						</button>
					</div> */}
				</div>

				<OrdersList org_id={params.customer_id as string} redirectUrl={`/workspace/customers/${params.customer_id}/orders`} />
			</div>
		</div>
	);
}
