"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { groupByRound, getDeliveredQuantityFromRound, getCustomerActualDeliveredQuantity } from "./order-details/roundGrouping";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";

// 导入类型定义（type-only import）
import type {
	Order,
	OrderItem,
	ExchangeReturnRecord,
	ExchangeReturnRecordWithInput,
	ExchangeItem,
	OrderDetailData,
	ApiResponse,
} from "@/lib/types/orderStatus";

// 导入枚举和值
import {
  OrderStatus,
  OperationType,
  TenantType,
  ExchangeItemStatus
} from "@/lib/types/orderStatus";

// 导入状态工具函数
import {
	shouldEnterEditMode,
	shouldShowReceivedQuantityColumns
} from "@/lib/utils/orderStatusUtils";

// 导入 Hooks
import { useOrderDetails } from "@/app/workspace/hooks/useOrderDetails";
import { useOrderCalculations } from "@/app/workspace/hooks/useOrderCalculations";
import { useOrderOperations } from "@/app/workspace/hooks/useOrderOperations";
import { useOrderEditing } from "@/app/workspace/hooks/useOrderEditing";
import { useOrderActions } from "@/app/workspace/hooks/useOrderActions";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import ProductSignDialog from "./ProductSignDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ActionToolbar } from "./order-details/ActionToolbar";
import type { ActionDescriptor, ProductStatusSummary } from "./order-details/types";
import { OrderInfoCard } from "./order-details/OrderInfoCard";
import { ProductListSection } from "./order-details/ProductListSection";
import { ExchangeListSection } from "./order-details/ExchangeListSection";
import { ReturnListSection } from "./order-details/ReturnListSection";
import { StatusHistoryTimeline } from "./order-details/StatusHistoryTimeline";
import { getOrderStrategy } from "./order-details/strategies/OrderStrategyFactory";
import type { OrderStrategyContext } from "./order-details/strategies/OrderStrategy";


interface OrderDetailProps {
	orderCode: string;
	orgId: string;
	tenantType: string;
}

type ItemQuantityPayload = {
	id: number;
	deliveredQuantity: string;
};

interface ProviderDeliverRequest {
	stockedBy: string;
	items: ItemQuantityPayload[];
}

type MarketInspectRequest = ItemQuantityPayload[];

