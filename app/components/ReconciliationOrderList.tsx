'use client'

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCartIcon } from "lucide-react";
import { ReconciliationOrder } from "@/app/types/reconciliationTypes";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ReconciliationOrderListProps {
	orders: ReconciliationOrder[];
	loading?: boolean;
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
 * 格式化日期显示
 */
function formatDate(dateString: string): string {
	try {
		return format(parseISO(dateString), 'yyyy年MM月dd日', { locale: zhCN });
	} catch {
		return dateString;
	}
}

/**
 * 结算单订单列表组件
 */
export default function ReconciliationOrderList({
	orders,
	loading = false
}: ReconciliationOrderListProps) {
	// 计算订单总计数据
	const summaryData = useMemo(() => {
		const totalAmount = orders.reduce((sum, order) =>
			sum + parseFloat(order.totalAmount), 0
		);
		const totalActual = orders.reduce((sum, order) =>
			sum + parseFloat(order.actualAmount), 0
		);

		return {
			totalAmount,
			totalActual,
			count: orders.length,
			discount: totalAmount - totalActual
		};
	}, [orders]);

	if (loading) {
		return (
			<div className="space-y-4">
				<div className="animate-pulse">
					<div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
					<div className="space-y-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="h-16 bg-gray-200 rounded"></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<ShoppingCartIcon className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">暂无订单数据</h3>
					<p className="text-muted-foreground text-center">
						该结算单下暂时没有关联的订单记录。
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">



			<Separator />

			{/* 订单详情列表 */}
			<Card>
				<CardHeader>
					<CardTitle>结算单明细</CardTitle>
					<CardDescription></CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className='text-xs'>
									<TableHead className="min-w-[180px]">订单编号</TableHead>
									<TableHead className="min-w-[120px]">订单日期</TableHead>
									<TableHead className="text-right min-w-[100px]">订单总额</TableHead>
									<TableHead className="text-right min-w-[100px]">实际金额</TableHead>
									<TableHead className="text-right min-w-[100px]">优惠金额</TableHead>
									{/* <TableHead className="min-w-[120px] text-right">创建时间</TableHead> */}
								</TableRow>
							</TableHeader>
							<TableBody>
								{orders.map((order) => {
									const discount = parseFloat(order.totalAmount) - parseFloat(order.actualAmount);
									return (
										<TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer text-xs">
											<TableCell>
												<div className="flex flex-col">
													<code className="text-xs bg-muted px-2 py-1 rounded mb-1 max-w-fit">
														{order.orderCode}
													</code>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													<span className="whitespace-nowrap">{formatDate(order.orderDate)}</span>
												</div>
											</TableCell>
											<TableCell className="text-right font-medium whitespace-nowrap font-mono">
												{formatAmount(order.totalAmount)}
											</TableCell>
											<TableCell className="text-right font-semibold text-green-600 whitespace-nowrap font-mono">
												{formatAmount(order.actualAmount)}
											</TableCell>
											<TableCell className="text-right">
												<Badge variant={discount > 0 ? "default" : "secondary"} className="whitespace-nowrap font-mono">
													{formatAmount(discount.toString())}
												</Badge>
											</TableCell>
											{/* <TableCell className="text-muted-foreground whitespace-nowrap text-right">
                        {formatDate(order.createdAt)}
                      </TableCell> */}
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 