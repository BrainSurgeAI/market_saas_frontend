"use client";

import { useEffect, useState, Fragment, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, User, Save, ChevronDownIcon, Download, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

import { getStatusVariant, translateOrderStatus } from "@/lib/utils";
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
import { DeliveryPerson } from "@/app/models";
import CustomButton from "./CustomButton";

interface OrderItem {
	id: number;
	productId: string;
	name: string;
	categoryId: number;
	category: string;
	unit: string;
	quantity: string;
	price: string;
	discountRate: string;
	actualPrice: string;
	total: string;
	processingRequirements: string | null;
	remark: string | null;
	actualQuantity: string;
	actualAmount: string;
	status?: string;
}

interface OrderDetail {
	id: number;
	orderCode: string;
	customerName: string;
	orderStatus: string;
	totalAmount: string;
	discountAmount: string;
	actualAmount: string;
	deliveryDate: string;
	deliveryAddress: string;
	contactName: string;
	contactPhone: string;
	remark: string | null;
	createdBy: string;
	createdAt: string;
	confirmBy: string | null;
	confirmedAt: string | null;
	cancelBy: string | null;
	cancelledAt: string | null;
	afterSaleAt: string | null;
	rejectBy: string | null;
	rejectedAt: string | null;
	rejectReason: string | null;
	completedBy: string | null;
	deliveryStaffName: string | null;
	deliveryStaffPhone: string | null;
	providerName: string | null;
}

interface ApiResponse {
	order: OrderDetail;
	items: OrderItem[];
	receipts: {
		id: number;
		orderId: string;
		productId: string;
		productName: string;
		operationType: string;
		quantity: number;
		reason: string;
		unit: string;
	}[];
}

interface OrderDetailProps {
	orderCode: string;
	orgId: string;
	tenantType: string;
}

type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "STOCKED" | "COMPLETED" | "AFTER_SALE" | "REJECTED";
type OperationType = "RETURN" | "EXCHANGE" | "SIGN";

interface ReturnExchangeItem {
	orderId: string;
	id: number;
	productId: string;
	productName: string;
	operationType: OperationType;
	quantity: number;
	reason: string;
	unit: string;
}


// 将API返回的操作记录转换为组件内部使用的格式
const convertApiReceiptToInternalFormat = (receipt: ApiResponse['receipts'][0]): ReturnExchangeItem => {
	return {
		orderId: receipt.orderId,
		id: receipt.id,
		productId: receipt.productId,
		productName: receipt.productName,
		operationType: receipt.operationType as OperationType,
		quantity: receipt.quantity,
		reason: receipt.reason,
		unit: receipt.unit
	};
};

// 添加AfterSaleCountdown组件
const AfterSaleCountdown = ({ afterSaleAt, rejectedAt, orderStatus, forceUpdate }: {
	afterSaleAt: string | null,
	rejectedAt: string | null,
	orderStatus: string,
	forceUpdate?: number
}) => {
	const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
	const { toast } = useToast();

	const [isTimerEnded, setIsTimerEnded] = useState(false);

	// 根据订单状态确定使用哪个时间作为起点
	const startTimeStr = useMemo(() => {
		if (orderStatus === 'AFTER_SALE' && afterSaleAt) {
			return afterSaleAt;
		} else if (orderStatus === 'REJECTED' && rejectedAt) {
			return rejectedAt;
		}
		return null;
	}, [orderStatus, afterSaleAt, rejectedAt]);

	// 重置计时器的逻辑
	useEffect(() => {
		setIsTimerEnded(false);
	}, [forceUpdate, startTimeStr]);

	// 计算倒计时
	useEffect(() => {
		if (!startTimeStr) return;

		const startTimeMs = new Date(startTimeStr).getTime();
		const timeLimit = 120 * 60 * 1000; // 120分钟，单位为毫秒
		const endTime = startTimeMs + timeLimit;

		const calculateTimeLeft = () => {
			const now = new Date().getTime();
			const difference = endTime - now;

			if (difference <= 0) {
				setTimeLeft("00:00:00");

				if (!isTimerEnded) {
					setIsTimerEnded(true);
					// 倒计时结束，刷新页面获取最新状态
					toast({
						title: "售后时间已结束",
						description: "正在刷新页面获取最新状态...",
						variant: "default",
						duration: 3000,
					});

					// 延迟2秒后刷新页面，让用户有时间看到提示
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

	// 根据订单状态显示不同的倒计时标题
	const countdownTitle = useMemo(() => {
		if (orderStatus === 'AFTER_SALE') {
			return "离供应商售后结束还有";
		} else if (orderStatus === 'REJECTED') {
			return "离服务中心处理完成还有";
		}
		return "倒计时";
	}, [orderStatus]);

	return (
		<div className="absolute inset-0 flex items-center justify-center z-20">
			<div className="bg-black text-white px-6 py-3 rounded-lg shadow-lg text-center">
				<p className="text-xs mb-1">{countdownTitle}</p>
				<p className="text-2xl font-mono">{timeLeft}</p>
			</div>
		</div>
	);
};

export default function OrderDetail({ orderCode, orgId, tenantType }: OrderDetailProps) {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const { user } = useWorkspace();
	const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
	const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [processing, setProcessing] = useState(false);

	const [isEditing, setIsEditing] = useState(false);
	const [savingChanges, setSavingChanges] = useState(false);
	const [itemErrors, setItemErrors] = useState<Record<number, string>>({});
	const [originalTotal, setOriginalTotal] = useState<string>("0");
	const [discountTotal, setDiscountTotal] = useState<string>("0");
	const [actualTotal, setActualTotal] = useState<string>("0");
	const [operationType, setOperationType] = useState<OperationType | null>(null);
	const [operatingProductId, setOperatingProductId] = useState<number>(0);
	const [operatingQuantity, setOperatingQuantity] = useState<string>("0");
	const [operatingReason, setOperatingReason] = useState<string>("");
	const [useFullQuantity, setUseFullQuantity] = useState<boolean>(false);
	const [showOperationDialog, setShowOperationDialog] = useState<boolean>(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
	const [quantityError, setQuantityError] = useState<string>("");
	const [reasonError, setReasonError] = useState<string>("");
	const [returnExchangeRecords, setReturnExchangeRecords] = useState<ReturnExchangeItem[]>([]);
	const [exportingExcel, setExportingExcel] = useState(false);
	const [showOrderInfo, setShowOrderInfo] = useState(false);
	const [deliveryStaffs, setDeliveryStaffs] = useState<DeliveryPerson[]>([]);
	const [selectedDeliveryStaff, setSelectedDeliveryStaff] = useState<DeliveryPerson | null>(null);
	const [showDeliveryStaffDialog, setShowDeliveryStaffDialog] = useState(false);
	const [afterSaleTimestamp, setAfterSaleTimestamp] = useState<number>(0);
	const [showRejectConfirmDialog, setShowRejectConfirmDialog] = useState(false);
	const [statusChangeMessage, setStatusChangeMessage] = useState<{ title: string, description: string } | null>(null);

	// 根据租户类型和订单状态判断是否显示订单状态
	const shouldDisplayActualQuantity = (status: OrderStatus): boolean => {
		if (tenantType.toLowerCase() === 'provider') {
			return !['PENDING', 'CONFIRMED'].includes(status);
		} else {
			return ['STOCKED', 'AFTER_SALE', 'COMPLETED', 'REJECTED'].includes(status);
		}
	}

	const shouldDisplayOrderStatus = (status: OrderStatus): boolean => {
		return 'STOCKED' === status && tenantType.toLowerCase() === 'customer';
	}

	useEffect(() => {
		const fetchOrderDetail = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch(`/api/customers/${orgId}/orders/${orderCode}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (!response.ok) {
					throw new Error(`请求失败: ${response.status}`);
				}

				const responseData: ApiResponse = await response.json();

				setOrderDetail(responseData.order);
				setOrderItems(responseData.items);

				// 确保操作记录正确初始化
				let allReceipts: ReturnExchangeItem[] = [];

				// 处理API返回的receipts
				if (responseData.receipts && Array.isArray(responseData.receipts)) {
					const formattedReceipts = responseData.receipts.map(receipt => convertApiReceiptToInternalFormat(receipt));
					allReceipts = [...allReceipts, ...formattedReceipts];
				}

				// 处理商品上的status字段，将其转换为对应的操作记录
				if (responseData.items && Array.isArray(responseData.items)) {
					const statusReceipts = responseData.items
						.filter(item => item.status) // 只处理有status的商品
						.map(item => {
							// 根据status创建对应的操作记录
							let operationType: OperationType;

							if (item.status === 'SIGN') {
								operationType = 'SIGN';
							} else if (item.status === 'RETURNED') {
								operationType = 'RETURN';
							} else if (item.status === 'EXCHANGED') {
								operationType = 'EXCHANGE';
							} else {
								return null; // 不支持的状态跳过
							}

							// 检查是否已存在此商品的操作记录，避免重复
							const existingReceipt = allReceipts.find(
								r => r.productId === item.productId && r.operationType === operationType
							);

							if (existingReceipt) {
								return null; // 已存在相同商品同类型的操作记录，跳过
							}

							// 创建新的操作记录
							return {
								orderId: orderCode,
								id: item.id,
								productId: item.productId,
								productName: item.name,
								operationType: operationType,
								quantity: parseFloat(item.actualQuantity), // 使用实际数量
								reason: operationType === 'SIGN' ? '客户签收确认' : '系统自动生成的记录',
								unit: item.unit
							} as ReturnExchangeItem;
						})
						.filter(Boolean) as ReturnExchangeItem[]; // 过滤掉null

					// 合并两类操作记录
					allReceipts = [...allReceipts, ...statusReceipts];
				}

				// 设置所有操作记录
				setReturnExchangeRecords(allReceipts);

				// 如果订单状态已经是PROCESSING，则设置为编辑模式, 并且tenantType为provider
				if (responseData.order.orderStatus === 'PROCESSING' && tenantType.toLowerCase() === 'provider') {
					setIsEditing(true);
				}

				// 初始化订单金额
				setOriginalTotal(responseData.order.totalAmount);
				setDiscountTotal(responseData.order.discountAmount || "0");
				setActualTotal(responseData.order.actualAmount);

			} catch (err) {
				setError(err instanceof Error ? err.message : "获取订单详情时出错");
			} finally {
				setLoading(false);
			}
		};

		if (params?.order_code) {
			fetchOrderDetail();
		}
	}, [params?.order_code, params?.provider_id]);

	const returnMoney = () => {
		const d = returnExchangeRecords
			.filter(r => r.operationType === 'RETURN')
			.reduce((acc, record) => {
				const item = orderItems.find(item => item.id === record.id);
				if (!item) return acc;
				return acc + parseFloat(item.actualPrice) * record.quantity;
			}, 0).toFixed(2);
		return d;
	}

	const shouldDisplayReturnMoney = () => {
		return (orderDetail?.orderStatus === 'STOCKED' as OrderStatus ||
			orderDetail?.orderStatus === 'AFTER_SALE' as OrderStatus ||
			orderDetail?.orderStatus === 'REJECTED' as OrderStatus ||
			orderDetail?.orderStatus === 'COMPLETED' as OrderStatus) && parseFloat(returnMoney()) > 0;
	}

	// 合并服务器的操作记录和本地缓存的操作记录
	const mergeOperationRecords = () => {
		const existingRecordsString = sessionStorage.getItem('returnExchangeItems');
		let localRecords: ReturnExchangeItem[] = [];
		if (existingRecordsString) {
			try {
				localRecords = JSON.parse(existingRecordsString);
			} catch (e) {
				console.error("解析sessionStorage退换货数据出错", e);
			}
		}

		// 过滤出不属于当前订单的记录
		const otherOrderRecords = localRecords.filter(record => record.orderId !== orderCode);

		// 合并当前订单的远程记录和本地记录，优先使用本地记录（可能包含未同步的最新操作）
		const currentOrderLocalRecords = localRecords.filter(record => record.orderId === orderCode);
		const allRecords = [...otherOrderRecords, ...currentOrderLocalRecords];

		// 更新sessionStorage
		sessionStorage.setItem('returnExchangeItems', JSON.stringify(allRecords));

		return currentOrderLocalRecords;
	};

	useEffect(() => {
		if (returnExchangeRecords.length > 0) {
			const localRecords = mergeOperationRecords();

			if (localRecords.length === 0) {
				const allLocalRecords = JSON.parse(sessionStorage.getItem('returnExchangeItems') || '[]');
				sessionStorage.setItem('returnExchangeItems', JSON.stringify([...allLocalRecords, ...returnExchangeRecords]));
			}
		}
	}, [returnExchangeRecords.length]);

	// 获取商品的退换货记录
	const getItemReturnExchangeRecords = (id: number) => {
		return returnExchangeRecords.filter(record => record.id === id);
	};

	// 判断商品是否已签收
	const isProductSigned = (id: number) => {
		return returnExchangeRecords.some(
			record => record.id === id && record.operationType === 'SIGN'
		);
	};

	// 获取商品的签收记录
	const getProductSignRecord = (id: number) => {
		return returnExchangeRecords.find(
			record => record.id === id && record.operationType === 'SIGN'
		);
	};

	// 判断商品是否已经有操作记录(签收、退货或换货)
	const hasProductOperation = (id: number) => {
		return returnExchangeRecords.some(
			record => record.id === id
		);
	};

	// 处理退货/换货操作
	const handleOperation = (id: number, type: OperationType) => {
		// 查找对应的商品项
		const item = orderItems.find(item => item.id === id);
		if (!item) return;

		// 初始化操作状态
		setOperatingProductId(id);
		setOperationType(type);
		setOperatingQuantity("0");
		setOperatingReason("");
		setUseFullQuantity(false);
		setQuantityError("");
		setReasonError("");

		// 如果是签收操作，直接显示确认对话框
		if (type === 'SIGN') {
			setOperatingQuantity(item.actualQuantity);
			setTimeout(() => {
				setShowConfirmDialog(true);
			}, 0);
		} else {
			// 显示操作对话框
			setTimeout(() => {
				setShowOperationDialog(true);
			}, 0);
		}
	};

	// 验证退换货数量
	const validateQuantity = (value: string, id: number): boolean => {
		const numValue = parseFloat(value);
		const item = orderItems.find(item => item.id === id);

		if (!item) {
			setQuantityError("商品不存在");
			return false;
		}

		if (isNaN(numValue)) {
			setQuantityError("请输入有效数字");
			return false;
		}

		if (numValue <= 0) {
			setQuantityError("数量必须大于0");
			return false;
		}

		const maxQuantity = parseFloat(item.actualQuantity);
		if (numValue > maxQuantity) {
			setQuantityError(`数量不能超过实际数量 ${maxQuantity}`);
			return false;
		}

		// 检查小数位数
		if (value.includes('.') && value.split('.')[1].length > 2) {
			setQuantityError("最多支持2位小数");
			return false;
		}

		setQuantityError("");
		return true;
	};

	// 处理数量变更
	const handleQuantityChange = (value: string) => {
		setOperatingQuantity(value);
		validateQuantity(value, operatingProductId);
	};

	// 处理原因变更
	const handleReasonChange = (value: string) => {
		setOperatingReason(value);
		validateReason(value);
	};

	// 验证原因
	const validateReason = (value: string): boolean => {
		// 签收操作原因是可选的
		if (operationType === 'SIGN') {
			setReasonError("");
			return true;
		}

		if (value.length < 6) {
			setReasonError("原因描述不能少于6个字符");
			return false;
		}

		if (value.length > 255) {
			setReasonError("原因描述不能超过255个字符");
			return false;
		}

		setReasonError("");
		return true;
	};

	// 处理使用全部数量
	const handleUseFullQuantity = (checked: boolean) => {
		setUseFullQuantity(checked);

		if (checked) {
			const item = orderItems.find(item => item.id === operatingProductId);
			if (item) {
				setOperatingQuantity(item.actualQuantity);
				setQuantityError("");
			}
		}
	};

	// 处理提交
	const handleSubmitOperation = () => {
		// 验证数量和原因
		const isQuantityValid = validateQuantity(operatingQuantity, operatingProductId);
		// 签收操作不需要强制填写原因
		const isReasonValid = operationType === 'SIGN' ? true : validateReason(operatingReason);

		// 如果任一验证失败，或没有操作类型，则退出
		if (!isQuantityValid || !isReasonValid || !operationType) {
			return;
		}

		// 显示确认对话框
		setShowConfirmDialog(true);
	};

	// 处理确认操作
	const handleConfirmOperation = () => {
		// 获取商品信息
		const item = orderItems.find(item => item.id === operatingProductId);
		if (!item || !operationType || !orderDetail) return;

		// 创建操作记录
		const operationRecord: ReturnExchangeItem = {
			orderId: orderCode,
			id: item.id,
			productId: item.productId,
			productName: item.name,
			operationType: operationType,
			quantity: parseFloat(operatingQuantity),
			reason: operatingReason || (operationType === 'SIGN' ? '客户签收确认' : ''),
			unit: item.unit
		};

		// 从sessionStorage获取现有记录
		const existingRecordsString = sessionStorage.getItem('returnExchangeItems');
		let records: ReturnExchangeItem[] = [];
		if (existingRecordsString) {
			try {
				records = JSON.parse(existingRecordsString);
			} catch (e) {
				console.error("解析sessionStorage数据出错", e);
			}
		}

		// 移除同一商品的已有记录，然后添加新的记录
		records = records.filter(record => !(record.orderId === orderCode && record.id === operatingProductId));
		records.push(operationRecord);

		// 保存到sessionStorage
		sessionStorage.setItem('returnExchangeItems', JSON.stringify(records));

		// 更新本地状态中的退换货记录
		setReturnExchangeRecords(records.filter(record => record.orderId === orderCode));

		// 提交到服务器
		submitOperationToServer(operationRecord);

		// 更新实付金额
		if (operationType === 'RETURN') {
			const returnAmount = parseFloat(item.actualPrice) * parseFloat(operatingQuantity);
			const newActualAmount = (parseFloat(orderDetail.actualAmount) - returnAmount).toFixed(2);
			setOrderDetail({
				...orderDetail,
				actualAmount: newActualAmount
			});
		}

		// 提示用户
		toast({
			title: "操作成功",
			description: operationType === 'SIGN' ? "商品签收记录已保存" :
				records.length > 1 && records.some(r => r.orderId === orderCode && r.id === operatingProductId && r !== operationRecord)
					? `${operationType === 'RETURN' ? '退货' : '换货'}记录已更新（覆盖之前的记录）`
					: `${operationType === 'RETURN' ? '退货' : '换货'}记录已保存`,
			variant: "default",
		});

		// 先关闭确认对话框
		setShowConfirmDialog(false);

		// 延迟一点关闭主对话框，避免状态更新冲突
		setTimeout(() => {
			setShowOperationDialog(false);
		}, 100);
	};

	const completeOrder = async () => {
		try {
			const apiUrl = `/api/customers/${orgId}/orders/${orderCode}/operations`;
			const response = await fetch(apiUrl, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					operateBy: user?.name || '',
					status: 'COMPLETED',
				}),
			});

			if (!response.ok) {
				throw new Error(`提交操作记录失败: ${response.status}`);
			}

			// 更新订单状态
			if (orderDetail) {
				setOrderDetail({
					...orderDetail,
					orderStatus: 'COMPLETED'
				});
			}

			toast({
				title: "提交成功",
				description: `订单${orderCode}已确认完成`,
				variant: "success",
				duration: 3000,
			});

		} catch (error) {
			console.error('提交操作记录到服务器时出错:', error);
			toast({
				title: "同步失败",
				description: "操作记录未能同步到服务器",
				variant: "destructive",
				duration: 3000,
			});
		}
	};

	const submitOperationToServer = async (operationRecord: ReturnExchangeItem) => {
		try {
			const apiUrl = tenantType.toLowerCase() === 'provider'
				? `/api/providers/${params?.provider_id}/orders/${orderCode}/operations`
				: `/api/customers/${orgId}/orders/${orderCode}/operations`;

			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					receipt: operationRecord,
					operateBy: user?.name || '',
				}),
			});

			if (!response.ok) {
				throw new Error(`提交操作记录失败: ${response.status}`);
			}

		} catch (error) {
			console.error('提交操作记录到服务器时出错:', error);
			toast({
				title: "同步失败",
				description: "操作记录已保存在本地，但未能同步到服务器",
				variant: "destructive",
				duration: 5000,
			});
		}
	};

	// 计算订单项分类汇总
	const getCategorySummary = () => {
		const summary: Record<string, { count: number, total: number }> = {};

		orderItems.forEach(item => {
			if (!summary[item.category]) {
				summary[item.category] = { count: 0, total: 0 };
			}

			if (orderDetail?.orderStatus !== 'STOCKED' as OrderStatus && orderDetail?.orderStatus !== 'AFTER_SALE' as OrderStatus &&
				orderDetail?.orderStatus !== 'ACCEPTED' as OrderStatus && orderDetail?.orderStatus !== 'COMPLETED' as OrderStatus) {
				// 使用实际数量进行计算
				const actualQuantity = parseFloat(item.actualQuantity) > 0 ? parseFloat(item.actualQuantity) : parseFloat(item.quantity);
				summary[item.category].total += parseFloat(item.actualPrice) * actualQuantity;
			}
			else {
				// 只考虑退货类型的记录，忽略换货类型的记录
				const returnQuantity = returnExchangeRecords
					.filter(r => r.id === item.id && r.operationType === 'RETURN')
					.reduce((sum, r) => sum + r.quantity, 0);

				// 使用实际数量减去退货数量
				summary[item.category].total += parseFloat(item.actualPrice) * (parseFloat(item.actualQuantity) - returnQuantity);
			}
		});

		return Object.entries(summary).map(([category, data]) => ({
			category,
			count: data.count,
			total: data.total.toFixed(2)
		}));
	};

	const completeAcceptance = async () => {
		try {
			// 一次遍历确定订单状态
			let hasReturnOrExchange = false;

			// 检查所有商品状态
			for (const item of orderItems) {
				const records = getItemReturnExchangeRecords(item.id);

				// 检查是否存在退换货记录
				if (records.some(record => record.operationType === 'RETURN' || record.operationType === 'EXCHANGE')) {
					hasReturnOrExchange = true;
					break;
				}
			}

			const apiUrl = `/api/customers/${orgId}/orders/${orderCode}/operations`;

			// From Stocked to After Sale or Completed automatically
			const status = hasReturnOrExchange ? 'AFTER_SALE' : 'COMPLETED';

			const response = await fetch(apiUrl, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					operateBy: user?.name || '',
					status: status,
				}),
			});

			if (!response.ok) {
				throw new Error(`提交操作记录失败: ${response.status}`);
			}

			// 更新订单状态
			if (orderDetail) {
				// 如果状态是AFTER_SALE，则设置当前时间为afterSaleAt
				const currentTime = hasReturnOrExchange ? new Date().toISOString() : null;

				setOrderDetail({
					...orderDetail,
					orderStatus: status,
					afterSaleAt: currentTime
				});

				// 如果进入售后状态，更新倒计时触发器
				if (hasReturnOrExchange) {
					setAfterSaleTimestamp(Date.now());
				}
			}

			toast({
				title: "提交成功",
				description: `订单${orderCode}已${hasReturnOrExchange ? '进入售后处理' : '完成验收'}`,
				variant: "success",
				duration: 3000,
			});

		} catch (error) {
			console.error('提交操作记录到服务器时出错:', error);
			toast({
				title: "同步失败",
				description: "操作记录未能同步到服务器",
				variant: "destructive",
				duration: 3000,
			});
		}
	};

	// 处理开始备货
	const handleStartProcessing = async () => {
		if (!orderDetail || processing) return;

		try {
			setProcessing(true);

			// 如果是供应商角色，先获取配送人员列表
			if (tenantType.toLowerCase() === 'provider') {
				// 获取配送人员列表
				const staffResponse = await fetch(`/api/providers/${params?.provider_id}/delivery-staffs`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (!staffResponse.ok) {
					throw new Error(`获取配送人员列表失败: ${staffResponse.status}`);
				}

				const staffData = await staffResponse.json();
				const deliveryStaffs = staffData.data || [];

				// 过滤出启用状态的配送人员
				const activeStaffs = deliveryStaffs.filter((staff: DeliveryPerson) => staff.status === 1);

				if (activeStaffs.length === 0) {
					toast({
						title: "无可用配送人员",
						description: "请先添加并启用至少一名配送人员",
						variant: "destructive",
						duration: 3000,
					});
					setProcessing(false);
					return;
				}

				// 弹出选择配送人员的对话框
				setDeliveryStaffs(activeStaffs);
				setShowDeliveryStaffDialog(true);
				setProcessing(false);
				return;
			}

			// 不是供应商或者已经选择了配送人员，直接开始备货
			await submitStartProcessing();
		} catch (err) {
			toast({
				title: "操作失败",
				description: err instanceof Error ? err.message : "开始备货时出错",
				variant: "destructive",
				duration: 3000,
			});
		} finally {
			setProcessing(false);
		}
	};

	// 提交开始备货请求
	const submitStartProcessing = async () => {
		try {
			setProcessing(true);

			const response = await fetch(`/api/providers/${params?.provider_id}/orders/${params?.order_code}/process`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					status: 'PROCESSING',
					processedBy: user?.name || '',
					idCard: selectedDeliveryStaff?.idCard || null,
				}),
			});

			if (!response.ok) {
				throw new Error(`开始备货失败: ${response.status}`);
			}

			// 更新订单状态并允许编辑实际数量
			setOrderDetail({
				...orderDetail!,
				orderStatus: 'PROCESSING'
			});
			setIsEditing(true);
			setShowDeliveryStaffDialog(false);

			toast({
				title: "操作成功",
				description: `订单已开始备货处理${selectedDeliveryStaff ? `，配送人员：${selectedDeliveryStaff.name}` : ''}`,
				variant: "default",
				duration: 3000,
			});
		} catch (err) {
			toast({
				title: "操作失败",
				description: err instanceof Error ? err.message : "开始备货时出错",
				variant: "destructive",
				duration: 3000,
			});
		} finally {
			setProcessing(false);
		}
	};

	// 处理配送人员选择
	const handleDeliveryStaffChange = (idCard: string) => {
		const staff = deliveryStaffs.find(s => s.idCard === idCard);
		if (staff) {
			setSelectedDeliveryStaff(staff);
		}
	};

	// 处理实际数量变更
	const handleActualQuantityChange = (id: number, value: string) => {
		const newErrors = { ...itemErrors };
		delete newErrors[id];

		// 验证输入
		const numericValue = parseFloat(value);
		if (isNaN(numericValue)) {
			newErrors[id] = "请输入数字";
		} else if (numericValue < 0) {
			newErrors[id] = "不能为负数";
		} else if (numericValue === 0) {
			newErrors[id] = "不能为0";
		} else if (numericValue > 999999.99) {
			newErrors[id] = "超出范围";
		} else if (value.includes('.') && value.split('.')[1].length > 2) {
			newErrors[id] = "最多支持2位小数";
		}

		setItemErrors(newErrors);

		// 更新商品项
		const updatedItems = orderItems.map(item => {
			if (item.id === id) {
				const actualQuantity = value;
				const actualPrice = parseFloat(item.actualPrice);

				// 计算实际总价和原始总价
				const actualTotal = (actualQuantity && !isNaN(parseFloat(actualQuantity)) && !isNaN(actualPrice))
					? (parseFloat(actualQuantity) * actualPrice).toFixed(2)
					: item.total;

				return {
					...item,
					actualQuantity,
					actualTotal
				};
			}
			return item;
		});

		setOrderItems(updatedItems);
		updateOrderTotals(updatedItems);
	};

	const handleSaveActualQuantities = async () => {
		if (hasErrors() || savingChanges) return;

		try {
			setSavingChanges(true);

			const response = await fetch(`/api/providers/${params?.provider_id}/orders/${params?.order_code}/update-quantities`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					stockedBy: user?.name || '',
					items: orderItems.map(item => ({
						id: item.id,
						actualQuantity: item.actualQuantity,
					}))
				}),
			});

			if (!response.ok) {
				throw new Error(`保存实际数量失败: ${response.status}`);
			}

			// 更新订单项的实际金额，确保使用实际数量乘以实际单价
			const updatedItems = orderItems.map(item => {
				const actualAmount = (parseFloat(item.actualPrice) * parseFloat(item.actualQuantity)).toFixed(2);
				return {
					...item,
					actualAmount
				};
			});

			setOrderItems(updatedItems);

			if (orderDetail) {
				setOrderDetail({
					...orderDetail,
					orderStatus: 'STOCKED',
					actualAmount: actualTotal,
					totalAmount: originalTotal,
					discountAmount: discountTotal
				});
			}
			setIsEditing(false);

			toast({
				title: "保存成功",
				description: "实际发货量已更新",
				variant: "success",
				duration: 3000,
			});
		} catch (err) {
			toast({
				title: "保存失败",
				description: err instanceof Error ? err.message : "保存实际发货量时出错",
				variant: "destructive",
				duration: 3000,
			});
		} finally {
			setSavingChanges(false);
		}
	};

	// 计算实际总额
	const calculateActualTotal = (items: OrderItem[]) => {
		return items.reduce((sum, item) => {
			const actualTotal = parseFloat(item.actualPrice) * parseFloat(item.actualQuantity);
			return isNaN(actualTotal) ? sum : sum + actualTotal;
		}, 0).toFixed(2);
	};

	// 计算原始总额
	const calculateOriginalTotal = (items: OrderItem[]) => {
		return items.reduce((sum, item) => {
			if (!item.actualQuantity || isNaN(parseFloat(item.actualQuantity))) return sum;

			const quantity = parseFloat(item.actualQuantity);
			const price = parseFloat(item.price);
			return sum + (quantity * price);
		}, 0).toFixed(2);
	};

	// 计算折扣总额
	const calculateDiscountTotal = (originalTotal: number, actualTotal: number) => {
		return Math.max(0, originalTotal - actualTotal).toFixed(2);
	};

	// 更新订单总额
	const updateOrderTotals = (items: OrderItem[]) => {
		const newActualTotal = calculateActualTotal(items);
		const newOriginalTotal = calculateOriginalTotal(items);
		const newDiscountTotal = calculateDiscountTotal(parseFloat(newOriginalTotal), parseFloat(newActualTotal));

		setActualTotal(newActualTotal);
		setOriginalTotal(newOriginalTotal);
		setDiscountTotal(newDiscountTotal);
	};

	const handleRejectOrComplete = async () => {
		if (!orderDetail) return;
		const status = orderDetail.orderStatus === 'AFTER_SALE' ? 'REJECTED' : 'COMPLETED';
		console.log(status);

		try {
			const apiUrl = `/api/customers/${orgId}/orders/${orderCode}/operations`;
			const response = await fetch(apiUrl, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					operateBy: user?.name || '',
					status: status,
				}),
			});

			if (!response.ok) {
				throw new Error(`提交操作记录失败: ${response.status}`);
			}

			const currentTime = new Date().toISOString();

			// 更新订单状态，如果是REJECTED，设置rejectedAt
			if (orderDetail) {
				setOrderDetail({
					...orderDetail,
					orderStatus: status,
					// 如果状态是REJECTED，更新rejectedAt
					...(status === 'REJECTED' ? { rejectedAt: currentTime } : {})
				});
			}

			// 如果进入REJECTED状态，更新倒计时触发器
			if (status === 'REJECTED') {
				setAfterSaleTimestamp(Date.now());
				// 显示状态变更提示
				setStatusChangeMessage({
					title: "售后处理已开始",
					description: "服务中心已开始处理您的售后申请，请耐心等待"
				});
			}

			toast({
				title: "提交成功",
				description: `订单${orderCode}已${status === 'REJECTED' ? '拒绝售后' : '完成验收'}`,
				variant: "success",
				duration: 3000,
			});

			// 关闭确认对话框
			setShowRejectConfirmDialog(false);

		} catch (error) {
			console.error('提交操作记录到服务器时出错:', error);
			toast({
				title: "同步失败",
				description: "操作记录未能同步到服务器",
				variant: "destructive",
				duration: 3000,
			});
			// 关闭确认对话框
			setShowRejectConfirmDialog(false);
		}
	}

	// 显示确认对话框的处理函数
	const showRejectConfirmation = () => {
		setShowRejectConfirmDialog(true);
	}

	// 验证是否有错误
	const hasErrors = () => {
		// 检查是否有显式的错误
		if (Object.keys(itemErrors).length > 0) {
			return true;
		}

		// 检查是否有商品的实际数量为0或无效
		for (const item of orderItems) {
			const quantity = parseFloat(item.actualQuantity);
			if (isNaN(quantity) || quantity === 0) {
				// 自动添加错误信息
				const newErrors = { ...itemErrors };
				newErrors[item.id] = quantity === 0 ? "数量不能为0" : "请输入数字";
				setItemErrors(newErrors);
				return true;
			}
		}

		return false;
	};

	// 返回上一页
	const handleGoBack = () => {
		router.back();
	};

	// 添加导出Excel功能
	const exportToExcel = async () => {
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
				{ header: '实际数量', key: 'actualQuantity', width: 10 },
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
	};

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

	if (!orderDetail) {
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
						{(orderDetail.orderStatus === "AFTER_SALE" || orderDetail.orderStatus === "REJECTED") && !showOrderInfo && (
							<div className="relative">
								<AfterSaleCountdown
									afterSaleAt={orderDetail.afterSaleAt}
									rejectedAt={orderDetail.rejectedAt}
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
											<p className="text-sm font-mono text-primary">¥{parseFloat(orderDetail.actualAmount).toFixed(2)}</p>
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
						<div className="flex items-center gap-2">
							<CustomButton
								returnExchangeRecordsLength={returnExchangeRecords.length}
								tenantType={tenantType}
								orderItemsSize={orderItems.length}
								orderStatus={orderDetail.orderStatus}
								orderHandler={completeAcceptance}
								rejectOrCompleteHandler={showRejectConfirmation}
							/>
							{orderDetail.orderStatus === 'AFTER_SALE' as OrderStatus && tenantType.toLowerCase() === 'customer' && (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											className="h-8 px-2 text-xs flex items-center gap-1 hover:bg-green-600 bg-green-700 text-white hover:text-white"
										>
											完成订单
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle className="text-sm">确认完成订单?</AlertDialogTitle>
											<AlertDialogDescription className="text-xs">
												确认后，订单状态将更新为"已完成"，此操作不可撤销。
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel className="text-xs">取消</AlertDialogCancel>
											<AlertDialogAction onClick={completeOrder} className="bg-green-600 hover:bg-green-500 text-xs">
												确认完成
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}

							<Button
								variant="outline"
								size="sm"
								className="h-8 px-2 text-xs flex items-center gap-1 hover:bg-gray-100"
								onClick={exportToExcel}
								disabled={exportingExcel}
							>
								{exportingExcel ? (
									<span className="animate-spin mr-1">⏳</span>
								) : (
									<Download className="h-3 w-3 mr-1" />
								)}
								导出Excel
							</Button>
							{/* 只有当订单状态为CONFIRMED时才显示开始备货按钮，并且tenantType为provider */}
							{orderDetail.orderStatus === "CONFIRMED" && tenantType.toLowerCase() === 'provider' && (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button className="bg-blue-600 hover:bg-blue-500" size="sm">
											开始备货
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle className="text-sm">确认开始备货?</AlertDialogTitle>
											<AlertDialogDescription className="text-xs">
												确认后，订单状态更新为"备货中"，表示您已开始准备该订单的商品。
												您可以编辑实际出货数量。
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>取消</AlertDialogCancel>
											<AlertDialogAction onClick={handleStartProcessing} disabled={processing} className="bg-blue-600 hover:bg-blue-500 text-xs">
												{processing ? "处理中..." : "确认"}
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}
							{/* 当处于编辑模式时显示保存按钮 */}
							{isEditing && orderDetail.orderStatus === "PROCESSING" && tenantType.toLowerCase() === 'provider' && (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button className="bg-green-600 hover:bg-green-500 flex items-center gap-1" size="sm" disabled={hasErrors() || savingChanges}>
											<Save className="h-4 w-4" />
											{savingChanges ? "保存中..." : "完成备货"}
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle className="text-sm font-semibold">确认实收金额?</AlertDialogTitle>
											<AlertDialogDescription className="text-xs">
												提交后，系统将更新商品的实际出货量，总金额也会相应调整。
											</AlertDialogDescription>
											<Separator />
											<div className="mt-4 space-y-1 text-sm text-muted-foreground">
												<p>原价: <span className="font-semibold font-mono ml-2">¥{originalTotal}</span></p>
												<p className="text-red-600">折扣: <span className="font-semibold font-mono ml-2">-¥{discountTotal}</span></p>
												<p>实收: <span className="font-semibold font-mono ml-2">¥{actualTotal}</span></p>
											</div>
											<Separator />
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>取消</AlertDialogCancel>
											<AlertDialogAction
												onClick={handleSaveActualQuantities}
												disabled={hasErrors() || savingChanges}
												className="bg-green-600 hover:bg-green-500 text-xs"
											>
												{savingChanges ? "保存中..." : "确认"}
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto" style={{ position: "relative" }}>
							<div className="relative" style={{ maxHeight: "600px", overflowY: "auto", zIndex: 40 }}>
								<table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
									<colgroup>
										<col style={{ width: "250px" }} />
										<col />
										<col />
										{shouldDisplayActualQuantity(orderDetail.orderStatus as OrderStatus) && <col />}
										<col />
										<col />
										<col />
										<col />
										<col />
										{shouldDisplayOrderStatus(orderDetail.orderStatus as OrderStatus) && <col />}
									</colgroup>
									<thead style={{
										position: "sticky",
										top: 0,
										zIndex: 1000,
										backgroundColor: "white",
										boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
									}}>
										<tr className="text-xs font-semibold bg-black text-white">
											<th className="text-left p-3 border-b">商品名称</th>
											<th className="text-left p-3 border-b">类别</th>
											<th className="text-center p-3 border-b">下单数量</th>
											{shouldDisplayActualQuantity(orderDetail.orderStatus as OrderStatus) && (
												<th className="text-center p-3 border-b">实际数量</th>
											)}
											<th className="text-center p-3 border-b">单位</th>
											<th className="text-right p-3 border-b">单价</th>
											<th className="text-right p-3 border-b">折扣</th>
											<th className="text-right p-3 border-b">实际单价</th>
											<th className="text-right p-3 border-b">小计（折后）</th>
											{shouldDisplayOrderStatus(orderDetail.orderStatus as OrderStatus) && (
												<th className="text-right p-3 border-b">操作</th>
											)}
										</tr>
									</thead>
									<tbody>
										{orderItems.map((item) => {
											// 获取当前商品的退换货记录
											const itemReturnExchanges = getItemReturnExchangeRecords(item.id);

											return (
												<Fragment key={item.id}>
													<tr className={`text-xs text-gray-700 ${isProductSigned(item.id) ? "bg-green-50" : ""}`}>
														<td className="p-2 border-b">
															{item.name}
															{(item.processingRequirements || item.remark) && (
																<div className="mt-1 text-xs text-gray-500">
																	{item.processingRequirements && (
																		<div className="mb-1">{item.processingRequirements}</div>
																	)}
																	{item.remark && <div>备注: {item.remark}</div>}
																</div>
															)}
															{isProductSigned(item.id) && (
																<div className="mt-1">
																	<Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[10px]">
																		已签收
																	</Badge>
																	{getProductSignRecord(item.id)?.reason && (
																		<div className="mt-0.5 text-[10px] text-green-600">
																			{getProductSignRecord(item.id)?.reason}
																		</div>
																	)}
																</div>
															)}
														</td>
														<td className="p-2 border-b">{item.category}</td>
														<td className="p-2 text-center border-b font-mono font-semibold">
															{parseFloat(item.quantity).toFixed(2)}
														</td>
														{shouldDisplayActualQuantity(orderDetail.orderStatus as OrderStatus) && (
															<td className="p-2 text-center border-b w-[120px]">
																{isEditing ? (
																	<div>
																		<Input
																			type="number"
																			value={item.actualQuantity}
																			onChange={(e) => handleActualQuantityChange && handleActualQuantityChange(item.id, e.target.value)}
																			className={`max-w-[100px] text-center font-mono font-semibold ${itemErrors[item.id] ? 'border-red-500' : ''}`}
																			step="0.01"
																			min="0"
																			max="999999.99"
																		/>
																		{itemErrors[item.id] && (
																			<p className="text-xs text-red-500 mt-1">{itemErrors[item.id]}</p>
																		)}
																	</div>
																) : (
																	<span className="font-mono font-semibold">{parseFloat(item.actualQuantity).toFixed(2)}</span>
																)}
															</td>
														)}
														<td className="p-2 text-center border-b font-mono">{item.unit}</td>
														<td className="p-2 text-right border-b font-mono font-semibold">¥{parseFloat(item.price).toFixed(2)}</td>
														<td className="p-2 text-right border-b font-mono font-semibold">
															{(parseFloat(item.discountRate) * 100).toFixed(0)}%
														</td>
														<td className="p-2 text-right border-b font-mono font-semibold">¥{parseFloat(item.actualPrice).toFixed(2)}</td>
														<td className="p-2 text-right border-b font-mono font-semibold">
															¥{isEditing
																? (parseFloat(item.actualPrice) * parseFloat(item.actualQuantity)).toFixed(2)
																: (item.actualAmount && parseFloat(item.actualAmount) > 0
																	? parseFloat(item.actualAmount).toFixed(2)
																	: (parseFloat(item.actualPrice) * parseFloat(item.actualQuantity)).toFixed(2))}
														</td>
														{shouldDisplayOrderStatus(orderDetail.orderStatus as OrderStatus) && (
															<td className="p-2 text-right border-b">
																{hasProductOperation(item.id) ? (
																	<Badge variant="outline" className={`rounded-full ${isProductSigned(item.id) ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
																		{isProductSigned(item.id) ? "已签收" : "申请售后"}
																	</Badge>
																) : (
																	<DropdownMenu>
																		<DropdownMenuTrigger asChild>
																			<Button
																				variant="outline"
																				size="sm"
																			>
																				...
																				<ChevronDownIcon className="ml-1 h-4 w-4" />
																			</Button>
																		</DropdownMenuTrigger>
																		<DropdownMenuContent align="end">
																			<DropdownMenuItem onClick={() => handleOperation(item.id, "SIGN" as OperationType)} className="cursor-pointer text-xs">
																				签收
																			</DropdownMenuItem>
																			<DropdownMenuItem onClick={() => handleOperation(item.id, "RETURN" as OperationType)} className="cursor-pointer text-xs">
																				退货
																			</DropdownMenuItem>
																			<DropdownMenuItem onClick={() => handleOperation(item.id, "EXCHANGE" as OperationType)} className="cursor-pointer text-xs">
																				换货
																			</DropdownMenuItem>
																		</DropdownMenuContent>
																	</DropdownMenu>
																)}
															</td>
														)}
													</tr>

													{/* 显示退换货记录作为内联行，签收记录已经通过行背景色和标签显示 */}
													{itemReturnExchanges.length > 0 && itemReturnExchanges.map((record, index) => {
														if (record.operationType === 'SIGN') {
															// 签收记录不显示为内联行
															return null;
														}

														return (
															<tr key={`${item.id}}`} className="bg-red-50">
																<td colSpan={2} className="py-1 text-center border-b">
																	<span className="text-xs font-medium text-red-600">
																		{record.operationType === 'RETURN' ? '退货' : '换货'}: {record.reason}
																	</span>
																</td>
																<td className="text-center py-1 border-b" colSpan={shouldDisplayActualQuantity(orderDetail.orderStatus as OrderStatus) ? 2 : 1}>
																	<span className="text-xs font-mono font-medium text-red-600">
																		-{record.quantity}
																	</span>
																</td>
																<td className="text-center py-1 border-b">
																	<span className="text-xs font-mono text-red-600">{record.unit}</span>
																</td>
																<td className="text-right py-1 border-b" colSpan={4}>
																	<span className="text-xs font-mono font-medium text-red-600">
																		{record.operationType === 'RETURN'
																			? `-¥${(parseFloat(item.actualPrice) * record.quantity).toFixed(2)}`
																			: ''
																		}
																	</span>
																</td>
																{shouldDisplayOrderStatus(orderDetail.orderStatus as OrderStatus) && (
																	<td className="py-1 border-b"></td>
																)}
															</tr>
														);
													})}
												</Fragment>
											);
										})}
									</tbody>
								</table>
							</div>

							<div className="mt-6 flex flex-col items-end">
								<div className="w-full max-w-xs space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-gray-500">原价:</span>
										<span className="font-mono font-semibold">¥{isEditing
											? orderItems.reduce((acc, item) => acc + parseFloat(item.price) * parseFloat(item.actualQuantity), 0).toFixed(2)
											: parseFloat(orderDetail.totalAmount).toFixed(2)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-500">折扣金额:</span>
										<span className="font-mono font-semibold text-red-500">¥{isEditing
											? (orderItems.reduce((acc, item) => acc + parseFloat(item.price) * parseFloat(item.actualQuantity), 0) -
												orderItems.reduce((acc, item) => acc + parseFloat(item.actualPrice) * parseFloat(item.actualQuantity), 0)).toFixed(2)
											: parseFloat(orderDetail.discountAmount || "0").toFixed(2)}</span>
									</div>
									{shouldDisplayReturnMoney() && (
										<div className="flex justify-between text-sm">
											<span className="text-gray-500">退货金额:</span>
											<span className="font-mono font-semibold text-red-500">¥{returnMoney()}</span>
										</div>
									)}
									<Separator />
									<div className="flex justify-between">
										<span>{isEditing ? "实际金额:" : "实付金额:"}</span>
										<span className="font-mono font-semibold">
											¥{isEditing
												? orderItems.reduce((acc, item) => acc + parseFloat(item.actualPrice) * parseFloat(item.actualQuantity), 0).toFixed(2)
												: orderDetail.actualAmount}
										</span>
									</div>
								</div>
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
			</div>

			{/* 退换货操作对话框 */}
			<Dialog
				open={showOperationDialog}
				onOpenChange={(open) => {
					setShowOperationDialog(open);
					// 如果对话框关闭，清除状态，防止事件处理问题
					if (!open) {
						setTimeout(() => {
							setOperatingProductId(0);
							setOperationType(null);
							setOperatingQuantity("0");
							setOperatingReason("");
							setUseFullQuantity(false);
							setQuantityError("");
							setReasonError("");
							setShowConfirmDialog(false);
						}, 100);
					}
				}}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="text-sm font-semibold">
							{operationType === 'RETURN' ? '商品退货' :
								operationType === 'EXCHANGE' ? '商品换货' : '商品签收'}:
							{orderItems.find(item => item.id === operatingProductId)?.name}
						</DialogTitle>
						<DialogDescription className="text-xs">
							请填写{operationType === 'RETURN' ? '退货' :
								operationType === 'EXCHANGE' ? '换货' : '签收'}信息
							{getItemReturnExchangeRecords(operatingProductId).length > 0 && (
								<>
									<span className="block mt-1 text-red-500 text-xs font-mono">注意：此操作将覆盖该商品之前的退换货记录</span>
									{getItemReturnExchangeRecords(operatingProductId).map((record, index) => (
										<span key={index} className="block mt-1 text-xs text-gray-500">
											之前记录: {record.operationType === 'RETURN' ? '退货' :
												record.operationType === 'EXCHANGE' ? '换货' : '签收'} {record.quantity} {record.unit}
										</span>
									))}
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="quantity" className="col-span-4 text-sm">
								{operationType === 'RETURN' ? '退货' :
									operationType === 'EXCHANGE' ? '换货' : '签收'}数量 ({orderItems.find(item => item.id === operatingProductId)?.unit || ''})
							</Label>
							<div className="col-span-4 flex items-center space-x-2">
								<Input
									id="quantity"
									type="number"
									value={operatingQuantity}
									onChange={(e) => handleQuantityChange(e.target.value)}
									className={`flex-grow font-mono ${operationType !== 'SIGN' ? 'text-red-600' : ''} ${quantityError ? 'border-red-500' : ''}`}
									step="0.1"
									min="0"
								/>
								{/* <span className="text-sm font-medium">
									{orderItems.find(item => item.id === operatingProductId)?.unit || ''}
								</span> */}
							</div>
							{quantityError && (
								<p className="text-xs text-red-500 col-span-4">{quantityError}</p>
							)}
							<div className="flex items-center space-x-2 col-span-4">
								<Checkbox
									id="useFullQuantity"
									checked={useFullQuantity}
									onCheckedChange={(checked) => handleUseFullQuantity(checked === true)}
								/>
								<label
									htmlFor="useFullQuantity"
									className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>全选
									{/* 全选 ({orderItems.find(item => item.id === operatingProductId)?.actualQuantity || '0'} {orderItems.find(item => item.id === operatingProductId)?.unit || ''}) */}
								</label>
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="reason" className="col-span-4">
								{operationType === 'RETURN' ? '退货' :
									operationType === 'EXCHANGE' ? '换货' : '签收'}原因
								{operationType === 'SIGN' && <span className="text-xs text-gray-500 ml-1">(可选)</span>}
							</Label>
							<Textarea
								id="reason"
								value={operatingReason}
								onChange={(e) => handleReasonChange(e.target.value)}
								placeholder={operationType === 'SIGN' ?
									"请填写签收备注（可选）..." :
									"请填写详细原因，不少于8个字..."}
								className={`col-span-4 resize-none ${reasonError ? 'border-red-500' : ''}`}
								maxLength={255}
							/>
							{reasonError && (
								<p className="text-xs text-red-500 col-span-4">{reasonError}</p>
							)}
							<div className="text-xs text-right text-gray-500 col-span-4">
								{operatingReason.length}/255 {operationType !== 'SIGN' && operatingReason.length < 8 ? `(至少需要8个字)` : ''}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" size="sm" onClick={() => setShowOperationDialog(false)}>
							取消
						</Button>
						<Button
							size="sm"
							onClick={handleSubmitOperation}
							disabled={!!quantityError || operatingQuantity === "0" ||
								(operationType !== 'SIGN' && (!!reasonError || operatingReason.length < 8))}
						>
							确定
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 退换货确认对话框 */}
			<AlertDialog
				open={showConfirmDialog}
				onOpenChange={(open) => {
					setShowConfirmDialog(open);
					if (!open) {
						setTimeout(() => {
						}, 100);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-sm font-semibold">确认{operationType === 'RETURN' ? '退货' :
							operationType === 'EXCHANGE' ? '换货' : '签收'}</AlertDialogTitle>
						<AlertDialogDescription className="text-xs">
							{operationType === 'SIGN' ? (
								<span>您确定要签收商品吗？签收后将确认商品已收到并检查无误。</span>
							) : (
								<span>您确定要提交以下{operationType === 'RETURN' ? '退货' : '换货'}信息吗？</span>
							)}
							{getItemReturnExchangeRecords(operatingProductId).length > 0 && (
								<>
									<span className="block mt-1 text-red-500 font-medium">此操作将覆盖该商品之前的退换货记录</span>
									{getItemReturnExchangeRecords(operatingProductId).map((record, index) => (
										<span key={index} className="block mt-1 p-2 bg-gray-100 rounded-sm text-xs">
											<span className="block">之前的操作: {record.operationType === 'RETURN' ? '退货' :
												record.operationType === 'EXCHANGE' ? '换货' : '签收'}</span>
											<span className="block mt-1 font-mono">数量: {record.quantity} {record.unit}</span>
											<span className="block mt-1">原因: {record.reason}</span>
										</span>
									))}
								</>
							)}
						</AlertDialogDescription>
						<div className="mt-4 space-y-1 text-sm text-muted-foreground">
							<Separator />
							<p className="text-xs">商品名称: <span className="font-semibold text-gray-800 ml-2">{orderItems.find(item => item.id === operatingProductId)?.name}</span></p>
							{operationType === 'SIGN' ? (
								<p className="text-xs">收货数量: <span className="font-mono font-semibold text-gray-800 ml-2">{orderItems.find(item => item.id === operatingProductId)?.actualQuantity}({orderItems.find(item => item.id === operatingProductId)?.unit})</span> </p>
							) : (
								<>
									<p className="text-xs">{operationType === 'RETURN' ? '退货' : '换货'}数量: <span className="font-mono font-semibold text-gray-800 ml-2">{operatingQuantity} {orderItems.find(item => item.id === operatingProductId)?.unit}</span></p>
									<p className="text-xs">{operationType === 'RETURN' ? '退货' : '换货'}原因: <span className="font-semibold text-gray-800 ml-2">{operatingReason || '无'}</span></p>
								</>
							)}
							<Separator />
						</div>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="text-xs">取消</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmOperation} className="text-xs">
							确认
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

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
						<AlertDialogTitle className="text-sm font-semibold">{orderDetail.orderStatus === "AFTER_SALE" ? "确认拒绝供应商售后服务?" : "确认完成订单?"}</AlertDialogTitle>
						<AlertDialogDescription className="text-xs">
							{orderDetail.orderStatus === "AFTER_SALE" ? "拒绝供应商售后服务，市场将在2小时内处理客户的售后申请。" : ""}
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