export default function OrderDetail({ orderCode, orgId, tenantType }: OrderDetailProps) {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const { user } = useWorkspace();

	// 使用提取的 Hooks
	const orderDetailsData = useOrderDetails(orderCode, orgId, tenantType);
	const {
		orderDetail,
		setOrderDetail,
		orderItems,
		setOrderItems,
		returnExchangeRecords,
		setReturnExchangeRecords,
		rawReceipts,
		inspections,
		setInspections,
		deliveries,
		setDeliveries,
		statusHistory,
		loading,
		error,
		isEditing,
		setIsEditing,
	} = orderDetailsData;

	const [exchangeReturnRecords, setExchangeReturnRecords] = useState<ExchangeReturnRecordWithInput[]>([]);
	const [loadingExchangeReturn, setLoadingExchangeReturn] = useState(false);
	const [exchangeReturnError, setExchangeReturnError] = useState<string | null>(null);

	// 按轮数分组数据（需要先定义，因为 useOrderCalculations 依赖它）
	const roundGroups = useMemo(() => {
		// CUSTOMER 用户：如果订单状态不是 MARKET_DELIVERING 或 EXCHANGE_NEW_DELIVERING，不按轮数分组
		if (tenantType?.toLowerCase() === TenantType.CUSTOMER) {
			const status = orderDetail?.orderStatus;
			if (status !== OrderStatus.MARKET_DELIVERING && status !== OrderStatus.EXCHANGE_NEW_DELIVERING) {
				return [];
			}
		}
		if (!deliveries || deliveries.length === 0) {
			return [];
		}
		return groupByRound(deliveries || [], inspections || [], orderItems, rawReceipts || []);
	}, [deliveries, inspections, orderItems, rawReceipts, tenantType, orderDetail]);

	const calculations = useOrderCalculations(orderItems, returnExchangeRecords, isEditing, inspections, roundGroups, tenantType);
	const {
		returnMoney,
		shouldDisplayReturnMoney,
		actualTotal,
		originalTotal,
		discountTotal,
		calculateActualTotal,
		calculateOriginalTotal,
		calculateDiscountTotal,
		getCategorySummary,
	} = calculations;

	// 从最近一轮的 deliveries 中获取实际到货量的函数
	// 对于CUSTOMER用户，从inspections中获取MARKET的验收数量
	const getActualDeliveredQuantity = useCallback((orderDetailId: number): string => {
		// 如果是CUSTOMER用户，从inspections中获取实际到货量
		if (tenantType?.toLowerCase() === 'customer' && inspections && inspections.length > 0) {
			return getCustomerActualDeliveredQuantity(orderDetailId, inspections);
		}
		
		// 其他情况，从deliveries中获取
		if (!roundGroups || roundGroups.length === 0) {
			return "0";
		}
		
		// 找到最新的一轮（isLatest 为 true）
		const latestRound = roundGroups.find(group => group.isLatest);
		if (!latestRound || latestRound.deliveries.length === 0) {
			return "0";
		}
		
		return getDeliveredQuantityFromRound(orderDetailId, latestRound.deliveries);
	}, [roundGroups, tenantType, inspections]);

	const operations = useOrderOperations(
		orderCode,
		orderItems,
		setOrderItems,
		returnExchangeRecords,
		setReturnExchangeRecords,
		user,
		orderDetail?.orderStatus,
		tenantType,
		getActualDeliveredQuantity,
		inspections,
		setInspections
	);
	const {
		operatingProductId,
		setOperatingProductId,
		operationType,
		setOperationType,
		operatingQuantity,
		setOperatingQuantity,
		operatingReason,
		setOperatingReason,
		useFullQuantity,
		setUseFullQuantity,
		quantityError,
		setQuantityError,
		reasonError,
		setReasonError,
		showOperationDialog,
		setShowOperationDialog,
		showConfirmDialog,
		setShowConfirmDialog,
		handleOperation,
		handleQuantityChange,
		handleReasonChange,
		handleUseFullQuantity,
		handleSubmitOperation,
		handleConfirmOperation: handleConfirmOperationFromHook,
		getItemReturnExchangeRecords
	} = operations;

	const editing = useOrderEditing(orderItems, setOrderItems);
	const {
		itemErrors,
		savingChanges,
		setSavingChanges,
		handleActualQuantityChange,
		handleActualQuantityKeyDown,
		isUnitAllowingDecimal,
		hasErrors,
	} = editing;

	const actions = useOrderActions(
		orderCode,
		orgId,
		tenantType,
		user,
		params,
		orderDetail,
		setOrderDetail,
		returnExchangeRecords,
		orderItems
	);
	const {
		processing,
		showDeliveryStaffDialog,
		setShowDeliveryStaffDialog,
		deliveryStaffs,
		selectedDeliveryStaff,
		setSelectedDeliveryStaff,
		beginInspecting,
		deliveringToCustomer,
		afterSaleTimestamp,
		showRejectConfirmDialog,
		setShowRejectConfirmDialog,
		statusChangeMessage,
		setStatusChangeMessage,
		handleStartProcessing,
		submitStartProcessing,
		handleDeliveryStaffChange,
		completeAcceptance,
		completeOrder,
		deliverToCustomer,
		handleBeginInspect,
		handleRejectOrComplete,
		requestCustomerExchange,
		requestingCustomerExchange,
	} = actions;

	// 处理确认操作
	const handleConfirmOperation = () => {
		handleConfirmOperationFromHook(orderDetail as Order);
	};

	// 处理显示拒绝确认对话框
	const showRejectConfirmation = () => {
		setShowRejectConfirmDialog(true);
	};


	// ExchangeItemsTable 相关函数
	const handleExchangeStatusChange = async (itemId: number, newStatus: ExchangeItemStatus, reason?: string) => {
		try {
			// 直接从localExchangeItems中获取最新的actualQuantity，如果没有则从exchangeItems获取
			const localItem = localExchangeItems.find(item => item.id === itemId);
			const exchangeItem = exchangeItems.find(item => item.id === itemId);
			const actualQuantity = localItem?.actualQuantity ?? exchangeItem?.actualQuantity ?? 0;

			// 所有换货操作都通过更新实际数量API实现
			const response = await fetch(`/api/orders/${orderCode}/update-exchange-item-actual`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					orderDetailId: itemId,
					actualQuantity: actualQuantity,
				}),
			});

			if (!response.ok) {
				throw new Error(`更新换货实际数量失败: ${response.status}`);
			}

			toast({
				title: '操作成功',
				description: '换货商品状态已更新',
				variant: 'success',
			});

			// 刷新数据
			window.location.reload();
		} catch (err) {
			toast({
				title: '操作失败',
				description: err instanceof Error ? err.message : '状态更新时发生错误',
				variant: 'destructive',
			});
		}
	};

	const canPerformExchangeAction = (item: ExchangeItem, action: string) => {
		// PROVIDER用户在EXCHANGE_IN_PROGRESS状态下可以进行确认操作
		if (tenantType.toLowerCase() === TenantType.PROVIDER && action === 'confirm') {
			return orderDetail?.orderStatus === 'EXCHANGE_IN_PROGRESS' && item.status === ExchangeItemStatus.PENDING;
		}
		// PROVIDER用户在其他状态下可以进行发货操作
		if (tenantType.toLowerCase() === TenantType.PROVIDER && action === 'ship') {
			return item.status === ExchangeItemStatus.PENDING;
		}
		// MARKET用户可以进行收货、拒收、完成操作
		if (tenantType.toLowerCase() === TenantType.MARKET) {
			if (action === 'receive' && item.status === ExchangeItemStatus.SHIPPED) return true;
			if (action === 'reject' && item.status === ExchangeItemStatus.SHIPPED) return true;
			if (action === 'complete' && item.status === ExchangeItemStatus.RECEIVED) return true;
		}
		// CUSTOMER用户可以确认完成
		if (tenantType.toLowerCase() === TenantType.CUSTOMER && action === 'confirm') {
			return item.status === ExchangeItemStatus.RECEIVED;
		}
		return false;
	};

	const getExchangeStatusLabel = (status: ExchangeItemStatus) => {
		const labels: Record<ExchangeItemStatus, string> = {
			[ExchangeItemStatus.PENDING]: '待发货',
			[ExchangeItemStatus.SHIPPED]: '已发货',
			[ExchangeItemStatus.RECEIVED]: '已收货',
			[ExchangeItemStatus.REJECTED]: '已拒收',
			[ExchangeItemStatus.COMPLETED]: '已完成',
		};
		return labels[status] || status;
	};

	const getExchangeStatusVariant = (status: ExchangeItemStatus) => {
		const variants: Record<ExchangeItemStatus, "default" | "secondary" | "destructive" | "outline"> = {
			[ExchangeItemStatus.PENDING]: 'outline',
			[ExchangeItemStatus.SHIPPED]: 'secondary',
			[ExchangeItemStatus.RECEIVED]: 'default',
			[ExchangeItemStatus.REJECTED]: 'destructive',
			[ExchangeItemStatus.COMPLETED]: 'default',
		};
		return variants[status] || 'default';
	};

	const shouldShowDeliverQuantityColumn = useMemo(() => {
		if (!orderDetail) {
			return false;
		}

		return true;

		// if (tenantType.toLowerCase() === TenantType.PROVIDER) {
		// 	return true;
		// }
		// return ![
		// 	OrderStatus.PENDING,
		// 	OrderStatus.ASSIGNED,
		// 	OrderStatus.SUPPLIER_PREPARING,
		// ].includes(orderDetail.orderStatus as OrderStatus);
	}, [orderDetail, tenantType]);

	const showReceivedQuantityColumn = useMemo(() => {
		if (!orderDetail?.orderStatus) {
			return false;
		}
		// CUSTOMER用户在任何订单状态下都应该显示收货量列
		if (tenantType?.toLowerCase() === TenantType.CUSTOMER) {
			return true;
		}
		// PROVIDER和MARKET用户在任何订单状态下都应该显示市场接收和客户接收列
		if (tenantType?.toLowerCase() === TenantType.PROVIDER || tenantType?.toLowerCase() === TenantType.MARKET) {
			return true;
		}
		return shouldShowReceivedQuantityColumns(orderDetail.orderStatus as OrderStatus, tenantType);
	}, [orderDetail, tenantType]);

	useEffect(() => {
		if (!orderDetail) {
			return;
		}

		const enableEditing = shouldEnterEditMode(orderDetail.orderStatus as OrderStatus, tenantType);
		if (enableEditing && !isEditing) {
			setIsEditing(true);
		}

		if (!enableEditing && isEditing) {
			setIsEditing(false);
		}
	}, [orderDetail, tenantType, isEditing, setIsEditing]);

	// 获取退换货记录的函数
	const fetchExchangeReturnRecords = useCallback(async () => {
		try {
			setLoadingExchangeReturn(true);
			setExchangeReturnError(null);

			const response = await fetch(`/api/orders/${orderCode}/exchange-and-return-order-details`);
			if (!response.ok) {
				throw new Error(`获取退换货记录失败: ${response.status}`);
			}

			const result = await response.json();
			setExchangeReturnRecords(
				(result?.data ?? []).map((record: ExchangeReturnRecord) => ({
					...record,
					inputQuantity: record.actualQuantity ?? record.quantity ?? '0',
					submitting: false,
					submitError: null,
				}))
			);
		} catch (err) {
			setExchangeReturnError(err instanceof Error ? err.message : '获取退换货记录时出错');
		} finally {
			setLoadingExchangeReturn(false);
		}
	}, [orderCode]);

	useEffect(() => {
		if (!orderDetail) {
			return;
		}

		fetchExchangeReturnRecords();
	}, [orderDetail, fetchExchangeReturnRecords]);

	// 处理返回上一页
	const handleGoBack = useCallback(() => {
		router.back();
	}, [router]);

	const navigateToMarketExchangePage = useCallback(() => {
		const marketParam = params?.market_id;
		const marketId = Array.isArray(marketParam) ? marketParam[0] : marketParam ?? orgId;
		router.push(`/workspace/markets/${marketId}/orders/${orderCode}/exchange`);
	}, [router, params, orgId, orderCode]);

	const handleBeginExchangeProcessing = useCallback(async () => {
		try {
			setStartingExchange(true);
			const response = await fetch(`/api/orders/${orderCode}/begin-exchange-progress`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ operateBy: user?.name || '' }),
			});

			if (!response.ok) {
				throw new Error(`开始换货失败: ${response.status}`);
			}

			// 尝试从响应中获取更新后的订单状态
			let responseData;
			try {
				responseData = await response.json();
			} catch {
				responseData = null;
			}

			// 更新订单状态（如果 API 返回了更新后的状态）
			if (orderDetail && responseData?.orderStatus) {
				setOrderDetail({
					...orderDetail,
					orderStatus: responseData.orderStatus,
				});
			} else if (orderDetail) {
				// 如果没有返回状态，假设状态更新为 EXCHANGE_IN_PROGRESS
				setOrderDetail({
					...orderDetail,
					orderStatus: OrderStatus.EXCHANGE_IN_PROGRESS,
				});
			}

			// 刷新退换货记录数据
			await fetchExchangeReturnRecords();

			// 切换到换货清单 tab
			setActiveTab("exchange");

			toast({
				title: '操作成功',
				description: '已开始处理换货，请在换货清单中填写实际换货数量',
				variant: 'success',
			});
		} catch (error) {
			toast({
				title: '操作失败',
				description: error instanceof Error ? error.message : '开始换货时出错',
				variant: 'destructive',
			});
		} finally {
			setStartingExchange(false);
		}
	}, [orderCode, toast, user?.name, fetchExchangeReturnRecords, orderDetail]);

	// 添加导出Excel功能
	const exportToExcel = useCallback(async () => {
		if (!orderItems || orderItems.length === 0) {
			toast({
				title: "导出失败",
				description: "订单商品列表为空，无法导出",
				variant: "destructive",
				duration: 3000,
			});
			return;
		}

		try {
			setExportingExcel(true);

			// 创建工作簿和工作表
			const workbook = new ExcelJS.Workbook();
			const worksheet = workbook.addWorksheet('订单商品清单');

			// 设置列
			worksheet.columns = [
				{ header: '商品名称', key: 'name', width: 30 },
				{ header: '类别', key: 'category', width: 15 },
				{ header: '下单数量', key: 'quantity', width: 10 },
				{ header: '实际发货量', key: 'actualQuantity', width: 10 },
				{ header: '单位', key: 'unit', width: 10 },
				{ header: '单价(元)', key: 'price', width: 15 },
				{ header: '折扣率', key: 'discountRate', width: 10 },
				{ header: '实际单价(元)', key: 'actualPrice', width: 15 },
				{ header: '小计(折后)', key: 'total', width: 15 },
				{ header: '操作记录', key: 'operations', width: 20 },
				{ header: '加工要求', key: 'processingRequirements', width: 30 },
				{ header: '备注', key: 'remark', width: 30 },
			];

			// 添加数据
			for (const item of orderItems) {
				// 计算小计金额，确保使用最新的actualQuantity
				const itemTotal = parseFloat(item.discountedUnitPrice) * 0;

				// 获取当前商品的操作记录
				const itemOperations = getItemReturnExchangeRecords(item.id);
				const operationsText = itemOperations.map(record => {
					if (record.operationType === 'SIGN') {
						return `已签收: ${record.quantity} ${record.unit}${record.reason ? ' - ' + record.reason : ''}`;
					} else {
						return `${record.operationType === 'RETURN' ? '退货' : '换货'}: ${record.quantity} ${record.unit} - ${record.reason}`;
					}
				}).join('; ');

				// worksheet.addRow({
				// 	name: item.name,
				// 	category: item.category,
				// 	quantity: parseFloat(item.orderedQty).toFixed(2),
				// 	acceptedQuantity: parseFloat(item.acceptedQuantity).toFixed(2),
				// 	unit: item.unit,
				// 	price: parseFloat(item.unitPrice).toFixed(2),
				// 	discountRate: `${(parseFloat(item.discountRate) * 100).toFixed(0)}%`,
				// 	actualPrice: parseFloat(item.discountedUnitPrice).toFixed(2),
				// 	total: isNaN(itemTotal) ? '0.00' : itemTotal.toFixed(2),
				// 	operations: operationsText,
				// 	processingRequirements: item.processingRequirements || '',
				// 	remark: item.remark || ''
				// });

				// 如果有退货/换货记录，添加详细行
				const returnExchangeRecords = itemOperations.filter(r => r.operationType !== 'SIGN');
				for (const record of returnExchangeRecords) {
					// 计算退货/换货金额
					const recordAmount = parseFloat(item.discountedUnitPrice) * record.quantity;

					worksheet.addRow({
						name: `- ${record.operationType === 'RETURN' ? '退货' : '换货'}`,
						category: '',
						quantity: '',
						actualQuantity: `-${record.quantity}`,
						unit: record.unit,
						price: '',
						discountRate: '',
						actualPrice: '',
						total: record.operationType === 'RETURN' ? `-${recordAmount.toFixed(2)}` : '',
						operations: record.reason,
						processingRequirements: '',
						remark: ''
					}).font = { color: { argb: 'FFFF0000' } }; // 红色字体
				}
			}

			// 添加合计行
			const totalAmount = orderDetail ?
				(isEditing ? parseFloat(actualTotal) : parseFloat(orderDetail.netAmount)) :
				parseFloat(actualTotal);

			worksheet.addRow({
				name: '合计',
				quantity: '',
				actualQuantity: '',
				unit: '',
				price: '',
				discountRate: '',
				actualPrice: '',
				total: isNaN(totalAmount) ? '0.00' : totalAmount.toFixed(2),
				operations: '',
				processingRequirements: '',
				remark: ''
			}).font = { bold: true };

			// 设置表头样式
			worksheet.getRow(1).font = { bold: true };
			worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

			// 设置数字列的格式
			worksheet.getColumn('price').numFmt = '0.00';
			worksheet.getColumn('actualPrice').numFmt = '0.00';
			worksheet.getColumn('total').numFmt = '0.00';

			// 导出为Excel文件
			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

			// 使用订单编号和当前日期作为文件名的一部分
			const fileName = `订单商品清单_${orderDetail?.orderCode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
			saveAs(blob, fileName);

			toast({
				title: "导出成功",
				description: `订单商品清单已导出为Excel文件`,
				variant: "default",
				duration: 3000,
			});
		} catch (error) {
			console.error("导出Excel出错:", error);
			toast({
				title: "导出失败",
				description: "导出Excel文件时出错",
				variant: "destructive",
				duration: 3000,
			});
		} finally {
			setExportingExcel(false);
		}
	}, [
		orderItems,
		toast,
		getItemReturnExchangeRecords,
		orderDetail,
		isEditing,
		actualTotal,
		originalTotal,
		discountTotal,
		returnMoney,
		orderCode
	]);

	// 添加 showOrderInfo 和 showBeginInspectDialog 状态
	// const [showOrderInfo, setShowOrderInfo] = useState(false);
	// const [showBeginInspectDialog, setShowBeginInspectDialog] = useState(false);
	const [exportingExcel, setExportingExcel] = useState(false);
	const [startingExchange, setStartingExchange] = useState(false);
	const [activeTab, setActiveTab] = useState<string>("products");

	

	// 处理保存实际数量
	const handleSaveActualQuantities = async () => {
		if (hasErrors() || savingChanges) return;

		const tenantRaw = tenantType.toLowerCase();
		const tenantEnum = tenantRaw as TenantType;
		const buildPayload = (items: OrderItem[]): ItemQuantityPayload[] =>
			items.map(item => ({
				id: item.id,
				deliveredQuantity: (item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || '0',
			}));

		try {
			setSavingChanges(true);

			let response: Response;

			switch (tenantEnum) {
				case TenantType.PROVIDER: {
					const apiUrl = `/api/orders/${orderCode}/deliver-to-market`;
					
					// 在 EXCHANGE_IN_PROGRESS 状态下，只提交换货的商品
					let payloadItems: ItemQuantityPayload[];
					if (orderDetail?.orderStatus === OrderStatus.EXCHANGE_IN_PROGRESS) {
						// 只提交换货的商品，并使用实际数量（优先使用 localExchangeItems，其次使用 exchangeRecords）
						payloadItems = exchangeRecords.map(record => {
							const orderItem = orderItems.find(item => item.id === record.orderDetailId);
							if (!orderItem) return null;
							
							// 优先使用本地编辑的实际数量
							const localItem = localExchangeItems.find(item => item.id === record.orderDetailId);
							const actualQty = localItem?.actualQuantity ?? 
											  Number(record.actualQuantity) ?? 
											  Number(record.inputQuantity) ?? 
											  Number(record.quantity) ?? 
											  '0';
							
							return {
								id: orderItem.id,
								deliveredQuantity: actualQty.toString(),
							};
						}).filter((item): item is ItemQuantityPayload => item !== null);
					} else {
						// 其他状态下，提交所有商品
						payloadItems = buildPayload(orderItems);
					}
					
					const payload: ProviderDeliverRequest = {
						stockedBy: user?.name ?? '',
						items: payloadItems,
					};
					response = await fetch(apiUrl, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(payload),
					});
					break;
				}
				case TenantType.MARKET: {
					const apiUrl = hasExchangedItems ? `/api/orders/${orderCode}/exchange-request` : `/api/orders/${orderCode}/accept`;

					const targetItems = orderDetail?.orderStatus === OrderStatus.EXCHANGE_INSPECTING
						? (hasExchangedItems ? orderItems : [])
						: orderItems;
					const payload: MarketInspectRequest = buildPayload(targetItems);
					response = await fetch(apiUrl, {
						method: 'PATCH',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(payload),
					});
					break;
				}
				case TenantType.CUSTOMER:
					throw new Error('不支持的租户类型');
				default:
					throw new Error('不支持的租户类型');
			}

			if (!response.ok) {
				throw new Error(`保存实际发货量失败: ${response.status}`);
			}

			// 重新获取订单详情，以更新 deliveries 数据
			try {
				const refreshResponse = await fetch(`/api/orders/${orderCode}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (refreshResponse.ok) {
					const jsonResponse = await refreshResponse.json();
					
					// 处理 API 响应格式
					let responseData: OrderDetailData;
					if ('code' in jsonResponse && 'data' in jsonResponse) {
						const apiResponse = jsonResponse as ApiResponse;
						const responseCode = typeof apiResponse.code === 'string' ? parseInt(apiResponse.code, 10) : apiResponse.code;
						if (isNaN(responseCode) || responseCode !== 200) {
							throw new Error(apiResponse.message || '获取订单详情失败');
						}
						if (!apiResponse.data) {
							throw new Error('API响应中缺少data字段');
						}
						responseData = apiResponse.data;
					} else if ('order' in jsonResponse && 'items' in jsonResponse) {
						responseData = jsonResponse as OrderDetailData;
					} else {
						throw new Error('API响应格式不正确');
					}

					// 更新 deliveries
					if (responseData.deliveries) {
						setDeliveries(responseData.deliveries);
					}

					// 更新 orderItems
					if (responseData.items) {
						setOrderItems(responseData.items);
					}

					// 更新 orderDetail
					if (responseData.order) {
						const orderDetailData: Order = {
							...responseData.order,
							orderCode: orderCode,
							customerName: responseData.order.customerName || '',
							contactName: responseData.order.contactName || responseData.order.receiverName || '',
							contactPhone: responseData.order.contactPhone || responseData.order.receiverPhone || '',
							deliveryStaffName: responseData.order.deliveryStaffName || responseData.order.shipperName || null,
							deliveryStaffPhone: responseData.order.deliveryStaffPhone || responseData.order.shipperPhone || null,
						};

						let newStatus = orderDetailData.orderStatus as OrderStatus;
						if (orderDetail?.orderStatus === OrderStatus.EXCHANGE_IN_PROGRESS) {
							newStatus = OrderStatus.EXCHANGE_DELIVERING;
						} else if (orderDetail?.orderStatus === OrderStatus.EXCHANGE_INSPECTING && tenantRaw === TenantType.MARKET) {
							newStatus = OrderStatus.EXCHANGE_COMPLETED;
						} else if (orderDetail?.orderStatus === OrderStatus.MARKET_INSPECTING && tenantRaw === TenantType.MARKET) {
							newStatus = OrderStatus.MARKET_ACCEPTED;
						} else if (orderDetail?.orderStatus === OrderStatus.CUSTOMER_INSPECTING && tenantRaw === TenantType.CUSTOMER) {
							newStatus = OrderStatus.COMPLETED;
						} else if (tenantRaw === TenantType.PROVIDER && orderDetail?.orderStatus === OrderStatus.SUPPLIER_PREPARING) {
							newStatus = OrderStatus.SUPPLIER_DELIVERING;
						}

						setOrderDetail({
							...orderDetailData,
							orderStatus: newStatus,
							netAmount: actualTotal,
							orderedAmount: originalTotal,
							discountAmount: discountTotal,
						});
					}
				}
			} catch (refreshError) {
				console.error('刷新订单详情失败:', refreshError);
				// 即使刷新失败，也继续执行后续逻辑
			}

			setIsEditing(false);

			toast({
				title: "保存成功",
				description: tenantRaw === TenantType.MARKET ? "换货商品已验收" : "实际发货量已更新",
				variant: "success",
				duration: 3000,
			});
		} catch (err) {
			toast({
				title: "保存失败",
				description: err instanceof Error ? err.message : "保存实际数量时出错",
				variant: "destructive",
				duration: 3000,
			});
		} finally {
			setSavingChanges(false);
		}
	};

	const tenantEnum = tenantType.toLowerCase() as TenantType;
	const orderStatus = orderDetail?.orderStatus as OrderStatus | undefined;
	// 判断是否有换货：先看 afterSales 是否为空，空则表示无换货
	// 如果非空，则判断 inspections 中最大轮数的 inspectionId 和 afterSales 中对应的 inspectionId 的记录是否是 "operationType": "EXCHANGE"
	const hasExchangedItems = (() => {
		if (!rawReceipts || rawReceipts.length === 0) {
			return false;
		}

		// 找到inspections中最大轮数的inspectionId
		const maxInspectionRound = Math.max(...(inspections || []).map(inspection => inspection.inspectionRound));
		const latestInspection = (inspections || []).find(inspection => inspection.inspectionRound === maxInspectionRound);

		if (!latestInspection) {
			return false;
		}

		// 检查afterSales中是否有对应的inspectionId且operationType为EXCHANGE的记录
		return rawReceipts.some(afterSale =>
			afterSale.inspectionId === latestInspection.inspectionId &&
			afterSale.operationType === 'EXCHANGE'
		);
	})();

	// 获取策略实例
	const orderStrategy = useMemo(() => getOrderStrategy(tenantType), [tenantType]);

