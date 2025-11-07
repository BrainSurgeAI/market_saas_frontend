"use client";

import { Fragment, useMemo, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, User, Save, ChevronDownIcon, Download, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

// 导入类型定义（type-only import）
import type {
  OrderDetail,
  OrderItem,
  ReturnExchangeItem,
  ApiResponse,
  DeliveryPerson,
  ExchangeReturnRecord,
  ExchangeReturnRecordWithInput,
  ExchangeItem,
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
	shouldShowInspectMenu,
	shouldDisplayActualQuantity,
	canShowStartProcessing,
	canShowBeginInspect,
	canShowCompleteAcceptance,
	canShowCompleteOrder,
	canShowCustomerBeginInspect,
	shouldShowCountdown,
  canShowDeliverToCustomer,
} from "@/lib/utils/orderStatusUtils";

// 导入 Hooks
import { useOrderDetails } from "@/app/workspace/hooks/useOrderDetails";
import { useOrderCalculations } from "@/app/workspace/hooks/useOrderCalculations";
import { useOrderOperations } from "@/app/workspace/hooks/useOrderOperations";
import { useOrderEditing } from "@/app/workspace/hooks/useOrderEditing";
import { useOrderActions } from "@/app/workspace/hooks/useOrderActions";

import { cn, getStatusVariant, translateOrderStatus } from "@/lib/utils";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExchangeItemsTable } from "./ExchangeItemsTable";


interface OrderDetailProps {
	orderCode: string;
	orgId: string;
	tenantType: string;
}

type ItemQuantityPayload = {
	id: number;
	actualQuantity: string;
};

interface ProviderDeliverRequest {
	stockedBy: string;
	items: ItemQuantityPayload[];
}

type MarketInspectRequest = ItemQuantityPayload[];

type ActionDialogConfig = {
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmClassName?: string;
	body?: ReactNode;
};

type BaseActionDescriptor = {
	key: string;
	label: string;
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	disabled?: boolean;
	loading?: boolean;
	icon?: ReactNode;
	className?: string;
};

type DialogActionDescriptor = BaseActionDescriptor & {
	type: "dialog";
	onConfirm: () => void;
	dialog: ActionDialogConfig;
};

type ButtonActionDescriptor = BaseActionDescriptor & {
	type: "button";
	onClick: () => void;
};

