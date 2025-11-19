"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight } from "lucide-react";
import { ProductListSection } from "../ProductListSection";
import { Order, OrderItem, OperationType, OrderInspection, Receipt } from "@/lib/types/orderStatus";
import { ProductStatusSummary } from "../types";
import { RoundGroupedData } from "../roundGrouping";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { OrderStatus } from "@/lib/types/orderStatus";
import { useRouter, useParams } from "next/navigation";

interface CategorySummaryItem {
	category: string;
	total: string;
}

export interface ProductsTabProps {
	orderDetail: Order;
	orderItems: OrderItem[];
	tenantType: string;
	isEditing: boolean;
	itemErrors: Record<number, string>;
	shouldShowDeliverQuantityColumn: boolean;
	shouldShowReceivedQuantityColumn: boolean;
	shouldShowInspectMenu: boolean;
	shouldShowStatusColumn: boolean;
	handleActualQuantityChange: (id: number, value: string) => void;
	handleActualQuantityKeyDown: (
		event: ReactKeyboardEvent<HTMLInputElement>,
		itemId: number
	) => void;
	handleOperation: (id: number, type: OperationType) => void;
	productStatusSummary: ProductStatusSummary;
	isUnitAllowingDecimal: (unit: string) => boolean;
	roundGroups: RoundGroupedData[];
	inspections?: OrderInspection[];
	receipts: Receipt[];
	categorySummary: CategorySummaryItem[];
	extraFooter?: ReactNode;
}

export function ProductsTab({
	orderDetail,
	orderItems,
	tenantType,
	isEditing,
	itemErrors,
	shouldShowDeliverQuantityColumn,
	shouldShowReceivedQuantityColumn,
	shouldShowInspectMenu,
	shouldShowStatusColumn,
	handleActualQuantityChange,
	handleActualQuantityKeyDown,
	handleOperation,
	productStatusSummary,
	isUnitAllowingDecimal,
	roundGroups,
	inspections,
	receipts,
	categorySummary,
	extraFooter,
}: ProductsTabProps) {
	const router = useRouter();
	const params = useParams();
	const marketId = params.market_id as string;

	// 检查是否应该显示换货清单链接
	const shouldShowExchangeLink = orderDetail?.orderStatus?.includes('EXCHANGE') || receipts.some(r => r.operationType === OperationType.EXCHANGE);

	// 跳转到换货清单页面
	const handleGoToExchange = () => {
		router.push(`/workspace/markets/${marketId}/orders/${orderDetail?.orderCode}/exchange`);
	};
	return (
		<>
			<ProductListSection
				orderDetail={orderDetail}
				orderItems={orderItems}
				tenantType={tenantType}
				isEditing={isEditing}
				itemErrors={itemErrors}
				shouldShowDeliverQuantityColumn={shouldShowDeliverQuantityColumn}
				shouldShowReceivedQuantityColumn={shouldShowReceivedQuantityColumn}
				shouldShowInspectMenu={shouldShowInspectMenu}
				shouldShowStatusColumn={shouldShowStatusColumn}
				handleActualQuantityChange={handleActualQuantityChange}
				handleActualQuantityKeyDown={handleActualQuantityKeyDown}
				handleOperation={handleOperation}
				productStatusSummary={productStatusSummary}
				isUnitAllowingDecimal={isUnitAllowingDecimal}
				roundGroups={roundGroups}
				inspections={inspections}
				receipts={receipts}
			/>

			<Card className="mt-4">
				<CardHeader>
					<CardTitle>分类汇总</CardTitle>
				</CardHeader>
				<CardContent>
					{categorySummary.length === 0 ? (
						<p className="text-xs text-muted-foreground">暂无可汇总的数据</p>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
							{categorySummary.map((item, index) => (
								<div key={`${item.category}-${index}`} className="border rounded-md p-3">
									<p className="text-sm">{item.category}</p>
									<div className="flex justify-between mt-2">
										<span className="text-xs font-mono font-semibold">¥{item.total}</span>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* 换货清单链接 */}
			{shouldShowExchangeLink && (
				<Card className="mt-4">
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Package className="h-5 w-5 text-primary" />
								<div>
									<p className="font-medium">换货清单</p>
									<p className="text-sm text-muted-foreground">
										查看和管理换货商品的验收状态
									</p>
								</div>
							</div>
							<Button variant="outline" size="sm" onClick={handleGoToExchange}>
								查看换货清单
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{extraFooter}
		</>
	);
}

