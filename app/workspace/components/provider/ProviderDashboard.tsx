"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { OrderOverview } from "@/app/workspace/types";
import { translateOrderStatus, getStatusVariant } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  MapPin,
  ArrowUpRight,
  CalendarDays as CalendarIcon,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { NotificationsCard } from "@/app/workspace/components/NotificationsCard";


// --- Types ---

interface DashboardStats {
  pendingDeliveryOrders: number;
  deliveringOrders: number;
  completedOrders: number;
  returnExchangeTasks: number;
  pendingStockSkus: number;
  acceptedSkusQty: number;
}

interface DashboardStatsResponse {
  code: number;
  message: string;
  data: DashboardStats;
  requestId: string;
  timestamp: string;
}

interface TodayDeliveredProductItem {
  orderDetailId: number;
  productCode: string;
  productName: string;
  categoryName: string;
  unit: string;
  totalActualQty: string;
}

interface TodayDeliveredProductsResponse {
  code: number;
  message: string;
  data: TodayDeliveredProductItem[];
  requestId: string;
  timestamp: string;
}

interface ReturnExchangeOrderItem {
  productCode: string;
  productName: string;
  weight: string;
  operationType: "EXCHANGE" | "RETURN";
  status: string;
  deliveredQty: string;
  reason: string;
  evidenceImages: string[] | null;
}

interface ReturnExchangeOrder {
  orderCode: string;
  totalSkuCount: number;
  createdAt: string;
  orderStatus: string;
  items: ReturnExchangeOrderItem[];
}

interface ReturnExchangeOrdersResponse {
  code: number;
  message: string;
  data: ReturnExchangeOrder[];
  requestId: string;
  timestamp: string;
}

const deliveryProgressData = {
  round1: {
    delivered: 12,
    pending: 8,
    arrived: 15,
  },
  round2: {
    pending: 3,
    completed: 2,
  }
};


