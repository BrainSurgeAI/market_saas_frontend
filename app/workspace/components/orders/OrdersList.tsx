"use client";

import { useRouter } from "next/navigation";
import { format, differenceInSeconds } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { OrderOverview } from "@/app/workspace/types";
import { getStatusVariant, translateOrderStatus } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { Provider } from "@/app/workspace/markets/[market_id]/orders/page";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface OrdersListProps {
	org_id: string;
	redirectUrl: string;
	providers?: Provider[];
	handleAssignClick?: (orderCode: string, event: React.MouseEvent) => void;
}


export default function OrdersList({ org_id, redirectUrl, providers, handleAssignClick }: OrdersListProps) {
	const router = useRouter();

	// 分页相关状态
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [orders, setOrders] = useState<OrderOverview[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	// 添加已指派订单的跟踪
	const [assignedOrders, setAssignedOrders] = useState<Set<string>>(new Set());
	
	// 添加搜索状态
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredOrders, setFilteredOrders] = useState<OrderOverview[]>([]);
	// 添加状态筛选
	const [statusFilter, setStatusFilter] = useState<string>("ALL");
	
	// 添加倒计时状态
	const [countdowns, setCountdowns] = useState<Record<string, string>>({});
	// 添加鼠标悬停状态
	const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
	// 倒计时定时器引用
	const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

	// 订单状态选项
	const statusOptions = [
		{ value: "ALL", label: "全部状态" },
		{ value: "PENDING", label: "待指派" },
		{ value: "ASSIGNED", label: "已指派" },
		{ value: "SUPPLIER_PREPARING", label: "备货中" },
		{ value: "SUPPLIER_DELIVERING", label: "供应商正在交付" },
		{ value: "MARKET_INSPECTING", label: "市场验收中" },
		{ value: "CUSTOMER_INSPECTING", label: "客户验收中" },
		{ value: "COMPLETED", label: "已完成" },
		{ value: "MARKET_ACCEPTED", label: "市场已验收" },
		{ value: "MARKET_DELIVERING", label: "市场正在交付" },
		{ value: "EXCHANGE_REQUESTED", label: "申请换货" },
		{ value: "CUSTOMER_DELIVERING", label: "客户正在交付" },
		{ value: "EXCHANGE_IN_PROGRESS", label: "处理换货中" },
		{ value: "EXCHANGE_DELIVERING", label: "换货交付中" },
		{ value: "EXCHANGE_INSPECTING", label: "换货验收中" },

		{ value: "EXCHANGE_NEW_DELIVERING", label: "新商品交付中" },
		{ value: "CANCELLED", label: "已取消" },
		{ value: "RETURN_REQUESTED", label: "申请退货" },
	];

	// 计算售后订单剩余处理时间（精确到秒）
	const calculateAfterSaleRemainingTime = (afterSaleAt: string | null): string => {
		if (!afterSaleAt) return "";
		
		const now = new Date();
		const afterSaleDate = new Date(afterSaleAt);
		// 售后处理时间为120分钟（7200秒）
		const totalSeconds = 120 * 60;
		
		// 计算已经过去的秒数
		const elapsedSeconds = differenceInSeconds(now, afterSaleDate);
		// 计算剩余秒数
		const remainingSeconds = totalSeconds - elapsedSeconds;
		
		if (remainingSeconds <= 0) {
			return "已超时";
		}
		
		// 计算小时、分钟和秒
		const hours = Math.floor(remainingSeconds / 3600);
		const minutes = Math.floor((remainingSeconds % 3600) / 60);
		const seconds = remainingSeconds % 60;
		
		if (hours > 0) {
			return `${hours}小时${minutes}分钟${seconds}秒`;
		} else if (minutes > 0) {
			return `${minutes}分钟${seconds}秒`;
		} else {
			return `${seconds}秒`;
		}
	};
	
	// 当鼠标悬停在Badge上时，启动倒计时更新
	const handleTooltipOpen = (orderCode: string, afterSaleAt: string | null) => {
		setActiveTooltip(orderCode);
		
		// 立即更新一次倒计时
		if (afterSaleAt) {
			const countdown = calculateAfterSaleRemainingTime(afterSaleAt);
			setCountdowns(prev => ({
				...prev,
				[orderCode]: countdown
			}));
			
			// 启动定时器，每秒更新一次倒计时
			if (countdownTimerRef.current) {
				clearInterval(countdownTimerRef.current);
			}
			
			countdownTimerRef.current = setInterval(() => {
				const updatedCountdown = calculateAfterSaleRemainingTime(afterSaleAt);
				setCountdowns(prev => ({
					...prev,
					[orderCode]: updatedCountdown
				}));
			}, 1000);
		}
	};
	
	// 当鼠标离开Badge时，停止倒计时更新
	const handleTooltipClose = () => {
		setActiveTooltip(null);
		
		// 清除定时器
		if (countdownTimerRef.current) {
			clearInterval(countdownTimerRef.current);
			countdownTimerRef.current = null;
		}
	};
	
	// 组件卸载时清除定时器
	useEffect(() => {
		return () => {
			if (countdownTimerRef.current) {
				clearInterval(countdownTimerRef.current);
			}
		};
	}, []);

	useEffect(() => {
		const fetchOrders = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch(`/api/customers/${org_id}/orders?page=${currentPage}&page_size=${pageSize}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					cache: 'no-store'
				});
				if (!response.ok) {
					throw new Error(`请求失败: ${response.status}`);
				}

				const responseData = await response.json();
				let ordersData: OrderOverview[] = [];

				if (Array.isArray(responseData)) {
					ordersData = responseData;
					setOrders(responseData);
					setTotalPages(responseData.length === pageSize ? currentPage + 1 : currentPage);
				} else if (responseData.data) {
					ordersData = responseData.data || [];
					setOrders(ordersData);
					if (responseData.pagination) {
						setTotalPages(responseData.pagination.total_pages || 1);
					} else {
						setTotalPages(ordersData.length === pageSize ? currentPage + 1 : currentPage);
					}
				} else {
					setOrders([]);
					setTotalPages(1);
				}

				// 初始化过滤后的订单列表
				setFilteredOrders(ordersData);

			} catch (err) {
				setError(err instanceof Error ? err.message : "获取订单列表时出错");
			} finally {
				setLoading(false);
			}
		};

		fetchOrders();
	}, [org_id, currentPage, pageSize]);

	// 修改搜索过滤功能，加入状态筛选
	useEffect(() => {
		let filtered = orders;
		
		// 先按状态筛选
		if (statusFilter !== "ALL") {
			filtered = filtered.filter(order => order.orderStatus === statusFilter);
		}
		
		// 再按订单编号搜索
		if (searchQuery.trim() !== "") {
			filtered = filtered.filter(order => 
				order.orderCode.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}
		
		setFilteredOrders(filtered);
	}, [searchQuery, orders, statusFilter]);

	const handleOrderClick = (orderCode: string) => {
		router.push(`${redirectUrl}/${orderCode}`);
	};

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	// 生成页码按钮
	const generatePaginationItems = () => {
		const items = [];
		const maxVisiblePages = 5; // 最多显示的页码数

		let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

		// 调整起始页，确保显示足够多的页码
		if (endPage - startPage + 1 < maxVisiblePages) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1);
		}

		// 添加第一页
		if (startPage > 1) {
			items.push(
				<PaginationItem key="first">
					<PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
				</PaginationItem>
			);

			// 添加省略号
			if (startPage > 2) {
				items.push(
					<PaginationItem key="ellipsis-start">
						<PaginationEllipsis />
					</PaginationItem>
				);
			}
		}

		// 添加页码
		for (let i = startPage; i <= endPage; i++) {
			items.push(
				<PaginationItem key={i}>
					<PaginationLink className="text-xs"
						isActive={i === currentPage}
						onClick={() => handlePageChange(i)}
					>
						{i}
					</PaginationLink>
				</PaginationItem>
			);
		}

		// 添加最后一页
		if (endPage < totalPages) {
			// 添加省略号
			if (endPage < totalPages - 1) {
				items.push(
					<PaginationItem key="ellipsis-end">
						<PaginationEllipsis />
					</PaginationItem>
				);
			}

			items.push(
				<PaginationItem key="last">
					<PaginationLink onClick={() => handlePageChange(totalPages)}>
						{totalPages}
					</PaginationLink>
				</PaginationItem>
			);
		}

		return items;
	};

	// 添加更新订单的方法
	const updateOrder = (orderCode: string, updates: Partial<OrderOverview>) => {
		setOrders(prevOrders =>
			prevOrders.map(order =>
				order.orderCode === orderCode
					? { ...order, ...updates }
					: order
			)
		);

		// 如果更新了assignedTo字段，则添加到已指派订单集合中
		if (updates.assignedTo) {
			setAssignedOrders(prev => {
				const newSet = new Set(prev);
				newSet.add(orderCode);
				return newSet;
			});
		}
	};

	// 处理点击指派按钮的逻辑
	const handleAssignButtonClick = (orderCode: string, e: React.MouseEvent) => {
		// 阻止事件冒泡，防止触发行点击事件
		e.stopPropagation();

		// 调用父组件提供的handleAssignClick函数
		if (handleAssignClick) {
			handleAssignClick(orderCode, e);

			// 在本地标记该订单已被指派，立即隐藏按钮
			setAssignedOrders(prev => {
				const newSet = new Set(prev);
				newSet.add(orderCode);
				return newSet;
			});
		}
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle></CardTitle>
					{/* 添加搜索框和状态筛选下拉菜单 */}
					<div className="flex items-center space-x-2">
						<div className="relative flex-1">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
							<Input
								type="search"
								placeholder="搜索订单编号..."
								className="pl-8 text-xs"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<div className="w-[180px]">
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="text-sm">
									<SelectValue placeholder="筛选订单状态" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{statusOptions.map((option) => (
											<SelectItem key={option.value} value={option.value} className="text-sm">
												{option.label}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex justify-center py-8">
							<p className="text-sm text-gray-500">正在加载订单数据...</p>
						</div>
					) : error ? (
						<div className="flex justify-center py-8">
							<p className="text-sm text-red-500">{error}</p>
						</div>
					) : !filteredOrders || filteredOrders.length === 0 ? (
						<div className="flex justify-center py-8">
							<p className="text-sm text-gray-500">
								{searchQuery.trim() !== "" || statusFilter !== "ALL" ? "没有找到匹配的订单" : "暂无订单数据"}
							</p>
						</div>
					) : (
						<>
							<Table>
								<TableHeader className="text-xs font-semibold bg-gray-100 text-gray-900">
									<TableRow>
										<TableHead className="w-[250px]">#订单编号</TableHead>
										<TableHead>送货地址</TableHead>
										<TableHead>送货日期</TableHead>
										<TableHead>状态</TableHead>
										<TableHead className="text-left">金额(元)</TableHead>
										{providers && providers.length > 0 && (
											<TableHead className="text-right">操作</TableHead>
										)}
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredOrders.map((order) => (
										<TableRow
											key={order.orderCode}
											className="cursor-pointer hover:bg-gray-50 text-xs"
											onClick={() => handleOrderClick(order.orderCode)}>
											<TableCell className="font-mono">#{order.orderCode}</TableCell>
											<TableCell className="max-w-[200px] truncate" title={order.deliveryAddress}>
												{order.deliveryAddress.length > 15 ? `${order.deliveryAddress.slice(0, 30)}...` : order.deliveryAddress}
											</TableCell>
											<TableCell>
												{format(new Date(order.deliveryDate), "yyyy年MM月dd日")}
											</TableCell>
											<TableCell>
												{order.orderStatus === "EXCHANGE_REQUESTED" && order.afterSaleAt ? (
													<TooltipProvider>
														<Tooltip 
															onOpenChange={(open) => {
																if (open && order.afterSaleAt) {
																	handleTooltipOpen(order.orderCode, order.afterSaleAt);
																} else {
																	handleTooltipClose();
																}
															}}
														>
															<TooltipTrigger asChild>
																<div>
																	<Badge variant={getStatusVariant(order.orderStatus)} className="rounded-full">
																		{translateOrderStatus(order.orderStatus)}
																	</Badge>
																</div>
															</TooltipTrigger>
															<TooltipContent className="bg-gray-800 text-white text-xs px-3 py-1">
																<p>
																	处理剩余时间: {countdowns[order.orderCode] || (order.afterSaleAt && calculateAfterSaleRemainingTime(order.afterSaleAt))}
																</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												) : (
													<Badge variant={getStatusVariant(order.orderStatus)} className="rounded-full">
														{translateOrderStatus(order.orderStatus)}
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-left font-mono">
												￥{order.actualAmount}
											</TableCell>
											{providers && providers.length > 0 && (
												<TableCell className="text-right">
													{order.orderStatus === "PENDING" && !order.assignedTo && !assignedOrders.has(order.orderCode) && (
														<Button size="sm" variant="outline" onClick={(e) => handleAssignButtonClick(order.orderCode, e)}>
															指派
														</Button>
													)}
												</TableCell>
											)}
										</TableRow>
									))}
								</TableBody>
							</Table>
							<div className="mt-6">
								<Pagination>
									<PaginationContent>
										<PaginationItem>
											<PaginationPrevious
												onClick={() => handlePageChange(currentPage - 1)}
												className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
											/>
										</PaginationItem>

										{generatePaginationItems()}

										<PaginationItem>
											<PaginationNext
												onClick={() => handlePageChange(currentPage + 1)}
												className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
											/>
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
} 