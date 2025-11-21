"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Package, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useOrderDetails } from "@/app/workspace/hooks/useOrderDetails";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { OrderItem, OperationType, TenantType } from "@/lib/types/orderStatus";

interface MarketExchangeInspectPageProps {
	orderCode: string;
	orgId: string;
	tenantType: string;
}

interface ExchangeInspectItem {
	id: number;
	productId: string;
	name: string;
	category: string;
	unit: string;
	requestedQuantity: number;
	supplierQuantity: number;
	originReason?: string;
}

interface FormItemState {
	quantity: string;
	decision: OperationType;
	reason: string;
	quantityError?: string;
}

type FormState = Record<number, FormItemState>;

const MOCK_ITEMS: ExchangeInspectItem[] = [
	{
		id: 1,
		productId: "SKU-MOCK-001",
		name: "澳洲谷饲牛腱",
		category: "牛肉",
		unit: "kg",
		requestedQuantity: 10,
		supplierQuantity: 9.6,
		originReason: "客户反馈包装破损，需重新换货",
	},
	{
		id: 2,
		productId: "SKU-MOCK-002",
		name: "智利三文鱼整切",
		category: "水产",
		unit: "kg",
		requestedQuantity: 6,
		supplierQuantity: 5.8,
		originReason: "部分鱼肉出现裂痕，影响出品",
	},
];