const productStatusSummary: ProductStatusSummary = useMemo(() => {
	if (!orderDetail || !orderItems || orderItems.length === 0) {
		return { totalItems: 0, hasExchange: false, allInspected: false, itemStatusMap: {} };
	}

	const totalItems = orderItems.length;

	// receipts只包含退换货记录（RETURN和EXCHANGE），不包含SIGN记录
	// 构建退换货记录映射
	const receiptMap = returnExchangeRecords.reduce<Record<number, OperationType | undefined>>((acc, record) => {
		acc[record.id] = record.operationType;
		return acc;
	}, {});

	const normalizedStatuses = orderItems.map((item) => {
		const receiptStatus = receiptMap[item.id];
		
		// 优先处理退换货记录（RETURN和EXCHANGE）
		if (receiptStatus === OperationType.EXCHANGE) {
			return 'EXCHANGE';
		}
		if (receiptStatus === OperationType.RETURN) {
			return 'RETURN';
		}
		
		// 对于验收状态（SIGN），应该从inspections中获取，而不是从receipts中获取
		// receipts中不包含SIGN记录，SIGN状态应该通过策略的getItemStatus从inspections中获取
		// 使用策略判断商品状态（策略会根据租户类型从对应的inspections中获取状态）
		const currentStatus = orderDetail.orderStatus as OrderStatus;
		try {
			// 传递undefined作为receiptStatus，因为SIGN状态应该从inspections中获取
			return orderStrategy.getItemStatus(item, undefined, currentStatus, inspections || []);
		} catch (error) {
			console.error('获取商品状态时出错:', error, item);
			return 'PENDING';
		}
	});

	const hasExchange = normalizedStatuses.includes('EXCHANGE');
	const inspectedStatuses = new Set(['SIGN', 'RETURN', 'EXCHANGE']);
	const inspectedCount = normalizedStatuses.filter((status) => inspectedStatuses.has(status)).length;
	const allInspected = totalItems > 0 && inspectedCount === totalItems;

	// 创建商品ID到状态的映射
	const itemStatusMap = orderItems.reduce((acc, item, index) => {
		acc[item.id] = normalizedStatuses[index];
		return acc;
	}, {} as Record<number, string>);

	return { totalItems, hasExchange, allInspected, itemStatusMap };
	}, [orderItems, returnExchangeRecords, orderDetail, orderStrategy, inspections, tenantType]);

	const inspectionProgress = useMemo(() => {
		if (!inspections || inspections.length === 0) {
			return {
				marketCompleted: false,
				customerCompleted: false,
				marketInspectionResult: null as string | null,
				customerInspectionResult: null as string | null,
			};
		}

		const latestByType = inspections.reduce<Record<string, typeof inspections[number]>>((acc, record) => {
			const typeKey = record.inspectedByType?.toUpperCase();
			if (!typeKey) {
				return acc;
			}
			// 获取当前记录的轮数（使用 inspectionRound）
			const existingRound = acc[typeKey] 
				? (acc[typeKey].inspectionRound ?? 0)
				: -Infinity;
			const nextRound = record.inspectionRound ?? 0;
			if (!acc[typeKey] || nextRound >= existingRound) {
				acc[typeKey] = record;
			}
			return acc;
		}, {});

		const hasCompleted = (typeKey: 'MARKET' | 'CUSTOMER') => {
			const result = latestByType[typeKey]?.result?.toUpperCase();
			if (!result) {
				return false;
			}
			return result !== 'PENDING';
		};

		const getInspectionResult = (typeKey: 'MARKET' | 'CUSTOMER') => {
			const record = latestByType[typeKey];
			if (!record || !record.result) {
				return null;
			}
			const result = record.result.toUpperCase();
			return result || null;
		};

		return {
			marketCompleted: hasCompleted('MARKET'),
			customerCompleted: hasCompleted('CUSTOMER'),
			marketInspectionResult: getInspectionResult('MARKET'),
			customerInspectionResult: getInspectionResult('CUSTOMER'),
		};
	}, [inspections]);


	// 判断是否应该显示操作菜单（考虑inspections数据）
	// 使用策略判断
	const shouldShowInspectMenuWithInspections = useMemo(() => {
		if (!orderDetail || !orderStatus) {
			return false;
		}

		const statusEnum = orderStatus as OrderStatus;
		return orderStrategy.shouldShowInspectMenu(statusEnum, inspections || [], inspectionProgress);
	}, [orderDetail, orderStatus, orderStrategy, inspections, inspectionProgress]);

	// 判断是否应该显示状态列（考虑inspections数据）
	// 使用策略判断
	const shouldShowStatusColumn = useMemo(() => {
		if (!orderDetail || !orderStatus) {
			return false;
		}

		const statusEnum = orderStatus as OrderStatus;
		return orderStrategy.shouldShowStatusColumn(statusEnum, orderItems, inspections || [], inspectionProgress);
	}, [orderDetail, orderStatus, orderStrategy, orderItems, inspections, inspectionProgress]);

	const exchangeRecords = useMemo(
		() => exchangeReturnRecords.filter((record) => record.operationType === OperationType.EXCHANGE),
		[exchangeReturnRecords]
	);

	const returnRecords = useMemo(
		() => exchangeReturnRecords.filter((record) => record.operationType === OperationType.RETURN),
		[exchangeReturnRecords]
	);

	// 转换退换货记录为ExchangeItem格式，用于ExchangeItemsTable
	const [localExchangeItems, setLocalExchangeItems] = useState<ExchangeItem[]>([]);

	const exchangeItems = useMemo(() => {
		return exchangeRecords.map((record) => {
			// 从orderItems中获取价格信息
			const orderItem = orderItems.find(item => item.id === record.orderDetailId);
			const price = orderItem ? parseFloat(orderItem.discountedUnitPrice) : 0;
			const quantity = Number(record.inputQuantity) || Number(record.quantity) || 0;
			const requestedQuantity = Number(record.quantity); // quantity代表供应商需要的换货量

			// 优先使用本地状态中的actualQuantity（用于内联编辑）
			const localItem = localExchangeItems.find(item => item.id === record.orderDetailId);
			const actualQuantity = localItem?.actualQuantity ?? Number(record.actualQuantity) ?? undefined;

			return {
				id: record.orderDetailId,
				returnExchangeId: record.orderDetailId, // 使用orderDetailId作为returnExchangeId
				productCode: record.productName, // 这里假设productName就是productCode，或者需要从其他地方获取
				productName: record.productName,
				quantity: quantity,
				requestedQuantity: requestedQuantity,
				actualQuantity: actualQuantity,
				price: price,
				totalAmount: quantity * price,
				status: record.status === 'COMPLETED' ? ExchangeItemStatus.COMPLETED :
						record.status === 'PROGRESSED' ? ExchangeItemStatus.SHIPPED : // PROGRESS表示供应商已操作过换货
						record.status === 'PENDING' ? ExchangeItemStatus.PENDING :
						ExchangeItemStatus.PENDING, // 默认状态映射
				shippedAt: record.processedAt || null,
				receivedAt: record.actualQuantity ? record.processedAt : null,
				createdAt: orderDetail?.createdAt || new Date().toISOString(),
				updatedAt: record.processedAt || new Date().toISOString(),
			};
		}) satisfies ExchangeItem[];
	}, [exchangeRecords, orderItems, orderDetail, localExchangeItems]);

	// 更新本地实际数量的函数
	const updateLocalActualQuantity = (itemId: number, actualQuantity: number) => {
		setLocalExchangeItems(prev => {
			const existingItem = prev.find(item => item.id === itemId);
			if (existingItem) {
				return prev.map(item =>
					item.id === itemId
						? { ...item, actualQuantity }
						: item
				);
			} else {
				return [...prev, { id: itemId, actualQuantity } as ExchangeItem];
			}
		});
	};

	// 检查是否所有换货商品都已完成（状态为SHIPPED或COMPLETED）
	const allExchangeItemsCompleted = useMemo(() => {
		const exchangeItemsWithStatus = exchangeItems.filter(item =>
			item.status === ExchangeItemStatus.SHIPPED || item.status === ExchangeItemStatus.COMPLETED
		);
		return exchangeItems.length > 0 && exchangeItemsWithStatus.length === exchangeItems.length;
	}, [exchangeItems]);

	// 处理交付到市场的操作
	const handleDeliverToMarket = async () => {
		try {
			const response = await fetch(`/api/orders/${orderCode}/exchange-deliver-from-provider-to-market`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					operateBy: user?.name || '',
					items: exchangeItems.map(item => ({
						id: item.id,
						productId: item.productCode,
						actualQuantity: item.actualQuantity || 0,
						requestedQuantity: item.requestedQuantity || item.quantity,
						remark: null, // 暂时设为null，后续可以扩展
					})),
				}),
			});

			if (!response.ok) {
				throw new Error(`交付到市场失败: ${response.status}`);
			}

			toast({
				title: '操作成功',
				description: '商品已交付到市场',
				variant: 'success',
			});

			// 刷新页面
			window.location.reload();
		} catch (err) {
			toast({
				title: '操作失败',
				description: err instanceof Error ? err.message : '交付到市场时发生错误',
				variant: 'destructive',
			});
		}
	};

	const {
		actionDescriptors,
		shouldShowMarketExchangeConfirmation,
	} = useMemo(() => {
		if (!orderDetail || !orderStatus) {
			return {
				actionDescriptors: [],
				shouldShowMarketExchangeConfirmation: false,
			};
		}

		const status = orderStatus;
		const descriptors: ActionDescriptor[] = [];

		// 计算shouldShowMarketExchangeConfirmation
		// MARKET用户在EXCHANGE_REQUESTED状态下不显示确认换货按钮
		const shouldShowMarketExchangeConfirmation = tenantType.toLowerCase() === TenantType.MARKET &&
			status === OrderStatus.MARKET_INSPECTING &&
			hasExchangedItems &&
			!isEditing;

		// 构建策略上下文
		const strategyContext: OrderStrategyContext = {
			orderDetail,
			orderItems,
			returnExchangeRecords,
			productStatusSummary,
			inspectionProgress,
			rawReceipts,
			inspections,
			deliveries,
			orderCode,
			isEditing,
			savingChanges,
			hasErrors,
			actualTotal,
			discountTotal,
			originalTotal,
			returnMoney,
			status,
			tenantType,
			startingExchange,
			processing,
			beginInspecting,
			deliveringToCustomer,
			shouldShowMarketExchangeConfirmation,
			handleBeginExchangeProcessing,
			handleStartProcessing,
			handleSaveActualQuantities,
			handleBeginInspect,
			navigateToMarketExchangePage,
			deliverToCustomer,
			completeAcceptance,
			showRejectConfirmation,
			requestCustomerExchange,
			requestingCustomerExchange,
			completeOrder,
		};

		// 使用策略获取租户特定的操作按钮
		const tenantActions = orderStrategy.getActionDescriptors(strategyContext);
		descriptors.push(...tenantActions);

		const exportAction: ActionDescriptor = {
			key: "export-excel",
			type: "button",
			label: exportingExcel ? "导出中..." : "导出Excel",
			variant: "outline",
			size: "sm",
			className: "h-8 px-2 text-xs flex items-center gap-1 hover:bg-gray-100",
			onClick: exportToExcel,
			loading: exportingExcel,
			disabled: exportingExcel,
			icon: !exportingExcel ? <Download className="h-3 w-3" /> : undefined,
		};

		descriptors.push(exportAction);

		return {
			actionDescriptors: descriptors,
			shouldShowMarketExchangeConfirmation,
		};
	}, [
		orderDetail,
		orderStatus,
		orderStrategy,
		orderItems,
		returnExchangeRecords,
		productStatusSummary,
		inspectionProgress,
		rawReceipts,
		isEditing,
	]);

	if (loading) {
		return (
			<div className="container mx-auto py-6">
				<div className="flex justify-center py-12">
					<p className="text-sm text-gray-500">正在加载订单详情...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto py-6">
				<div className="flex flex-col items-center py-12">
					<p className="text-sm text-red-500 mb-4">{error}</p>
					<Button variant="outline" size="sm" onClick={handleGoBack}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						返回订单列表
					</Button>
				</div>
			</div>
		);
	}

	if (!orderDetail || !orderStatus) {
		return (
			<div className="container mx-auto py-6">
				<div className="flex flex-col items-center py-12">
					<p className="text-sm text-gray-500 mb-4">未找到订单信息</p>
					<Button variant="outline" size="sm" onClick={handleGoBack}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						返回订单列表
					</Button>
				</div>
			</div>
		);
	}


	const handleExchangeReturnInputChange = (orderDetailId: number, value: string) => {
		setExchangeReturnRecords((prev) => prev.map((record) => (
			record.orderDetailId === orderDetailId
				? { ...record, inputQuantity: value }
				: record
		)));
	};

	const handleSubmitExchangeReturnRecord = async (record: ExchangeReturnRecordWithInput) => {
		setExchangeReturnRecords((prev) => prev.map((item) => (
			item.orderDetailId === record.orderDetailId ? { ...item, submitting: true, submitError: null } : item
		)));

		try {
			const response = await fetch(`/api/orders/${orderDetail?.orderCode}/inspect-sub-orders`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					operateBy: user?.name || '',
					receipt: {
						id: record.orderDetailId,
						orderId: orderDetail?.orderCode,
						productName: record.productName,
						operationType: record.operationType,
						quantity: Number(record.inputQuantity) || 0,
						reason: record.reason,
						unit: record.unit,
					},
				}),
			});

			if (!response.ok) {
				throw new Error(`提交退换货记录失败: ${response.status}`);
			}

			setExchangeReturnRecords((prev) => prev.map((item) => (
				item.orderDetailId === record.orderDetailId
					? { ...item, submitting: false, status: 'COMPLETED', actualQuantity: record.inputQuantity }
					: item
			)));

			toast({
				title: '提交成功',
				description: `${record.productName} 的退换货已更新`,
				variant: 'success',
			});
		} catch (error) {
			setExchangeReturnRecords((prev) => prev.map((item) => (
				item.orderDetailId === record.orderDetailId
					? { ...item, submitting: false, submitError: error instanceof Error ? error.message : '提交失败' }
					: item
			)));

			toast({
				title: '提交失败',
				description: error instanceof Error ? error.message : '提交退换货记录时发生错误',
				variant: 'destructive',
			});
		}
	};

	// CUSTOMER 用户：如果订单状态不是 MARKET_DELIVERING 或 EXCHANGE_NEW_DELIVERING，显示状态历史时间轴
	const shouldShowStatusHistory = tenantType?.toLowerCase() === TenantType.CUSTOMER && 
		orderDetail?.orderStatus !== OrderStatus.MARKET_DELIVERING && 
		orderDetail?.orderStatus !== OrderStatus.EXCHANGE_NEW_DELIVERING;

	return (
		<div className="container mx-auto py-6">
			<div className="space-y-6">
				<OrderInfoCard
					orderDetail={orderDetail}
					afterSaleTimestamp={afterSaleTimestamp}
					statusChangeMessage={statusChangeMessage}
					onDismissStatusMessage={() => setStatusChangeMessage(null)}
				/>

				{/* CUSTOMER 用户状态历史时间轴 */}
				{shouldShowStatusHistory && statusHistory && statusHistory.length > 0 && (
					<StatusHistoryTimeline 
						statusHistory={statusHistory} 
						currentStatus={orderDetail?.orderStatus || ""} 
					/>
				)}

				{/* 订单商品列表和退换货记录 */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>订单详情</CardTitle>
						<ActionToolbar actions={actionDescriptors} />
					</CardHeader>
					<CardContent>
						<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
							<TabsList>
								<TabsTrigger value="products">商品清单</TabsTrigger>
								<TabsTrigger value="exchange">换货清单</TabsTrigger>
								<TabsTrigger value="return">退货清单</TabsTrigger>
							</TabsList>
							<TabsContent value="products" className="mt-4">
							<ProductListSection
								orderDetail={orderDetail}
								orderItems={orderItems}
								tenantType={tenantType}
								isEditing={isEditing}
								itemErrors={itemErrors}
								shouldShowDeliverQuantityColumn={shouldShowDeliverQuantityColumn}
								shouldShowReceivedQuantityColumn={showReceivedQuantityColumn}
								shouldShowInspectMenu={shouldShowInspectMenuWithInspections}
								shouldShowStatusColumn={shouldShowStatusColumn}
								handleActualQuantityChange={handleActualQuantityChange}
								handleActualQuantityKeyDown={handleActualQuantityKeyDown}
								handleOperation={handleOperation}
								productStatusSummary={productStatusSummary}
								isUnitAllowingDecimal={isUnitAllowingDecimal}
								roundGroups={roundGroups}
								inspections={inspections}
							/>

							<Card className="mt-4">
								<CardHeader>
									<CardTitle>分类汇总</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
										{getCategorySummary.map((item, index) => (
											<div key={index} className="border rounded-md p-3">
												<p className="text-sm">{item.category}</p>
												<div className="flex justify-between mt-2">
													<span className="text-xs font-mono font-semibold">¥{item.total}</span>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value="exchange" className="mt-4">
							<ExchangeListSection
								tenantType={tenantType}
								orderStatus={orderDetail?.orderStatus as OrderStatus}
								beginInspecting={beginInspecting}
								onBeginInspect={handleBeginInspect}
								allExchangeItemsCompleted={allExchangeItemsCompleted}
								onDeliverToMarket={handleDeliverToMarket}
								exchangeItems={exchangeItems}
								loadingExchangeReturn={loadingExchangeReturn}
								handleExchangeStatusChange={handleExchangeStatusChange}
								updateLocalActualQuantity={updateLocalActualQuantity}
								handleOperation={handleOperation}
								canPerformExchangeAction={canPerformExchangeAction}
								getExchangeStatusLabel={getExchangeStatusLabel}
								getExchangeStatusVariant={getExchangeStatusVariant}
								onCompleteAcceptance={completeAcceptance}
							/>
						</TabsContent>

						<TabsContent value="return" className="mt-4">
							<ReturnListSection returnRecords={returnRecords} orderItems={orderItems} />
						</TabsContent>
					</Tabs>
					</CardContent>
				</Card>
				
			</div>

			{/* 退换货操作对话框 */}
			<ProductSignDialog
				showOperationDialog={showOperationDialog}
				setShowOperationDialog={setShowOperationDialog}
				showConfirmDialog={showConfirmDialog}
				setShowConfirmDialog={setShowConfirmDialog}
				operatingProductId={operatingProductId}
				setOperatingProductId={setOperatingProductId}
				operationType={operationType}
				setOperationType={setOperationType}
				operatingQuantity={operatingQuantity}
				setOperatingQuantity={setOperatingQuantity}
				operatingReason={operatingReason}
				setOperatingReason={setOperatingReason}
				useFullQuantity={useFullQuantity}
				setUseFullQuantity={setUseFullQuantity}
				quantityError={quantityError}
				setQuantityError={setQuantityError}
				reasonError={reasonError}
				setReasonError={setReasonError}
				handleQuantityChange={handleQuantityChange}
				handleReasonChange={handleReasonChange}
				handleUseFullQuantity={handleUseFullQuantity}
				handleSubmitOperation={handleSubmitOperation}
				handleConfirmOperation={handleConfirmOperation}
				getItemReturnExchangeRecords={getItemReturnExchangeRecords}
				orderItems={orderItems}
				orderStatus={orderDetail?.orderStatus}
				tenantType={tenantType}
				roundGroups={roundGroups}
				inspections={inspections}
			/>

			{/* 配送人员选择对话框 */}
			<Dialog open={showDeliveryStaffDialog} onOpenChange={setShowDeliveryStaffDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="text-sm">选择配送人员</DialogTitle>
						<DialogDescription className="text-xs">
							请为此订单选择一名配送人员负责配送
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<div className="space-y-2">
							<Label htmlFor="deliveryStaff">配送人员</Label>
							<Select
								onValueChange={handleDeliveryStaffChange}
								value={selectedDeliveryStaff?.idCard || ""}
							>
								<SelectTrigger id="deliveryStaff" className="w-full">
									<SelectValue placeholder="选择配送人员" className="text-xs" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>可用配送人员</SelectLabel>
										{deliveryStaffs.map((staff) => (
											<SelectItem key={staff.idCard} value={staff.idCard}>
												<div className="flex flex-col">
													<span>{staff.name}</span>
													<span className="text-xs text-gray-500">{staff.phone}</span>
												</div>
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						{selectedDeliveryStaff && (
							<div className="bg-gray-50 p-3 rounded-md text-xs">
								<p className="text-sm font-medium">{selectedDeliveryStaff.name}</p>
								<p className="text-xs text-gray-500">联系电话: {selectedDeliveryStaff.phone}</p>
								<p className="text-xs text-gray-500">身份证号: {selectedDeliveryStaff.idCard}</p>
							</div>
						)}
					</div>
					<DialogFooter className="mt-4">
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								setShowDeliveryStaffDialog(false);
								setSelectedDeliveryStaff(null);
							}}
							className="text-xs"
						>
							取消
						</Button>
						<Button
							size="sm"
							onClick={submitStartProcessing}
							disabled={!selectedDeliveryStaff || processing}
							className="text-xs"
						>
							{processing ? "处理中..." : "确认"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 拒绝售后确认对话框 */}
			<AlertDialog open={showRejectConfirmDialog} onOpenChange={setShowRejectConfirmDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
		<AlertDialogTitle className="text-sm font-semibold">{orderDetail.orderStatus === OrderStatus.RETURN_REQUESTED ? "确认拒绝供应商售后服务?" : "确认完成订单?"}</AlertDialogTitle>
						<AlertDialogDescription className="text-xs">
			{orderDetail.orderStatus === OrderStatus.RETURN_REQUESTED ? "拒绝供应商售后服务，市场将在2小时内处理客户的售后申请。" : ""}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="text-xs">取消</AlertDialogCancel>
						<AlertDialogAction onClick={handleRejectOrComplete} className="bg-red-600 hover:bg-red-500 text-xs">
							确认
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
	</div>

	);
}