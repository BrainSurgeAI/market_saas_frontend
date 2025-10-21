'use client'

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { FileTextIcon, EyeIcon } from "lucide-react";
import { ReconciliationStatement } from "@/app/types/reconciliationTypes";
import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ReconciliationStatementListProps {
	statements: ReconciliationStatement[];
	customerId: string;
	tenantType: string;
	onStatementClick?: (statement: ReconciliationStatement) => void;
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
 * 格式化月份显示
 */
function formatMonth(startDate: string, endDate: string): string {
	try {
		const start = parseISO(startDate);
		const end = parseISO(endDate);
		return `${format(start, 'yyyy年MM月', { locale: zhCN })}`;
	} catch {
		return `${startDate} ~ ${endDate}`;
	}
}

/**
 * 截断文本显示
 */
function truncateText(text: string, maxLength: number = 6): string {
	if (text.length <= maxLength) {
		return text;
	}
	return text.slice(0, maxLength) + '...';
}

/**
 * 带 Tooltip 的截断名称组件
 */
function TruncatedName({ name, maxLength = 6 }: { name: string | null; maxLength?: number }) {
	if (!name) {
		return <span className="text-muted-foreground">-</span>;
	}

	const needsTooltip = name.length > maxLength;
	const displayText = needsTooltip ? truncateText(name, maxLength) : name;

	if (!needsTooltip) {
		return <span>{displayText}</span>;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="cursor-help underline decoration-dotted decoration-muted-foreground text-xs">
					{displayText}
				</span>
			</TooltipTrigger>
			<TooltipContent side="top" className="max-w-xs text-xs">
				<p className="text-xs">{name}</p>
			</TooltipContent>
		</Tooltip>
	);
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

export default function ReconciliationStatementList({
	statements,
	customerId,
	tenantType,
	onStatementClick
}: ReconciliationStatementListProps) {
	const summaryData = useMemo(() => {
		const totalAmount = statements.reduce((sum, statement) =>
			sum + parseFloat(statement.totalAmount), 0
		);
		const totalDiscount = statements.reduce((sum, statement) =>
			sum + parseFloat(statement.discountAmount), 0
		);
		const totalActual = statements.reduce((sum, statement) =>
			sum + parseFloat(statement.actualAmount), 0
		);

		return {
			totalAmount,
			totalDiscount,
			totalActual,
			count: statements.length
		};
	}, [statements]);

	// 按状态分组统计
	const statusSummary = useMemo(() => {
		const summary = statements.reduce((acc, statement) => {
			acc[statement.status] = (acc[statement.status] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		return summary;
	}, [statements]);

	if (statements.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-16">
					<FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">暂无结算单数据</h3>
					<p className="text-muted-foreground text-center">
						该客户暂时没有结算单记录，请联系相关业务人员确认。
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<TooltipProvider>
			<div className="space-y-6">
			{/* 统计概览卡片 */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">结算单总数</CardTitle>

					</CardHeader>
					<CardContent>
						<div className="text-lg font-bold">{summaryData.count}</div>
						<p className="text-xs text-muted-foreground">
							共 <span className="font-mono">{summaryData.count}</span> 个月的对账记录
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">总金额</CardTitle>

					</CardHeader>
					<CardContent>
						<div className="text-lg font-mono">{formatAmount(summaryData.totalAmount.toString())}</div>
						<p className="text-xs text-muted-foreground">
							累计交易总额
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">优惠金额</CardTitle>

					</CardHeader>
					<CardContent>
						<div className="text-lg font-mono">{formatAmount(summaryData.totalDiscount.toString())}</div>
						<p className="text-xs text-muted-foreground">
							累计优惠总额
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">实际金额</CardTitle>

					</CardHeader>
					<CardContent>
						<div className="text-lg font-mono">{formatAmount(summaryData.totalActual.toString())}</div>
						<p className="text-xs text-muted-foreground">
							累计实际收款
						</p>
					</CardContent>
				</Card>
			</div>

			{/* 结算单列表 */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-base">结算单明细</CardTitle>
							<CardDescription className='text-xs'>
								按月份显示的结算单详情{onStatementClick && '，点击行查看结算单详情'}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow className="text-xs">
								<TableHead>对账月份</TableHead>
								<TableHead>结算单号</TableHead>
								<TableHead>总金额</TableHead>
								<TableHead>优惠金额</TableHead>
								<TableHead>实际金额</TableHead>
								{/* <TableHead>状态</TableHead> */}
								{(tenantType === 'customer' || tenantType === 'market') && <TableHead>供应商</TableHead>}
								{(tenantType === 'provider' || tenantType === 'market') && <TableHead>客户名称</TableHead>}
								
							</TableRow>
						</TableHeader>
						<TableBody>
							{statements.map((statement) => (
								<TableRow
									key={statement.id}
									className={`text-xs ${onStatementClick ? 'hover:bg-muted/50 cursor-pointer' : ''}`}
									onClick={() => onStatementClick?.(statement)}>
									<TableCell className="text-xs">
										{formatMonth(statement.startDate, statement.endDate)}
									</TableCell>
									<TableCell>
										<code className="text-xs bg-muted px-2 py-1 rounded">
											{statement.statementCode}
										</code>
									</TableCell>
									<TableCell className="font-mono text-xs">{formatAmount(statement.totalAmount)}</TableCell>
									<TableCell className="font-mono text-xs">{formatAmount(statement.discountAmount)}</TableCell>
									<TableCell className="font-mono font-semibold text-xs">
										{formatAmount(statement.actualAmount)}
									</TableCell>
								
									{(tenantType === 'customer' || tenantType === 'market') && (
										<TableCell className='text-xs'>
											<TruncatedName name={statement.supplierName} maxLength={8} />
										</TableCell>
									)}
									{(tenantType === 'provider' || tenantType === 'market') && (
										<TableCell className='text-xs'>
											<TruncatedName name={statement.customerName} maxLength={8} />
										</TableCell>
									)}
									{onStatementClick && (
										<TableCell>
											<EyeIcon className="h-4 w-4 text-muted-foreground" />
										</TableCell>
									)}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
		</TooltipProvider>
	);
} 