type ActionDescriptor = DialogActionDescriptor | ButtonActionDescriptor;

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
		loading,
		error,
		isEditing,
		setIsEditing,
	} = orderDetailsData;

	const calculations = useOrderCalculations(orderItems, returnExchangeRecords, isEditing);

	const [exchangeReturnRecords, setExchangeReturnRecords] = useState<ExchangeReturnRecordWithInput[]>([]);
	const [loadingExchangeReturn, setLoadingExchangeReturn] = useState(false);
	const [exchangeReturnError, setExchangeReturnError] = useState<string | null>(null);
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

	const operations = useOrderOperations(
		orderCode,
		orderItems,
		setOrderItems,
		returnExchangeRecords,
		setReturnExchangeRecords,
		user
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
		getItemReturnExchangeRecords,
		isProductSigned,
		getProductSignRecord,
		hasProductOperation,
		getProductActualStatus,
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
		handleConfirmOperationFromHook(orderDetail as OrderDetail);
	};

	// 处理显示拒绝确认对话框
	const showRejectConfirmation = () => {
		setShowRejectConfirmDialog(true);
	};

	// 处理显示倒计时
	const shouldShowCountdownDisplay = useMemo(() => {
		if (!orderDetail) {
			return false;
		}
		return shouldShowCountdown(orderDetail.orderStatus as OrderStatus);
	}, [orderDetail]);

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

	const shouldShowActualQuantityColumn = useMemo(() => {
		if (!orderDetail) {
			return false;
		}

		if (tenantType.toLowerCase() === TenantType.PROVIDER) {
			return true;
		}
		return ![
			OrderStatus.PENDING,
			OrderStatus.ASSIGNED,
			OrderStatus.SUPPLIER_PREPARING,
		].includes(orderDetail.orderStatus as OrderStatus);
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

	useEffect(() => {
		if (!orderDetail) {
			return;
		}

		const fetchExchangeReturnRecords = async () => {
			try {
				setLoadingExchangeReturn(true);
				setExchangeReturnError(null);

				const response = await fetch(`/api/orders/${orderDetail.orderCode}/exchange-and-return-order-details`);
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
		};

		fetchExchangeReturnRecords();
	}, [orderDetail]);

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

			const providerParam = params?.provider_id;
			const providerId = Array.isArray(providerParam) ? providerParam[0] : providerParam ?? '';
			router.push(`/workspace/providers/${providerId}/orders/${orderCode}/exchange`);
		} catch (error) {
			toast({
				title: '操作失败',
				description: error instanceof Error ? error.message : '开始换货时出错',
				variant: 'destructive',
			});
		} finally {
			setStartingExchange(false);
		}
	}, [orderCode, params, router, toast, user?.name]);

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
				const itemTotal = parseFloat(item.actualPrice) * parseFloat(item.actualQuantity);

				// 获取当前商品的操作记录
				const itemOperations = getItemReturnExchangeRecords(item.id);
				const operationsText = itemOperations.map(record => {
					if (record.operationType === 'SIGN') {
						return `已签收: ${record.quantity} ${record.unit}${record.reason ? ' - ' + record.reason : ''}`;
					} else {
						return `${record.operationType === 'RETURN' ? '退货' : '换货'}: ${record.quantity} ${record.unit} - ${record.reason}`;
					}
				}).join('; ');

				worksheet.addRow({
					name: item.name,
					category: item.category,
					quantity: parseFloat(item.quantity).toFixed(2),
					actualQuantity: parseFloat(item.actualQuantity).toFixed(2),
					unit: item.unit,
					price: parseFloat(item.price).toFixed(2),
					discountRate: `${(parseFloat(item.discountRate) * 100).toFixed(0)}%`,
					actualPrice: parseFloat(item.actualPrice).toFixed(2),
					total: isNaN(itemTotal) ? '0.00' : itemTotal.toFixed(2),
					operations: operationsText,
					processingRequirements: item.processingRequirements || '',
					remark: item.remark || ''
				});

				// 如果有退货/换货记录，添加详细行
				const returnExchangeRecords = itemOperations.filter(r => r.operationType !== 'SIGN');
				for (const record of returnExchangeRecords) {
					// 计算退货/换货金额
					const recordAmount = parseFloat(item.actualPrice) * record.quantity;

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
				(isEditing ? parseFloat(actualTotal) : parseFloat(orderDetail.actualAmount)) :
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
	const [showOrderInfo, setShowOrderInfo] = useState(false);
	const [showBeginInspectDialog, setShowBeginInspectDialog] = useState(false);
	const [exportingExcel, setExportingExcel] = useState(false);
	const [startingExchange, setStartingExchange] = useState(false);

	// ReturnCountdown 组件
	const ReturnCountdown = ({ afterSaleAt, orderStatus, forceUpdate }: {
		afterSaleAt: string | null,
		orderStatus: string,
		forceUpdate?: number
	}) => {
		const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
		const { toast } = useToast();
		const [isTimerEnded, setIsTimerEnded] = useState(false);

		// 根据订单状态确定使用哪个时间作为起点
		const startTimeStr = useMemo(() => {
			if (orderStatus === OrderStatus.RETURN_REQUESTED && afterSaleAt) {
				return afterSaleAt;
			}
			return null;
		}, [orderStatus, afterSaleAt]);

		// 重置计时器的逻辑
		useEffect(() => {
			setIsTimerEnded(false);
		}, [forceUpdate, startTimeStr]);

		// 计算倒计时
		useEffect(() => {
			if (!startTimeStr) return;

			const startTimeMs = new Date(startTimeStr).getTime();
			const timeLimit = 120 * 60 * 1000; // 120分钟
			const endTime = startTimeMs + timeLimit;

			const calculateTimeLeft = () => {
				const now = new Date().getTime();
				const difference = endTime - now;

				if (difference <= 0) {
					setTimeLeft("00:00:00");

					if (!isTimerEnded) {
						setIsTimerEnded(true);
						toast({
							title: "售后时间已结束",
							description: "正在刷新页面获取最新状态...",
							variant: "default",
							duration: 3000,
						});

						setTimeout(() => {
							window.location.reload();
						}, 2000);
					}
					return;
				}

				const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
				const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
				const seconds = Math.floor((difference % (1000 * 60)) / 1000);

				setTimeLeft(
					`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
				);
			};

			calculateTimeLeft();
			const timer = setInterval(calculateTimeLeft, 1000);

			return () => clearInterval(timer);
		}, [startTimeStr, isTimerEnded, toast]);

		return (
			<div className="absolute inset-0 flex items-center justify-center z-20">
				<div className="bg-black text-white px-6 py-3 rounded-lg shadow-lg text-center">
					<p className="text-xs mb-1">离售后结束还有</p>
					<p className="text-2xl font-mono">{timeLeft}</p>
				</div>
			</div>
		);
	};

	// 处理保存实际数量
	const handleSaveActualQuantities = async () => {
		if (hasErrors() || savingChanges) return;

		const tenantRaw = tenantType.toLowerCase();
		const tenantEnum = tenantRaw as TenantType;
		const buildPayload = (items: OrderItem[]): ItemQuantityPayload[] =>
			items.map(item => ({
				id: item.id,
				actualQuantity: item.actualQuantity,
			}));

		try {
			setSavingChanges(true);

			let response: Response;

			switch (tenantEnum) {
				case TenantType.PROVIDER: {
					const apiUrl = `/api/orders/${orderCode}/deliver-to-market`;
					const payload: ProviderDeliverRequest = {
						stockedBy: user?.name ?? '',
						items: buildPayload(orderItems),
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
					const apiUrl = orderItems.some((item: OrderItem) => item.status === 'EXCHANGED') ? `/api/orders/${orderCode}/exchange-request` : `/api/orders/${orderCode}/accept`;

					console.log("apiUrl:-----------", apiUrl);
					const targetItems = orderDetail?.orderStatus === OrderStatus.EXCHANGE_INSPECTING
						? orderItems.filter((item: OrderItem) => item.status === 'EXCHANGED')
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

			const updatedItems = orderItems.map((item) => {
				const actualAmountVal = (parseFloat(item.actualPrice) * parseFloat(item.actualQuantity)).toFixed(2);
				return {
					...item,
					actualAmount: actualAmountVal,
				};
			});

			setOrderItems(updatedItems);

			if (orderDetail) {
				let newStatus = OrderStatus.SUPPLIER_DELIVERING;
				if (orderDetail.orderStatus === OrderStatus.EXCHANGE_IN_PROGRESS) {
					newStatus = OrderStatus.EXCHANGE_DELIVERING;
				} else if (orderDetail.orderStatus === OrderStatus.EXCHANGE_INSPECTING && tenantRaw === TenantType.MARKET) {
					newStatus = OrderStatus.EXCHANGE_COMPLETED;
				} else if (orderDetail.orderStatus === OrderStatus.MARKET_INSPECTING && tenantRaw === TenantType.MARKET) {
					newStatus = OrderStatus.MARKET_ACCEPTED;
				} else if (orderDetail.orderStatus === OrderStatus.CUSTOMER_INSPECTING && tenantRaw === TenantType.CUSTOMER) {
					newStatus = OrderStatus.COMPLETED;
				}

				setOrderDetail({
					...orderDetail,
					orderStatus: newStatus,
					actualAmount: actualTotal,
					totalAmount: originalTotal,
					discountAmount: discountTotal,
				});
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
	const hasExchangedItems = orderItems.some((item) => item.status?.toUpperCase() === "EXCHANGED");
	const shouldShowMarketExchangeConfirmation =
		tenantEnum === TenantType.MARKET &&
		orderStatus === OrderStatus.EXCHANGE_REQUESTED &&
		hasExchangedItems;

const productStatusSummary = useMemo(() => {
	const totalItems = orderItems.length;

		const receiptMap = returnExchangeRecords.reduce<Record<number, OperationType | undefined>>((acc, record) => {
		acc[record.id] = record.operationType;
		return acc;
	}, {});

	const normalizedStatuses = orderItems.map((item) => {
		const receiptStatus = receiptMap[item.id];
		if (receiptStatus === OperationType.EXCHANGE) {
			return 'EXCHANGE';
		}
		if (receiptStatus === OperationType.RETURN) {
			return 'RETURN';
		}
		if (receiptStatus === OperationType.SIGN) {
			return 'SIGN';
		}
		return item.status?.toUpperCase() ?? 'PENDING';
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
	}, [orderItems, returnExchangeRecords]);

	const exchangeRecords = useMemo(
		() => exchangeReturnRecords.filter((record) => record.operationType === OperationType.EXCHANGE),
		[exchangeReturnRecords]
	);

	// 转换退换货记录为ExchangeItem格式，用于ExchangeItemsTable
	const [localExchangeItems, setLocalExchangeItems] = useState<ExchangeItem[]>([]);

	const exchangeItems = useMemo(() => {
		return exchangeRecords.map((record) => {
			// 从orderItems中获取价格信息
			const orderItem = orderItems.find(item => item.id === record.orderDetailId);
			const price = orderItem ? parseFloat(orderItem.actualPrice) : 0;
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
						record.status === 'PROGRESS' ? ExchangeItemStatus.SHIPPED : // PROGRESS表示供应商已操作过换货
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

	// 处理确定换货操作
	const handleConfirmExchange = async () => {
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

			const result = await response.json();

			toast({
				title: '操作成功',
				description: '已开始换货流程，现在可以编辑实际换货数量',
				variant: 'success',
			});

			// 更新订单状态
			if (orderDetail) {
				setOrderDetail({
					...orderDetail,
					orderStatus: 'EXCHANGE_IN_PROGRESS',
				});
			}
		} catch (error) {
			toast({
				title: '操作失败',
				description: error instanceof Error ? error.message : '开始换货时出错',
				variant: 'destructive',
			});
		} finally {
			setStartingExchange(false);
		}
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

	const actionDescriptors = useMemo<ActionDescriptor[]>(() => {
		if (!orderDetail || !orderStatus) {
			return [];
		}

		const status = orderStatus;
		const descriptors: ActionDescriptor[] = [];
		const hasBlockingErrors = hasErrors();

		if (tenantEnum === TenantType.PROVIDER) {
			if (status === OrderStatus.EXCHANGE_REQUESTED) {
				descriptors.push({
					key: "provider-exchange-progress",
					type: "button",
					label: startingExchange ? "处理中..." : "确认换货",
					variant: "outline",
					size: "sm",
					className: "h-8 px-3 text-xs",
					onClick: handleBeginExchangeProcessing,
					loading: startingExchange,
					disabled: startingExchange,
				});
			}

			if (canShowStartProcessing(status, tenantType) && status !== OrderStatus.EXCHANGE_REQUESTED) {
				const isAssigned = status === OrderStatus.ASSIGNED;
				descriptors.push({
					key: "provider-start-processing",
					type: "dialog",
					label: isAssigned ? "开始备货" : "开始换货",
					size: "sm",
					className: "bg-blue-600 hover:bg-blue-500 text-white",
					dialog: {
						title: isAssigned ? "确认开始备货?" : "确认开始换货?",
						description: "确认后，订单状态更新为\"备货中\"，表示您已开始准备该订单的商品。您可以编辑实际发货数量。",
					},
					onConfirm: handleStartProcessing,
					loading: processing,
					disabled: processing,
				});
			}

			if (isEditing && shouldEnterEditMode(status, tenantType)) {
				const providerTitle = status === OrderStatus.EXCHANGE_IN_PROGRESS ? "确认完成换货备货?" : "确认完成备货?";
				descriptors.push({
					key: "provider-finalize-quantities",
					type: "dialog",
					label: savingChanges ? "保存中..." : "完成备货",
					size: "sm",
					className: "bg-green-600 hover:bg-green-500 text-white flex items-center gap-1",
					dialog: {
						title: providerTitle,
						description: "提交后，系统将更新商品的实际出货量，总金额也会相应调整。",
						body: createSettlementSummary({
							actualTotal,
							discountTotal,
							originalTotal,
							returnMoney,
						}),
					},
					onConfirm: handleSaveActualQuantities,
					disabled: hasBlockingErrors || savingChanges,
					loading: savingChanges,
					icon: <Save className="h-4 w-4" />,
				});
			}
		}

		if (tenantEnum === TenantType.MARKET) {
			if (canShowBeginInspect(status, tenantType)) {
				descriptors.push({
					key: "market-begin-inspect",
					type: "dialog",
					label: beginInspecting ? "处理中..." : "开始验收",
					size: "sm",
					className: "bg-blue-600 hover:bg-blue-500 text-white",
					dialog: {
						title: "确认开始验收?",
						description: "确认后，订单状态更新为\"验收中\"，表示您已开始验收该订单的商品。",
					},
					onConfirm: handleBeginInspect,
					disabled: beginInspecting,
					loading: beginInspecting,
				});
			}

			if (shouldShowMarketExchangeConfirmation) {
				descriptors.push({
					key: "market-confirm-exchange",
					type: "dialog",
					label: "确认换货",
					size: "sm",
					className: "bg-purple-600 hover:bg-purple-500 text-white",
					dialog: {
						title: "确认进入换货流程?",
						description: "确认后将跳转至换货处理页面，请核对需要换货的商品信息并提交换货申请。",
					},
					onConfirm: navigateToMarketExchangePage,
				});
			} else if (canShowDeliverToCustomer(status, tenantType)) {
				descriptors.push({
					key: "market-deliver-to-customer",
					type: "dialog",
					label: deliveringToCustomer ? "处理中..." : "确认发货",
					size: "sm",
					className: "bg-purple-600 hover:bg-purple-500 text-white",
					dialog: {
						title: "确认开始发货?",
						description: "确认后，订单状态将更新为\"配送中\"，表示市场正在将商品配送给客户。",
					},
					onConfirm: deliverToCustomer,
					disabled: deliveringToCustomer,
					loading: deliveringToCustomer,
				});
			}

			if (status === OrderStatus.EXCHANGE_INSPECTING) {
				descriptors.push({
					key: "market-exchange-inspect",
					type: "button",
					label: "验收换货",
					variant: "outline",
					size: "sm",
					className: "h-8 px-3 text-xs",
					onClick: navigateToMarketExchangePage,
				});
			}

		const completionAction = buildCompletionAction({
				tenant: tenantEnum,
				status,
				returnExchangeRecords,
				orderItems,
				completeAcceptance,
			showRejectConfirmation,
				productStatusSummary,
				requestCustomerExchange,
				requestingCustomerExchange,
			});
			if (completionAction) {
				descriptors.push(completionAction);
			}
		}

		if (tenantEnum === TenantType.CUSTOMER) {
			if (canShowCustomerBeginInspect(status, tenantType)) {
				descriptors.push({
					key: "customer-begin-inspect",
					type: "dialog",
					label: beginInspecting ? "处理中..." : "开始验收",
					size: "sm",
					className: "bg-blue-600 hover:bg-blue-500 text-white",
					dialog: {
						title: "确认开始验收?",
						description: "确认后，订单状态更新为\"客户验收中\"，表示您已开始验收该订单的商品。",
					},
					onConfirm: handleBeginInspect,
					disabled: beginInspecting,
					loading: beginInspecting,
				});
			}

		const completionAction = buildCompletionAction({
				tenant: tenantEnum,
				status,
				returnExchangeRecords,
				orderItems,
				completeAcceptance,
			showRejectConfirmation,
				productStatusSummary,
				requestCustomerExchange,
				requestingCustomerExchange,
			});
			if (completionAction) {
				descriptors.push(completionAction);
			}

			if (canShowCompleteOrder(status, tenantType)) {
				descriptors.push({
					key: "customer-complete-order",
					type: "dialog",
					label: "完成订单",
					variant: "outline",
					size: "sm",
					className: "h-8 px-2 text-xs flex items-center gap-1 hover:bg-green-600 bg-green-700 text-white hover:text-white",
					dialog: {
						title: "确认完成订单?",
						description: "确认后，订单状态将更新为\"已完成\"，此操作不可撤销。",
					},
					onConfirm: completeOrder,
				});
			}
		}

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
	return descriptors;
	}, [
		orderDetail,
		orderStatus,
		tenantEnum,
		tenantType,
		isEditing,
		savingChanges,
		hasErrors,
		actualTotal,
		discountTotal,
		originalTotal,
		returnMoney,
		processing,
		beginInspecting,
		deliveringToCustomer,
		returnExchangeRecords,
		orderItems,
		completeAcceptance,
		handleRejectOrComplete,
		showRejectConfirmation,
		canShowCustomerBeginInspect,
		canShowCompleteOrder,
		canShowStartProcessing,
		canShowBeginInspect,
		canShowDeliverToCustomer,
		shouldEnterEditMode,
		shouldShowMarketExchangeConfirmation,
		handleStartProcessing,
		handleSaveActualQuantities,
		handleBeginInspect,
		deliverToCustomer,
		exportToExcel,
		handleBeginExchangeProcessing,
		startingExchange,
		completeOrder,
		navigateToMarketExchangePage,
		productStatusSummary,
		requestCustomerExchange,
		requestingCustomerExchange
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

	return (
		<div className="container mx-auto py-6">
			{/* 状态变更提示 */}
			{statusChangeMessage && (
				<div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded shadow-sm relative">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
								<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
							</svg>
						</div>
						<div className="ml-3">
							<p className="text-sm font-medium text-blue-800">{statusChangeMessage.title}</p>
							<p className="text-sm text-blue-700 mt-1">{statusChangeMessage.description}</p>
						</div>
					</div>
					{/* 添加关闭按钮 */}
					<button
						onClick={() => setStatusChangeMessage(null)}
						className="absolute top-2 right-2 text-blue-500 hover:text-blue-700"
						aria-label="关闭提示"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			)}

			<div className="space-y-6">
				<div className="grid grid-cols-1 gap-6">
					<Card>
						<CardHeader className="flex flex-row items-center">
							<CardTitle>
								<div className="flex items-center">
									订单信息
									<Button
										variant="ghost"
										size="icon"
										className="ml-2 h-5 w-5"
										onClick={() => {
											const newState = !showOrderInfo;
											setShowOrderInfo(newState);
										}}
									>
										{showOrderInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
									</Button>
									<div className="flex items-center justify-end">
										<Badge variant={getStatusVariant(orderDetail.orderStatus)} className="text-xs  rounded-full">
											{translateOrderStatus(orderDetail.orderStatus)}
										</Badge>
									</div>
								</div>
							</CardTitle>
						</CardHeader>
					{shouldShowCountdownDisplay && !showOrderInfo && (
							<div className="relative">
							<ReturnCountdown
									afterSaleAt={orderDetail.afterSaleAt}
									orderStatus={orderDetail.orderStatus}
									forceUpdate={afterSaleTimestamp}
								/>
							</div>
						)}
						{showOrderInfo && (
							<CardContent className="space-y-4">
								<div className="grid grid-cols-4 gap-4">
									<div>
										<p className="text-sm text-gray-500">下单时间</p>
										<p className="text-xs font-medium">
											{orderDetail.createdAt ? format(new Date(orderDetail.createdAt), "yyyy年MM月dd日 HH:mm") : "-"}
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-500">下单客户</p>
										<p className="text-xs">{orderDetail.customerName || "-"}</p>
									</div>
									<div className="flex items-start">
										<Calendar className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
										<div>
											<p className="text-sm text-gray-500">配送日期</p>
											<p className="text-xs font-medium">
												{format(new Date(orderDetail.deliveryDate), "yyyy年MM月dd日")}
											</p>
										</div>
									</div>
									<div className="flex items-start">
										<User className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
										<div>
											<p className="text-sm text-gray-500">收货人</p>
											<p className="text-xs font-medium">{orderDetail.contactName}</p>
											<p className="text-sm font-mono mt-1">{orderDetail.contactPhone}</p>
										</div>
									</div>
								</div>



								<div className="flex items-start">
									<MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
									<div>
										<p className="text-sm text-gray-500">配送地址</p>
										<p className="text-xs font-medium">{orderDetail.deliveryAddress}</p>
									</div>
								</div>

								<Separator />

								<div className="space-y-2">
									<p className="text-sm text-gray-500">订单金额</p>
									<div className="grid grid-cols-3 gap-4">
										<div>
											<p className="text-sm text-gray-500">原价（以下单日产品中间价计算）</p>
											<p className="text-sm font-mono">¥{parseFloat(orderDetail.totalAmount).toFixed(2)}</p>
										</div>
										<div>
											<p className="text-sm text-gray-500">折扣</p>
											<p className="text-sm text-red-500 font-mono">¥{parseFloat(orderDetail.discountAmount || "0").toFixed(2)}</p>
										</div>
										<div>
											<p className="text-sm text-gray-500">实付金额</p>
											<p className="text-sm font-mono text-primary">¥{(parseFloat(orderDetail.actualAmount) - parseFloat(returnMoney)).toFixed(2)}</p>
										</div>
									</div>
								</div>

								<Separator />

								<div className="grid grid-cols-2 gap-4">
									<div className="flex items-start">
										<User className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
										<div>
											<p className="text-sm text-gray-500">配送公司</p>
											<p className="text-sm mt-1">{orderDetail.providerName || "-"}</p>
										</div>
									</div>
									<div className="flex items-start">
										<User className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
										<div>
											<p className="text-sm text-gray-500">配送人</p>
											<p className="text-xs font-medium">{orderDetail.deliveryStaffName || "-"}</p>
											<p className="text-sm font-mono mt-1">{orderDetail.deliveryStaffPhone || "-"}</p>
										</div>
									</div>
								</div>

								{orderDetail.remark && (
									<>
										<Separator />
										<div>
											<p className="text-sm text-gray-500">订单备注</p>
											<p className="text-sm mt-1 p-2 bg-gray-50 rounded-md">{orderDetail.remark}</p>
										</div>
									</>
								)}
							</CardContent>
						)}
					</Card>
				</div>

				{/* 订单商品列表 */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>商品清单</CardTitle>
							<CardDescription className="text-xs text-gray-500 mt-1">
								共 {orderItems.length} 类商品，下表中单价为下单日产品中间价
							</CardDescription>
						</div>
				<ActionToolbar actions={actionDescriptors} />
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto" style={{ position: "relative" }}>
					<div className="relative" style={{ maxHeight: "600px", overflowY: "auto", zIndex: 40 }}>
						<Table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
							<colgroup>
								<col style={{ width: "250px" }} />
								<col />
								<col />
								{shouldShowActualQuantityColumn && <col />}
								<col />
								<col />
								<col />
								<col />
								<col />
								{shouldShowInspectMenu(orderDetail.orderStatus as OrderStatus, tenantType) && <col />}
							</colgroup>
							<TableHeader style={{ position: "sticky", top: 0, zIndex: 1000, backgroundColor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
								<TableRow className="text-xs font-semibold bg-black text-white">
									<TableHead className="text-left p-3 border-b">商品名称</TableHead>
									<TableHead className="text-left p-3 border-b">类别</TableHead>
									<TableHead className="text-center p-3 border-b">下单数量</TableHead>
									{shouldShowActualQuantityColumn && (
										<TableHead className="text-center p-3 border-b">实际数量</TableHead>
									)}
									<TableHead className="text-center p-3 border-b">单位</TableHead>
									<TableHead className="text-right p-3 border-b">单价</TableHead>
									<TableHead className="text-right p-3 border-b">折扣</TableHead>
									<TableHead className="text-right p-3 border-b">实际单价</TableHead>
									<TableHead className="text-right p-3 border-b">小计（折后）</TableHead>
									{shouldShowInspectMenu(orderDetail.orderStatus as OrderStatus, tenantType) && (
										<TableHead className="text-right p-3 border-b">操作</TableHead>
									)}
							</TableRow>
							</TableHeader>
							<TableBody>
								{orderItems.map((item) => {
									const itemReturnExchanges = getItemReturnExchangeRecords(item.id);
									const actualStatus = productStatusSummary.itemStatusMap[item.id] || 'PENDING';
									const canEdit = !['SIGN', 'RETURN', 'EXCHANGE'].includes(actualStatus);

									return (
										<Fragment key={item.id}>
											<TableRow className={`text-xs text-gray-700 ${actualStatus === 'RETURN' ? 'bg-red-50' : actualStatus === 'EXCHANGE' ? 'bg-yellow-50' : actualStatus === 'SIGN' ? 'bg-green-50' : ''}`}>
												<TableCell className="p-2 border-b">
													{item.name}
													{(item.processingRequirements || item.remark) && (
														<div className="mt-1 text-xs text-gray-500">
															{item.processingRequirements && (
																<div className="mb-1">{item.processingRequirements}</div>
															)}
															{item.remark && <div>备注: {item.remark}</div>}
														</div>
													)}
													{actualStatus === 'SIGN' && (
														<div className="mt-1">
															<Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[10px]">
																已签收
															</Badge>
														</div>
													)}
													{actualStatus === 'RETURN' && (
														<div className="mt-1">
															<Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px]">
																已退货
															</Badge>
														</div>
													)}
													{actualStatus === 'EXCHANGE' && (
														<div className="mt-1">
															<Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-[10px]">
																已换货
															</Badge>
														</div>
													)}
												</TableCell>
												<TableCell className="p-2 border-b">{item.category}</TableCell>
												<TableCell className="p-2 text-center border-b font-mono font-semibold">
													{parseFloat(item.quantity).toFixed(2)}
												</TableCell>
												{shouldShowActualQuantityColumn && (
													<TableCell className="p-2 text-center border-b w-[120px]">
														{isEditing ? (
															<div>
																<Input
																	type="number"
																	value={item.actualQuantity || ''}
																	onChange={(event) => handleActualQuantityChange && handleActualQuantityChange(item.id, event.target.value)}
																	className={`max-w-[100px] text-center font-mono font-semibold ${itemErrors[item.id] ? 'border-red-500' : ''}`}
																	step={isUnitAllowingDecimal(item.unit) ? "0.01" : "1"}
																	min="0"
																	max="999999.99"
																	onKeyDown={(event) => handleActualQuantityKeyDown(event, item.id)}
																	disabled={!canEdit}
																/>
																{itemErrors[item.id] && (
																	<p className="text-xs text-red-500 mt-1">{itemErrors[item.id]}</p>
																)}
															</div>
														) : (
															<span className="font-mono font-semibold">{parseFloat(item.actualQuantity).toFixed(2)}</span>
														)}
													</TableCell>
												)}
												<TableCell className="p-2 text-center border-b font-mono">{item.unit}</TableCell>
												<TableCell className="p-2 text-right border-b font-mono font-semibold">¥{parseFloat(item.price).toFixed(2)}</TableCell>
												<TableCell className="p-2 text-right border-b font-mono font-semibold">
													{(parseFloat(item.discountRate) * 100).toFixed(0)}%
												</TableCell>
												<TableCell className="p-2 text-right border-b font-mono font-semibold">¥{parseFloat(item.actualPrice).toFixed(2)}</TableCell>
												<TableCell className="p-2 text-right border-b font-mono font-semibold">
													¥{isEditing
														? (parseFloat(item.actualPrice) * parseFloat(item.actualQuantity)).toFixed(2)
														: (item.actualAmount && parseFloat(item.actualAmount) > 0
															? parseFloat(item.actualAmount).toFixed(2)
															: (parseFloat(item.actualPrice) * parseFloat(item.actualQuantity)).toFixed(2))}
												</TableCell>
												{shouldShowInspectMenu(orderDetail.orderStatus as OrderStatus, tenantType) && (
													<TableCell className="p-2 text-right border-b">
														{actualStatus === 'SIGN' || actualStatus === 'RETURN' || actualStatus === 'EXCHANGE' ? (
															<Badge variant="outline" className={`rounded-full ${
																actualStatus === 'SIGN' ? "bg-green-50 text-green-600 border-green-200" :
																actualStatus === 'RETURN' ? "bg-red-50 text-red-600 border-red-200" :
																"bg-orange-50 text-orange-600 border-orange-200"
															}`}>
																{actualStatus === 'SIGN' ? "已签收" : actualStatus === 'RETURN' ? "已退货" : "已换货"}
															</Badge>
														) : actualStatus === 'PENDING' && canEdit ? (
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button variant="outline" size="sm">
																		...
																		<ChevronDownIcon className="ml-1 h-4 w-4" />
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end">
																	<DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.SIGN)} className="cursor-pointer text-xs">
																		签收
																	</DropdownMenuItem>
																	<DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.RETURN)} className="cursor-pointer text-xs">
																		退货
																	</DropdownMenuItem>
																	<DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.EXCHANGE)} className="cursor:pointer text-xs">
																		换货
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														) : (
															<Badge variant="outline" className="rounded-full bg-gray-50 text-gray-500 border-gray-200">
																不可操作
															</Badge>
														)}
													</TableCell>
												)}
											</TableRow>

											{itemReturnExchanges.length > 0 && itemReturnExchanges.map((record) => {
												if (record.operationType === OperationType.SIGN) {
													return null;
												}

												return (
													<TableRow key={`${item.id}-${record.operationType}-${record.quantity}`} className="bg-red-50">
														<TableCell colSpan={2} className="py-1 text-center border-b">
															<span className="text-xs font-medium text-red-600">
																{record.operationType === OperationType.RETURN ? '退货' : '换货'}: {record.reason}
															</span>
														</TableCell>
														<TableCell className="text-center py-1 border-b" colSpan={shouldShowActualQuantityColumn ? 2 : 1}>
															<span className="text-xs font-mono font-medium text-red-600">
																-{record.quantity}
															</span>
														</TableCell>
														<TableCell className="text-center py-1 border-b">
															<span className="text-xs font-mono text-red-600">{record.unit}</span>
														</TableCell>
														<TableCell className="text-right py-1 border-b" colSpan={4}>
															<span className="text-xs font-mono font-medium text-red-600">
																{record.operationType === OperationType.RETURN
																	? `-¥${(parseFloat(item.actualPrice) * record.quantity).toFixed(2)}`
																	: ''}
															</span>
														</TableCell>
														{shouldShowInspectMenu(orderDetail.orderStatus as OrderStatus, tenantType) && (
															<TableCell className="py-1 border-b" />
														)}
													</TableRow>
												);
											})}
										</Fragment>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</div>
			</CardContent>
		</Card>

				{/* 订单分类统计 */}
				<Card>
					<CardHeader>
						<CardTitle>分类汇总</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
							{getCategorySummary().map((item, index) => (
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

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>退换货记录</CardTitle>
							<div className="flex gap-2">
								{allExchangeItemsCompleted && tenantType.toLowerCase() === TenantType.PROVIDER && (
									<Button
										onClick={handleDeliverToMarket}
										className="bg-green-600 hover:bg-green-500 text-white"
										size="sm"
									>
										确定交付到市场
									</Button>
								)}
								{tenantType.toLowerCase() === TenantType.PROVIDER &&
								 orderDetail?.orderStatus === 'EXCHANGE_REQUESTED' &&
								 exchangeItems.length > 0 && (
									<Button
										onClick={handleConfirmExchange}
										className="bg-blue-600 hover:bg-blue-500 text-white"
										size="sm"
										disabled={startingExchange}
									>
										{startingExchange ? "处理中..." : "确定换货"}
									</Button>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{allExchangeItemsCompleted && tenantType.toLowerCase() === TenantType.PROVIDER && (
							<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
								<p className="text-sm text-green-800">
									所有换货商品都已完成，可以点击上方按钮确认交付到市场。
								</p>
							</div>
						)}
						<ExchangeItemsTable
							items={exchangeItems}
							loading={loadingExchangeReturn}
							tenantType={tenantType}
							orderStatus={orderDetail?.orderStatus}
							onStatusChange={handleExchangeStatusChange}
							onUpdateActualQuantity={updateLocalActualQuantity}
							canPerformAction={canPerformExchangeAction}
							getStatusLabel={getExchangeStatusLabel}
							getStatusVariant={getExchangeStatusVariant}
						/>
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

function ActionToolbar({ actions }: { actions: ActionDescriptor[] }) {
	if (!actions.length) {
		return null;
	}

	return (
		<div className="flex flex-wrap items-center justify-end gap-2">
			{actions.map((action) =>
				action.type === "dialog" ? (
					<ActionDialogButton key={action.key} action={action} />
				) : (
					<RegularActionButton key={action.key} action={action} />
				)
			)}
		</div>
	);
}

function ActionDialogButton({ action }: { action: DialogActionDescriptor }) {
	const triggerDisabled = Boolean(action.disabled || action.loading);
	const triggerClasses = cn("h-8 px-3 text-xs", action.className);
	const confirmClasses = cn(
		action.dialog.confirmClassName ?? action.className,
		!(action.dialog.confirmClassName || action.className) && "bg-primary text-white hover:bg-primary/90"
	);
	const confirmLabel = action.dialog.confirmLabel ?? "确认";
	const cancelLabel = action.dialog.cancelLabel ?? "取消";

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					variant={action.variant}
					size={action.size ?? "sm"}
					className={triggerClasses}
					disabled={triggerDisabled}
				>
					<ButtonContent action={action} />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="text-sm font-semibold">{action.dialog.title}</AlertDialogTitle>
					{action.dialog.description && (
						<AlertDialogDescription className="text-xs">
							{action.dialog.description}
						</AlertDialogDescription>
					)}
				</AlertDialogHeader>
				{action.dialog.body}
				<AlertDialogFooter>
					<AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
					<AlertDialogAction
						onClick={action.onConfirm}
						className={confirmClasses}
						disabled={triggerDisabled}
					>
						{action.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
						{action.loading ? "处理中..." : confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function RegularActionButton({ action }: { action: ButtonActionDescriptor }) {
	const disabled = Boolean(action.disabled || action.loading);
	return (
		<Button
			variant={action.variant}
			size={action.size ?? "sm"}
			className={cn("h-8 px-3 text-xs", action.className)}
			onClick={action.onClick}
			disabled={disabled}
		>
			<ButtonContent action={action} />
		</Button>
	);
}

function ButtonContent({ action }: { action: BaseActionDescriptor }) {
	return (
		<>
			{action.loading ? (
				<Loader2 className="mr-2 h-4 w-4 animate-spin" />
			) : action.icon ? (
				<span className="mr-2 flex items-center">{action.icon}</span>
			) : null}
			<span>{action.label}</span>
		</>
	);
}

function createSettlementSummary({
	originalTotal,
	discountTotal,
	returnMoney,
	actualTotal,
}: {
	originalTotal: string;
	discountTotal: string;
	returnMoney: string;
	actualTotal: string;
}): ReactNode {
	const formatMoney = (value: string) => {
		const parsed = parseFloat(value);
		return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
	};

	const netTotal = parseFloat(actualTotal) - parseFloat(returnMoney);

	return (
		<>
			<Separator />
			<div className="mt-4 space-y-1 text-sm text-muted-foreground">
				<p>
					原价: <span className="font-semibold font-mono ml-2">¥{formatMoney(originalTotal)}</span>
				</p>
				<p className="text-red-600">
					折扣: <span className="font-semibold font-mono ml-2">-¥{formatMoney(discountTotal)}</span>
				</p>
				<p className="text-red-600">
					退款: <span className="font-semibold font-mono ml-2">-¥{formatMoney(returnMoney)}</span>
				</p>
				<p>
					实收: <span className="font-semibold font-mono ml-2">¥{Number.isFinite(netTotal) ? netTotal.toFixed(2) : "0.00"}</span>
				</p>
			</div>
			<Separator />
		</>
	);
}


function buildCompletionAction({
	tenant,
	status,
	returnExchangeRecords,
	orderItems,
	completeAcceptance,
	showRejectConfirmation,
	productStatusSummary,
	requestCustomerExchange,
	requestingCustomerExchange,
}: {
	tenant: TenantType;
	status: OrderStatus;
	returnExchangeRecords: ReturnExchangeItem[];
	orderItems: OrderItem[];
	completeAcceptance: () => void;
	showRejectConfirmation: () => void;
	productStatusSummary: { totalItems: number; hasExchange: boolean; allInspected: boolean };
	requestCustomerExchange: () => void;
	requestingCustomerExchange: boolean;
}): ActionDescriptor | null {
	const requireAllProcessedStatuses = new Set<OrderStatus>([
		OrderStatus.MARKET_INSPECTING,
		OrderStatus.EXCHANGE_INSPECTING,
		OrderStatus.CUSTOMER_INSPECTING,
	]);

const requireAllProcessed = requireAllProcessedStatuses.has(status);
let allProcessed = true;

if (tenant === TenantType.CUSTOMER && status === OrderStatus.CUSTOMER_INSPECTING) {
	allProcessed = productStatusSummary.allInspected;
} else if (requireAllProcessed) {
	const processedCountMatch =
		orderItems.length > 0 &&
		returnExchangeRecords.length > 0 &&
		returnExchangeRecords.length === orderItems.length;
	allProcessed = processedCountMatch;
}

if (!allProcessed) {
	return null;
}

	if (
		tenant === TenantType.MARKET &&
		(status === OrderStatus.MARKET_INSPECTING || status === OrderStatus.EXCHANGE_INSPECTING)
	) {
		return {
			key: "market-complete-acceptance",
			type: "button",
			label: "完成验收",
			className: "h-8 px-2 text-xs bg-green-700 text-white hover:bg-green-600",
			onClick: completeAcceptance,
		};
	}

		if (tenant === TenantType.CUSTOMER) {
			if (status === OrderStatus.CUSTOMER_INSPECTING) {
				if (productStatusSummary.hasExchange) {
					return {
						key: "customer-request-exchange",
						type: "dialog",
						label: requestingCustomerExchange ? "提交中..." : "申请换货",
						className: "h-8 px-3 text-xs bg-orange-600 text-white hover:bg-orange-500",
						dialog: {
							title: "确认申请换货?",
							description: "确认后，系统将通知市场处理换货申请。",
						},
						onConfirm: requestCustomerExchange,
						disabled: requestingCustomerExchange,
						loading: requestingCustomerExchange,
					};
				}

				// Show complete acceptance button only when all items are inspected and none are exchanged
				if (productStatusSummary.allInspected && !productStatusSummary.hasExchange) {
					return {
						key: "customer-complete-acceptance",
						type: "dialog",
						label: "完成验收",
						className: "h-8 px-3 text-xs bg-green-700 text-white hover:bg-green-600",
						dialog: {
							title: "确认完成验收?",
							description: "确认后，订单状态将更新为\"已完成\"。",
						},
						onConfirm: completeAcceptance,
					};
				}
			}

		if (status === OrderStatus.RETURN_REQUESTED) {
			return {
				key: "customer-reject-after-sale",
				type: "button",
				label: "拒绝供应商售后",
				className: "h-8 px-2 text-xs bg-red-700 text-white hover:bg-red-600",
				onClick: showRejectConfirmation,
			};
		}
	}

	return null;
}