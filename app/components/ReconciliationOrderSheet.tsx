'use client'

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ReconciliationStatement, ReconciliationOrder } from "@/app/types/reconciliationTypes";
import { getReconciliationOrders } from "@/lib/reconciliation-service";
import ReconciliationOrderList from "./ReconciliationOrderList";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ReconciliationOrderSheetProps {
	statement: ReconciliationStatement | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * 格式化月份显示
 */
function formatMonth(startDate: string, endDate: string): string {
	try {
		const start = parseISO(startDate);
		return `${format(start, 'yyyy年MM月', { locale: zhCN })}`;
	} catch {
		return `${startDate} ~ ${endDate}`;
	}
}

/**
 * 格式化金额显示
 */
function formatAmount(amount: string): string {
	const num = parseFloat(amount);
	return new Intl.NumberFormat('zh-CN', {
		style: 'currency',
		currency: 'CNY',
		minimumFractionDigits: 2,
	}).format(num);
}

/**
 * 结算单状态徽章组件
 */
// function StatusBadge({ status }: { status: string }) {
// 	const statusInfo = ReconciliationStatusMap[status as keyof typeof ReconciliationStatusMap];

// 	if (!statusInfo) {
// 		return <Badge variant="secondary">{status}</Badge>;
// 	}

// 	const colorVariant = {
// 		yellow: 'default' as const,
// 		blue: 'secondary' as const,
// 		green: 'default' as const,
// 		red: 'destructive' as const,
// 	}[statusInfo.color] || 'secondary' as const;

// 	return (
// 		<Badge variant={colorVariant} className={
// 			statusInfo.color === 'green' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
// 				statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
// 					statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : ''
// 		}>
// 			{statusInfo.label}
// 		</Badge>
// 	);
// }

/**
 * 结算单订单详情滑动面板
 */
export default function ReconciliationOrderSheet({
	statement,
	open,
	onOpenChange
}: ReconciliationOrderSheetProps) {
	const [orders, setOrders] = useState<ReconciliationOrder[]>([]);
	const [loading, setLoading] = useState(false);

	// 获取订单数据
	useEffect(() => {
		if (open && statement) {
			setLoading(true);
			getReconciliationOrders(statement.id)
				.then(setOrders)
				.catch(console.error)
				.finally(() => setLoading(false));
		}
	}, [open, statement]);

	// 清理数据
	useEffect(() => {
		if (!open) {
			setOrders([]);
		}
	}, [open]);

	if (!statement) {
		return null;
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-[100vw] sm:w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[80vw] sm:max-w-none max-w-none">
				<SheetHeader className="space-y-4">
					<div className="flex items-start justify-between">
						<div className="space-y-2">
							<SheetTitle className="text-base font-bold">
								结算单
							</SheetTitle>
							<div className="flex items-center space-x-2">
								<div className="text-xs text-muted-foreground">
									{formatMonth(statement.startDate, statement.endDate)}
								</div>
								<code className="text-xs bg-muted px-2 py-1 rounded">
									{statement.statementCode}
								</code>
								{/* <StatusBadge status={statement.status} /> */}
							</div>
						</div>
					</div>

					<SheetDescription asChild>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/90 rounded-lg">
							<div className="text-center">
								<div className="text-sm text-muted-foreground">总金额</div>
								<div className="text-base font-semibold font-mono">
									{formatAmount(statement.totalAmount)}
								</div>
							</div>
							<div className="text-center">
								<div className="text-sm text-muted-foreground">优惠金额</div>
								<div className="text-base font-semibold text-orange-600 font-mono">
									{formatAmount(statement.discountAmount)}
								</div>
							</div>
							<div className="text-center">
								<div className="text-sm text-muted-foreground">实际金额</div>
								<div className="text-base font-semibold text-green-600 font-mono">
									{formatAmount(statement.actualAmount)}
								</div>
							</div>
						</div>
					</SheetDescription>
				</SheetHeader>

				<ScrollArea className="h-[calc(100vh-200px)] mt-6">
					<ReconciliationOrderList orders={orders} loading={loading} />
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
} 