export default function ProviderDashboard() {
  const router = useRouter();
  const { organization } = useWorkspace();
  const currentDate = new Date().toLocaleDateString("zh-CN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    pendingDeliveryOrders: 0,
    deliveringOrders: 0,
    completedOrders: 0,
    returnExchangeTasks: 0,
    pendingStockSkus: 0,
    acceptedSkusQty: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayOrders, setTodayOrders] = useState<OrderOverview[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [stockData, setStockData] = useState<TodayDeliveredProductItem[]>([]);
  const [stockLoading, setStockLoading] = useState(true);
  const [stockError, setStockError] = useState<string | null>(null);
  const [returnExchangeOrders, setReturnExchangeOrders] = useState<ReturnExchangeOrder[]>([]);
  const [returnExchangeLoading, setReturnExchangeLoading] = useState(true);
  const [returnExchangeError, setReturnExchangeError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // 获取当日日期，格式为 YYYY-MM-DD
        const today = format(new Date(), 'yyyy-MM-dd');
        const response = await fetch(`/api/orders/dashboard-stats?deliveryDate=${today}`);
        const result: DashboardStatsResponse = await response.json();

        if (result.code === 200 && result.data) {
          setDashboardStats(result.data);
        } else {
          setError(result.message || '获取统计数据失败');
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('获取统计数据时发生错误');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  useEffect(() => {
    const fetchTodayOrders = async () => {
      if (!organization?.id) {
        return;
      }

      try {
        setOrdersLoading(true);
        setOrdersError(null);
        const response = await fetch(`/api/providers/${organization.id}/orders?page=1&page_size=10`);

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status}`);
        }

        const ordersData: OrderOverview[] = await response.json();

        // 过滤今日订单（根据 deliveryDate）
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrdersList = ordersData.filter(order => {
          if (!order.deliveryDate) return false;
          const deliveryDate = new Date(order.deliveryDate);
          deliveryDate.setHours(0, 0, 0, 0);
          return deliveryDate.getTime() === today.getTime();
        });

        setTodayOrders(todayOrdersList);
      } catch (err) {
        console.error('Error fetching today orders:', err);
        setOrdersError(err instanceof Error ? err.message : '获取今日订单失败');
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchTodayOrders();
  }, [organization?.id]);

  useEffect(() => {
    const fetchTodayDeliveredProducts = async () => {
      try {
        setStockLoading(true);
        setStockError(null);
        // 获取当日日期，格式为 YYYY-MM-DD
        const today = format(new Date(), 'yyyy-MM-dd');
        const response = await fetch(`/api/orders/preparation-summary?deliveryDate=${today}`);
        const result: TodayDeliveredProductsResponse = await response.json();

        if (result.code === 200 && result.data) {
          // 直接使用返回的数据，按产品名称排序
          const sortedData = [...result.data].sort((a, b) =>
            a.productName.localeCompare(b.productName, 'zh-CN')
          );

          setStockData(sortedData);
        } else {
          setStockError(result.message || '获取今日已配送商品数据失败');
        }
      } catch (err) {
        console.error('Error fetching today delivered products:', err);
        setStockError('获取今日已配送商品数据时发生错误');
      } finally {
        setStockLoading(false);
      }
    };

    fetchTodayDeliveredProducts();
  }, []);

  useEffect(() => {
    const fetchReturnExchangeOrders = async () => {
      try {
        setReturnExchangeLoading(true);
        setReturnExchangeError(null);
        const response = await fetch(`/api/orders/return-exchange-orders`);
        const result: ReturnExchangeOrdersResponse = await response.json();

        if (result.code === 200 && result.data) {
          setReturnExchangeOrders(result.data);
        } else {
          setReturnExchangeError(result.message || '获取退换货订单数据失败');
        }
      } catch (err) {
        console.error('Error fetching return exchange orders:', err);
        setReturnExchangeError('获取退换货订单数据时发生错误');
      } finally {
        setReturnExchangeLoading(false);
      }
    };

    fetchReturnExchangeOrders();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ASSIGNED":
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "SUPPLIER_DELIVERING":
      case "MARKET_DELIVERING":
      case "EXCHANGE_DELIVERING":
      case "EXCHANGE_NEW_DELIVERING":
        return <Truck className="w-4 h-4" />;
      case "COMPLETED":
      case "EXCHANGE_COMPLETED":
        return <CheckCircle2 className="w-4 h-4" />;
      case "SUPPLIER_PREPARING":
      case "EXCHANGE_IN_PROGRESS":
        return <Package className="w-4 h-4" />;
      case "MARKET_INSPECTING":
      case "CUSTOMER_INSPECTING":
      case "EXCHANGE_INSPECTING":
        return <Eye className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
      case "PENDING": return "bg-slate-50 text-slate-700 border-slate-200";
      case "DELIVERING":
      case "SUPPLIER_DELIVERING": return "bg-blue-50 text-blue-700 border-blue-200";
      case "COMPLETED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SUPPLIER_PREPARING": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };


  const formatDeliveryDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  const getReturnExchangeStatusDisplay = (status: string, orderStatus: string): { text: string; color: string } => {
    // 优先使用订单状态，如果没有则使用 item 状态
    const displayStatus = orderStatus || status;
    
    switch (displayStatus) {
      case "PROGRESSED":
        return { text: "处理中", color: "bg-blue-50 text-blue-700" };
      case "EXCHANGE_DELIVERING":
        return { text: "换货配送中", color: "bg-blue-50 text-blue-700" };
      case "COMPLETED":
      case "EXCHANGE_COMPLETED":
        return { text: "已完成", color: "bg-emerald-50 text-emerald-700" };
      case "PENDING":
        return { text: "待处理", color: "bg-red-50 text-red-700" };
      default:
        return { text: displayStatus, color: "bg-slate-50 text-slate-700" };
    }
  };

  const getOperationTypeDisplay = (type: string): string => {
    switch (type) {
      case "EXCHANGE":
        return "换货";
      case "RETURN":
        return "退货";
      default:
        return type;
    }
  };

  const toggleOrderExpanded = (orderCode: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderCode)) {
        newSet.delete(orderCode);
      } else {
        newSet.add(orderCode);
      }
      return newSet;
    });
  };


  return (
    <div className="w-full bg-slate-50/50 min-h-screen p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            供应商工作台
          </h1>
          <p className="text-slate-500 flex items-center gap-2 text-sm">
            <CalendarIcon className="w-4 h-4" />
            {currentDate}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            筛选订单
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all" size="sm">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 1. 今日任务概览（Summary）- 最顶部 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="border-none shadow-sm rounded-2xl bg-white">
                <CardContent className="p-5">
                  <div className="animate-pulse">
                    <div className="h-12 bg-slate-200 rounded-xl mb-4"></div>
                    <div className="h-8 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : error ? (
          <div className="col-span-5">
            <Card className="border-red-200 shadow-sm rounded-2xl bg-red-50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <ProgressStatCard
              title="待分拣订单"
              value={dashboardStats.pendingDeliveryOrders}
              icon={Clock}
              colorClass="text-slate-600"
              bgClass="bg-slate-50"
            />
            <ProgressStatCard
              title="分拣中订单"
              value={dashboardStats.deliveringOrders}
              icon={Truck}
              colorClass="text-blue-600"
              bgClass="bg-blue-50"
            />
            <ProgressStatCard
              title="退换货任务"
              value={dashboardStats.returnExchangeTasks}
              icon={RefreshCw}
              colorClass="text-amber-600"
              bgClass="bg-amber-50"
            />
            <ProgressStatCard
              title="已签收商品总重"
              value={dashboardStats.acceptedSkusQty}
              icon={CheckCircle2}
              colorClass="text-emerald-600"
              bgClass="bg-emerald-50"
            />

            <ProgressStatCard
              title="待备货 SKU"
              value={dashboardStats.pendingStockSkus}
              icon={Package}
              colorClass="text-purple-600"
              bgClass="bg-purple-50"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Main Content */}
        <div className="xl:col-span-2 space-y-8">

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-100">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">配送概览</TabsTrigger>
              <TabsTrigger value="stock" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">备货管理</TabsTrigger>
              <TabsTrigger value="exchange" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">退换货</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">

              {/* 3. 今日配送进度（按轮次） */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
                  <CardHeader className="px-6 py-5">
                    <CardTitle className="text-lg font-bold text-slate-900">今日正常配送进度</CardTitle>
                    <CardDescription>第一轮配送</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <ProgressItem
                        label="分拣中"
                        value={dashboardStats.deliveringOrders}
                        color="text-blue-600"
                        bgColor="bg-blue-50"
                        icon={Truck}
                      />
                      <ProgressItem
                        label="待分拣"
                        value={dashboardStats.pendingDeliveryOrders}
                        color="text-slate-600"
                        bgColor="bg-slate-50"
                        icon={Clock}
                      />
                      <ProgressItem
                        label="已分拣"
                        value={dashboardStats.completedOrders}
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                        icon={CheckCircle2}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
                  <CardHeader className="px-6 py-5">
                    <CardTitle className="text-lg font-bold text-slate-900">今日换货配送进度</CardTitle>
                    <CardDescription>换货配送</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <ProgressItem
                        label="待换货"
                        value={deliveryProgressData.round2.pending}
                        color="text-amber-600"
                        bgColor="bg-amber-50"
                        icon={RefreshCw}
                      />
                      <ProgressItem
                        label="已换货"
                        value={deliveryProgressData.round2.completed}
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                        icon={CheckCircle2}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 5. 今日订单列表（简版） */}
              <Card className="border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-50 px-6 py-5">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    今日订单
                  </CardTitle>
                  <CardDescription>今日分配给您的订单</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-50">
                        <TableHead className="pl-6 h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">订单信息</TableHead>
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">市场</TableHead>
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">状态</TableHead>
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">SKU</TableHead>
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">截止日期</TableHead>
                        <TableHead className="pr-6 h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              <span className="text-sm text-slate-500">加载中...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : ordersError ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2 text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">{ordersError}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : todayOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <span className="text-sm text-slate-500">暂无今日订单</span>
                          </TableCell>
                        </TableRow>
                      ) : (
                        todayOrders.map((order) => (
                          <TableRow key={order.orderCode} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                            <TableCell className="pl-6 py-4">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-900 font-mono text-xs">{order.orderCode}</div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span className="font-medium text-slate-700 text-xs">{order.marketName || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2 text-xs">
                                {getStatusIcon(order.orderStatus)}
                                <Badge className={`rounded-md px-2 py-0.5 text-xs font-medium border-0 ${getStatusColor(order.orderStatus)}`}>
                                  {translateOrderStatus(order.orderStatus)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <span className="font-mono text-slate-600 text-xs">{order.skuCount}</span>
                            </TableCell>
                            <TableCell className="py-4">
                              <span className="text-xs text-slate-600">{formatDeliveryDate(order.deliveryDate)}</span>
                            </TableCell>
                            <TableCell className="pr-6 py-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => router.push(`/workspace/providers/${organization?.id}/orders/${order.orderCode}`)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  详情
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stock Tab */}
            <TabsContent value="stock" className="space-y-6 mt-6">
              {/* 2. 今日备货总览 */}
              <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
                <CardHeader className="px-6 py-5">
                  <CardTitle className="text-lg font-bold text-slate-900">今日备货总览</CardTitle>
                  <CardDescription>按商品统计今日需求总量</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {stockLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-slate-500">加载中...</span>
                      </div>
                    </div>
                  ) : stockError ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">{stockError}</span>
                      </div>
                    </div>
                  ) : stockData.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <span className="text-sm text-slate-500">暂无备货数据</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stockData.map((item) => (
                        <div key={item.orderDetailId} className="p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-slate-700 text-sm">{item.productName}</span>
                            <Badge variant="secondary" className="text-xs">{item.unit}</Badge>
                          </div>
                          <div className="text-xl font-bold text-blue-600 font-mono tabular-nums">
                            {parseFloat(item.totalActualQty).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exchange Tab */}
            <TabsContent value="exchange" className="space-y-6 mt-6">
              {/* 4. 退换货任务列表 */}
              <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
                <CardHeader className="px-6 py-5">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-amber-600" />
                    退换货任务
                  </CardTitle>
                  <CardDescription>来自市场的验收反馈</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {returnExchangeLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-slate-500">加载中...</span>
                      </div>
                    </div>
                  ) : returnExchangeError ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">{returnExchangeError}</span>
                      </div>
                    </div>
                  ) : returnExchangeOrders.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <span className="text-sm text-slate-500">暂无退换货任务</span>
                    </div>
                  ) : (
                    returnExchangeOrders.map((order) => {
                      const statusDisplay = getReturnExchangeStatusDisplay(order.items[0]?.status || '', order.orderStatus);
                      const isPending = order.orderStatus === "PENDING" || order.items.some(item => item.status === "PENDING");
                      const isExpanded = expandedOrders.has(order.orderCode);
                      const exchangeCount = order.items.filter(item => item.operationType === "EXCHANGE").length;
                      const returnCount = order.items.filter(item => item.operationType === "RETURN").length;
                      
                      return (
                        <div key={order.orderCode} className="rounded-xl border border-slate-200 bg-white transition-all hover:shadow-md">
                          {/* 订单头部信息 */}
                          <div 
                            className="p-5 cursor-pointer transition-colors hover:bg-slate-50/50"
                            onClick={() => toggleOrderExpanded(order.orderCode)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-medium bg-white font-mono border-slate-300"
                                  >
                                    {order.orderCode}
                                  </Badge>
                                  <Badge className={`text-xs font-medium ${statusDisplay.color}`}>
                                    {statusDisplay.text}
                                  </Badge>
                                  {exchangeCount > 0 && (
                                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                                      换货 {exchangeCount} 项
                                    </Badge>
                                  )}
                                  {returnCount > 0 && (
                                    <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700">
                                      退货 {returnCount} 项
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs text-slate-600">
                                    共 {order.items.length} 项商品
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                  <span className="text-xs">
                                    <CalendarIcon className="w-3 h-3 inline mr-1" />
                                    创建时间: {formatDateTime(order.createdAt)}
                                  </span>
                                  <span className="text-xs">
                                    订单总SKU: {order.totalSkuCount}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 px-3 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/workspace/providers/${organization?.id}/orders/${order.orderCode}`);
                                    }}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    查看详情
                                  </Button>
                                  {isPending && (
                                    <Button 
                                      size="sm" 
                                      className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // TODO: 实现开始处理逻辑
                                      }}
                                    >
                                      开始处理
                                    </Button>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOrderExpanded(order.orderCode);
                                  }}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-500" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* 商品项列表（可展开） */}
                          {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/30">
                              <div className="p-4 space-y-3">
                                {order.items.map((item, itemIndex) => (
                                  <div 
                                    key={`${order.orderCode}-${itemIndex}`}
                                    className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge 
                                            variant="secondary" 
                                            className={`text-xs ${
                                              item.operationType === "EXCHANGE" 
                                                ? "bg-blue-50 text-blue-700" 
                                                : "bg-amber-50 text-amber-700"
                                            }`}
                                          >
                                            {getOperationTypeDisplay(item.operationType)}
                                          </Badge>
                                          <Badge 
                                            variant="outline" 
                                            className="text-xs text-slate-600"
                                          >
                                            {getReturnExchangeStatusDisplay(item.status, '').text}
                                          </Badge>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-3 text-sm">
                                            <span className="font-medium text-slate-900">{item.productName}</span>
                                            <span className="text-slate-600 font-mono">
                                              {parseFloat(item.deliveredQty).toFixed(2)} {item.weight}
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-500">
                                            产品代码: <span className="font-mono">{item.productCode}</span>
                                          </p>
                                          <p className="text-xs text-slate-600 mt-2">
                                            <span className="font-medium">原因:</span> {item.reason}
                                          </p>
                                          {item.evidenceImages && item.evidenceImages.length > 0 && (
                                            <div className="mt-2">
                                              <span className="text-xs text-slate-500">证据图片: {item.evidenceImages.length} 张</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Notifications */}
        <div className="space-y-8">
          {/* 6. 通知中心 */}
          <NotificationsCard
            limit={20}
            showViewAll={true}
            viewAllLink="/workspace/notifications"
            description="最新订单和验收通知"
            title="消息通知"
          />
        </div>
      </div>
    </div>
  );
}

// Helper Components

function ProgressStatCard({
  title,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  title: string;
  value: number;
  icon: any;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <Card className="border-none shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group rounded-2xl bg-white">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass} bg-opacity-50 transition-colors group-hover:scale-110 duration-300`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressItem({
  label,
  value,
  color,
  bgColor,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  icon: any;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-100">
      <div className={`p-2 rounded-lg ${bgColor}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <div className="text-lg font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}
