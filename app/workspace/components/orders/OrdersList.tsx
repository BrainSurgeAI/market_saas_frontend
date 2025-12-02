"use client";

import { useRouter } from "next/navigation";
import { format, differenceInSeconds } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
import { useEffect, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface OrdersListProps {
	org_id: string;
	redirectUrl: string;
	userType: 'CUSTOMER' | 'PROVIDER' | 'MARKET';
}


export default function OrdersList({ org_id, redirectUrl, userType }: OrdersListProps) {
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
	const updateOrder = useCallback((orderCode: string, updates: Partial<OrderOverview>) => {
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
	}, []);

	// 获取表头配置
	const getTableHeaders = () => {
		const commonHeaders = [
			{ key: 'created', label: '创建日期', width: '1fr' },
			{ key: 'orderCode', label: '订单编号', width: '2fr' },
			{ key: 'orderAmount', label: '订购金额', width: '1fr' },
			{ key: 'settlementAmount', label: '结算金额', width: '1fr' },
			{ key: 'deliveryDate', label: '配送日期', width: '1.2fr' },
			{ key: 'status', label: '状态', width: '1.5fr' },
		];

		if (userType === 'CUSTOMER') {
			commonHeaders.push({ key: 'carrier', label: '联系人', width: '1fr' });
		} else if (userType === 'PROVIDER') {
			commonHeaders.push({ key: 'deliveryAddress', label: '联系人', width: '1.5fr' });
		} else {
			commonHeaders.push({ key: 'deliveryAddress', label: '配送人', width: '1.5fr' });
		}

		commonHeaders.push({ key: 'actions', label: '', width: 'auto' });
		return commonHeaders;
	};

	return (
		<div className="space-y-4">
			<Card className="bg-transparent border-none shadow-none">
				<CardHeader className="px-0 pt-0">
					<CardTitle></CardTitle>
					{/* 添加搜索框和状态筛选下拉菜单 */}
					{/* 移动端布局 */}
					<div className="block md:hidden space-y-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
							<Input
								type="search"
								placeholder="Search orders..."
								className="pl-9 h-10 text-sm bg-gray-50/50 border-gray-200 focus:bg-white transition-colors rounded-lg"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-10 w-full bg-gray-50/50 border-gray-200 focus:bg-white transition-colors rounded-lg text-sm">
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{statusOptions.map((option) => (
										<SelectItem key={option.value} value={option.value} className="text-sm py-3">
											{option.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					{/* 桌面端布局 */}
					<div className="hidden md:flex items-center justify-between bg-white rounded-xl p-2 border border-gray-100 shadow-sm">
						<div className="relative flex-1 max-w-md">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
							<Input
								type="search"
								placeholder="Search by order ID..."
								className="pl-9 h-10 text-sm border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<div className="flex items-center gap-3">
							<div className="h-6 w-px bg-gray-200 mx-2"></div>
							<div className="flex items-center gap-2 mr-2">
								<span className="text-sm text-gray-500 font-medium">Filter by:</span>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="h-9 w-[140px] border-none bg-gray-50/50 hover:bg-gray-100 focus:ring-0 rounded-lg text-xs font-medium text-gray-500">
										<SelectValue placeholder="Status" />
									</SelectTrigger>
									<SelectContent align="end" className="w-[200px]">
										<SelectGroup>
											{statusOptions.map((option) => (
												<SelectItem key={option.value} value={option.value} className="text-xs cursor-pointer py-2.5">
													{option.label}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent className="px-0">
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
							<div className="space-y-4">
								{/* Header Row - Desktop only */}
								<div className={`hidden md:grid gap-4 px-6 py-3 text-xs font-semibold text-gray-400 bg-white rounded-t-xl border-b ${userType === 'CUSTOMER' ? 'md:grid-cols-[1fr_2fr_1fr_1fr_1.2fr_1.5fr_1fr_auto]' : 'md:grid-cols-[1fr_2fr_1fr_1fr_1.5fr_1.5fr_1.5fr_auto]'}`}>
									{getTableHeaders().map((header, index) => (
										<div key={header.key} className={`
											${index === 2 || index === 3 ? 'text-right' : 'text-left'}
											${index === 4 ? 'text-center' : 'text-left'}
										`}>
											{header.label}
										</div>
									))}
								</div>

								{filteredOrders.map((order) => (
									<div key={order.orderCode} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
										{/* Main Content */}
										<div className={`grid grid-cols-1 gap-4 p-6 items-start md:items-center ${userType === 'CUSTOMER' ? 'md:grid-cols-[1fr_2fr_1fr_1fr_1.2fr_1.5fr_1fr_auto]' : 'md:grid-cols-[1fr_2fr_1fr_1fr_1.2fr_1.5fr_1.5fr_auto]'}`}>
											{/* 创建日期 */}
											<div className="md:block flex justify-between items-center md:justify-start">
												<span className="md:hidden text-xs font-semibold text-gray-500">创建日期</span>
												<div className="md:text-left">
													<div className="font-medium text-sm text-gray-500">{format(new Date(order.createdAt), "M月d日", { locale: zhCN })}</div>
													<div className="text-xs text-gray-500">{format(new Date(order.createdAt), "HH:mm", { locale: zhCN })}</div>
												</div>
											</div>

											{/* 订单编号 */}
											<div className="md:block flex justify-between items-center md:justify-start">
												<span className="md:hidden text-xs font-semibold text-gray-500">订单编号</span>
												<div className="md:text-left">
													<div className="font-medium font-mono text-sm text-gray-900 max-w-[250px]" title={order.orderCode}>{order.orderCode}</div>
												</div>
											</div>

											{/* 订购金额 */}
											<div className="md:block flex justify-between items-center md:justify-end">
												<span className="md:hidden text-xs font-semibold text-gray-500">订购金额</span>
												<div className="font-medium text-sm font-mono text-gray-900 md:text-right">¥{order.totalAmount}</div>
											</div>

											{/* 结算金额 */}
											<div className="md:block flex justify-between items-center md:justify-end">
												<span className="md:hidden text-xs font-semibold text-gray-500">结算金额</span>
												<div className="font-medium text-sm font-mono text-gray-900 md:text-right">¥{order.actualAmount}</div>
											</div>

											{/* 配送日期 */}
											<div className="md:block flex justify-between items-center md:justify-start md:pl-4">
												<span className="md:hidden text-xs font-semibold text-gray-500">配送日期</span>
												<div className="md:text-center">
													<div className="font-medium text-sm text-gray-500">{format(new Date(order.deliveryDate), "M月d日", { locale: zhCN })}</div>
												</div>
											</div>

											{/* 状态 */}
											<div className="md:block flex justify-between items-center md:justify-start">
												<span className="md:hidden text-xs font-semibold text-gray-500">状态</span>
												<Badge
													variant="outline"
													className={`
														rounded-md px-3 py-1 text-xs font-normal border-0
														${order.orderStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
													`}
												>
													{translateOrderStatus(order.orderStatus)}
												</Badge>
											</div>

											{/* 根据用户类型显示不同字段 */}
											{userType === 'CUSTOMER' ? (
												/* 承运人 */
												<div className="md:block flex justify-between items-center md:justify-start">
													<span className="md:hidden text-xs font-semibold text-gray-500">联系人</span>
													<div className="text-center">
														<div className="font-medium text-xs text-gray-500">{order.marketContactorName || '-'}</div>
														<div className="text-xs text-gray-500">{order.marketContactNumber || '-'}</div>
													</div>
												</div>
											) : userType === 'PROVIDER' ? (
												/* 配送地址 */
												<div className="md:block flex justify-between items-center md:justify-start">
													<span className="md:hidden text-xs font-semibold text-gray-500">交付信息</span>
													<div className="text-center">
														<div className="font-medium text-xs text-gray-500">{ order.marketContactorName }</div>
														<div className="text-xs text-gray-500">{ order.marketContactNumber }</div>
													</div>
												</div>
											) : (
												/* 配送人 */
												<div className="md:block flex justify-between items-center md:justify-start">
													<span className="md:hidden text-xs font-semibold text-gray-500">配送人</span>
													<div className="text-center">
														<div className="font-medium text-xs text-gray-500">{order.shipperName || '-'}</div>
														<div className="text-xs text-gray-500">{order.shipperPhone || '-'}</div>
													</div>
												</div>
											)}

											{/* 操作 */}
											<div className="flex justify-end items-center gap-2">
												<Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600" onClick={() => handleOrderClick(order.orderCode)}>
													<Eye className="h-4 w-4" />
												</Button>
											</div>
										</div>

										{/* Footer Status Bar */}
										<div className="px-6 py-4 border-t bg-gray-50/30 flex flex-wrap items-center gap-6 text-sm">
											<span className="text-gray-400 font-medium mr-2">Status:</span>

											{/* Simplified Status Flow */}
											<div className="flex items-center gap-2 text-xs">
												{['PENDING', 'SUPPLIER_PREPARING', 'MARKET_INSPECTING', 'COMPLETED'].includes(order.orderStatus) ? (
													<div className="flex items-center gap-2">
														<div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center">
															<div className="w-1.5 h-1.5 bg-white rounded-full"></div>
														</div>
														<span className="font-medium text-xs text-gray-900">{translateOrderStatus(order.orderStatus)}</span>
													</div>
												) : (
													<div className="flex items-center gap-2 text-xs text-gray-400">
														<div className="w-4 h-4 rounded-full border border-gray-300"></div>
														<span className="text-xs">{translateOrderStatus(order.orderStatus)}</span>
													</div>
												)}
											</div>

											{/* Other statuses as greyed out placeholders to mimic the design */}
											{['Returned', 'Cancelled'].map(s => (
												<div key={s} className="flex items-center gap-2 text-gray-400">
													<div className="w-4 h-4 rounded-full border border-gray-300"></div>
													<span>{s}</span>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
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