export function MarketExchangeInspectPage({ orderCode, orgId, tenantType }: MarketExchangeInspectPageProps) {
	const router = useRouter();
	const { user } = useWorkspace();
	const { toast } = useToast();

	const orderDetailsData = useOrderDetails(orderCode, orgId, tenantType);

	// 检查是否是PROVIDER格式数据
	if (orderDetailsData && (orderDetailsData as any).__isProviderFormat) {
		return (
			<div className="container mx-auto py-6">
				<div className="flex flex-col items-center py-12">
					<p className="text-sm text-red-500 mb-4">
						PROVIDER用户不支持换货验收功能。
					</p>
				</div>
			</div>
		);
	}

	const {
		orderDetail,
		orderItems,
		returnExchangeRecords,
		loading,
		error,
	} = orderDetailsData;

	const [formState, setFormState] = useState<FormState>({});
	const [submitting, setSubmitting] = useState(false);

	const isMarket = tenantType.toLowerCase() === TenantType.MARKET;

	const exchangeItems = useMemo(() => {
		const mapped = orderItems
			.map((item) => {
				const exchangeRecords = returnExchangeRecords.filter(
					(record) => record.productId === item.productId && record.operationType === OperationType.EXCHANGE
				);

				if (!exchangeRecords.length) {
					return null;
				}

				const requestedQuantity = exchangeRecords.reduce((sum, record) => sum + Number(record.quantity || 0), 0);
				return {
					id: item.id,
					productId: item.productId,
					name: item.name,
					category: item.category,
					unit: item.unit,
					requestedQuantity,
					supplierQuantity: Number(item.actualQuantity || 0),
					originReason: exchangeRecords[0]?.reason ?? undefined,
				};
			})
			.filter(Boolean) as ExchangeInspectItem[];

		return mapped.length ? mapped : MOCK_ITEMS;
	}, [orderItems, returnExchangeRecords]);

	useEffect(() => {
		const initial: FormState = {};
		exchangeItems.forEach((item) => {
			initial[item.id] = {
				quantity: item.supplierQuantity.toString(),
				decision: OperationType.SIGN,
				reason: "",
			};
		});
		setFormState(initial);
	}, [exchangeItems]);

	const summary = useMemo(() => {
		const totalRequested = exchangeItems.reduce((sum, item) => sum + item.requestedQuantity, 0);
		const totalSupplier = exchangeItems.reduce((sum, item) => sum + item.supplierQuantity, 0);
		const accepted = exchangeItems.filter((item) => formState[item.id]?.decision === OperationType.SIGN).length;
		return {
			totalRequested,
			totalSupplier,
			accepted,
			pending: exchangeItems.length - accepted,
		};
	}, [exchangeItems, formState]);

	const handleQuantityChange = (id: number, value: string) => {
		setFormState((prev) => ({
			...prev,
			[id]: {
				...prev[id],
				quantity: value,
				quantityError: undefined,
			},
		}));
	};

	const handleDecisionChange = (id: number, decision: OperationType) => {
		setFormState((prev) => ({
			...prev,
			[id]: {
				...prev[id],
				decision,
			},
		}));
	};

	const handleReasonChange = (id: number, reason: string) => {
		setFormState((prev) => ({
			...prev,
			[id]: {
				...prev[id],
				reason,
			},
		}));
	};

	const validateForm = () => {
		let isValid = true;
		exchangeItems.forEach((item) => {
			const current = formState[item.id];
			const quantity = parseFloat(current?.quantity ?? "0");
			let quantityError: string | undefined;

			if (!current || Number.isNaN(quantity) || quantity <= 0) {
				quantityError = "请输入有效的验收数量";
				isValid = false;
			} else if (quantity > item.supplierQuantity) {
				quantityError = `数量不可超过供应商交付量 ${item.supplierQuantity.toFixed(2)} ${item.unit}`;
				isValid = false;
			}

			if (quantityError) {
				setFormState((prev) => ({
					...prev,
					[item.id]: {
						...prev[item.id],
						quantityError,
					},
				}));
			}

			if (isValid && current?.decision === OperationType.RETURN && !current.reason.trim()) {
				toast({
					title: "提交失败",
					description: `${item.name} 退回需填写说明`,
					variant: "destructive",
				});
				isValid = false;
			}
		});

		return isValid;
	};

	const handleSubmit = async () => {
		if (!isMarket) {
			toast({
				title: "权限不足",
				description: "仅市场用户可以提交换货验收",
				variant: "destructive",
			});
			return;
		}

		if (!orderDetail) {
			toast({
				title: "缺少订单信息",
				description: "请刷新重试",
				variant: "destructive",
			});
			return;
		}

		if (!validateForm()) {
			return;
		}

		setSubmitting(true);
		try {
			const payload = exchangeItems.map((item) => ({
				id: item.id,
				orderCode: orderDetail.orderCode,
				productId: item.productId,
				productName: item.name,
				decision: formState[item.id]?.decision ?? OperationType.SIGN,
				quantity: parseFloat(formState[item.id]?.quantity ?? "0"),
				reason: formState[item.id]?.reason ?? "",
				unit: item.unit,
			}));

			console.table(payload);

			toast({
				title: "提交成功",
				description: "换货验收结果已提交（模拟）",
				variant: "success",
			});
		} catch (error) {
			toast({
				title: "提交失败",
				description: error instanceof Error ? error.message : "提交验收信息时出错",
				variant: "destructive",
			});
		} finally {
			setSubmitting(false);
		}
	};

	if (!isMarket) {
		return (
			<div className="container mx-auto py-10">
				<Alert variant="destructive">
					<AlertTitle>权限不足</AlertTitle>
					<AlertDescription>仅市场用户可以验收换货商品。</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="container mx-auto py-16 flex flex-col items-center gap-2 text-muted-foreground">
				<Loader2 className="h-5 w-5 animate-spin" />
				<span className="text-sm">正在加载换货验收信息...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto py-16">
				<Alert variant="destructive">
					<AlertTitle>加载失败</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">换货验收</h1>
					<p className="mt-1 text-sm text-muted-foreground">订单编号：{orderDetail?.orderCode ?? orderCode}</p>
				</div>
				<Button variant="ghost" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="mr-2 h-4 w-4" /> 返回订单详情
				</Button>
			</div>

			<Card>
				<CardHeader className="gap-4 md:flex md:items-center md:justify-between">
					<div className="space-y-1">
						<CardTitle className="text-lg">验收概况</CardTitle>
						<CardDescription>核对供应商重新交付的商品批次，确认数量与处理方式。</CardDescription>
					</div>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<SummaryChip label="申请换货" value={`${summary.totalRequested.toFixed(2)} ${exchangeItems[0]?.unit ?? ""}`} />
						<SummaryChip label="供应商交付" value={`${summary.totalSupplier.toFixed(2)} ${exchangeItems[0]?.unit ?? ""}`} />
						<SummaryChip label="验收通过" value={`${summary.accepted} 项`} status="success" />
						<SummaryChip label="待确认" value={`${summary.pending} 项`} status="warning" />
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
						<div className="flex items-start gap-2">
							<RefreshCw className="h-4 w-4 mt-0.5 text-muted-foreground" />
							<div>
								<p className="font-medium text-foreground">验收提醒</p>
								<p>确认供应商交付数量与状态；若退回处理请填写原因，提交后将同步售后记录。</p>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						{exchangeItems.map((item) => {
							const current = formState[item.id];
							return (
								<Card key={item.id} className="shadow-sm">
									<CardHeader className="pb-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div>
												<CardTitle className="flex items-center gap-2 text-base">
													<Package className="h-4 w-4 text-muted-foreground" />
													{item.name}
												</CardTitle>
												<CardDescription className="mt-1 text-sm">
													{item.category} · 申请 {item.requestedQuantity.toFixed(2)} {item.unit} · 交付 {item.supplierQuantity.toFixed(2)} {item.unit}
												</CardDescription>
											</div>
											<Badge variant="secondary" className="text-xs">商品编号 {item.productId}</Badge>
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid gap-4 md:grid-cols-3">
											<div className="space-y-2">
												<p className="text-sm font-medium text-foreground">验收数量</p>
												<Input
													type="number"
													value={current?.quantity ?? ""}
													onChange={(event) => handleQuantityChange(item.id, event.target.value)}
													placeholder="输入验收数量"
													min="0"
													step="0.01"
													className={cn("max-w-sm", current?.quantityError ? "border-destructive" : undefined)}
												/>
												{current?.quantityError && (
													<p className="text-xs text-destructive">{current.quantityError}</p>
												)}
											</div>
											<div className="space-y-2">
												<p className="text-sm font-medium text-foreground">处理方式</p>
												<Select
													value={current?.decision ?? OperationType.SIGN}
													onValueChange={(value: OperationType) => handleDecisionChange(item.id, value)}
												>
													<SelectTrigger className="max-w-sm">
														<SelectValue placeholder="选择处理方式" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value={OperationType.SIGN}>验收通过</SelectItem>
														<SelectItem value={OperationType.RETURN}>退回处理</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<p className="text-sm font-medium text-foreground">处理说明</p>
												<Textarea
													placeholder="补充验收说明"
													value={current?.reason ?? ""}
													onChange={(event) => handleReasonChange(item.id, event.target.value)}
													className="min-h-[96px] max-w-sm"
												/>
												{current?.decision === OperationType.RETURN && (
													<p className="text-xs text-muted-foreground">退回处理需填写原因。</p>
												)}
											</div>
										</div>

										{item.originReason && (
											<div className="rounded-md border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
												<p className="font-medium text-foreground">初始换货原因</p>
												<p className="mt-1 leading-relaxed">{item.originReason}</p>
											</div>
										)}
									</CardContent>
								</Card>
							);
						})}
					</div>
				</CardContent>
			</Card>

			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<p className="text-sm text-muted-foreground">
					请确认所有换货商品的信息后再提交。验收通过将更新商品状态，退回处理会重新触发售后协商。
				</p>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => router.back()} disabled={submitting}>
						取消
					</Button>
					<Button onClick={handleSubmit} disabled={submitting}>
						{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{submitting ? "提交中..." : "提交验收"}
					</Button>
				</div>
			</div>
		</div>
	);
}

function SummaryChip({ label, value, status }: { label: string; value: string; status?: "success" | "warning" }) {
	const themeMap: Record<string, string> = {
		success: "border-green-500 bg-green-50 text-green-700",
		warning: "border-amber-500 bg-amber-50 text-amber-700",
	};

	return (
		<div
			className={cn(
				"flex flex-col rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground",
				status ? themeMap[status] : undefined
			)}
		>
			<span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
			<span className="mt-1 text-base font-semibold text-foreground">{value}</span>
		</div>
	);
}
