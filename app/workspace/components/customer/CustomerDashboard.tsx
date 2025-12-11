"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  MapPin,
  ShoppingCart,
  Bell,
  ArrowRight,
  ArrowUpRight,
  CalendarDays as CalendarIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsCard } from "../NotificationsCard";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { translateOrderStatus } from "@/lib/utils";

// --- Types ---

interface DashboardStats {
  pendingConfirmation: number;
  inTransit: number;
  arrivingToday: number;
  inAcceptance: number;
  exceptions: number;
}

interface DashboardStatsResponse {
  code: number;
  message: string;
  data: DashboardStats;
  requestId: string;
  timestamp: string;
}

interface CustomerOrder {
  orderCode: string;
  totalAmount: string;
  actualAmount: string;
  deliveryDate: string;
  deliveryAddress: string;
  orderStatus: string;
  createdAt: string;
  marketName: string;
  marketAddress: string;
  customerName: string;
  customerAddress: string;
  contactName: string;
  contactPhone: string;
  marketContactNumber: string;
  marketContactorName: string;
  shipperName: string;
  shipperPhone: string;
  skuCount: number;
  urgent: boolean;
}

interface CustomerOrdersResponse {
  code: number;
  message: string;
  data: CustomerOrder[];
  requestId: string;
  timestamp: string;
}

interface StatisticsData {
  orders: number;
  totalSpent: string;
  returnRate: number;
  ordersTrend?: string;
  ordersTrendUp?: boolean;
  totalSpentTrend?: string;
  totalSpentTrendUp?: boolean;
  returnRateTrend?: string;
  returnRateTrendUp?: boolean;
  topProducts: Array<{
    name: string;
    count: number;
  }>;
}

interface StatisticsResponse {
  code: number;
  message: string;
  data: StatisticsData;
  requestId: string;
  timestamp: string;
}

const pendingTasks = [
  {
    id: 1,
    type: "验收",
    orderId: "ODR-20251125091603011-XYZQ",
    message: "订单 XYZQ 已送达市场，正在等待您的确认验收",
    time: "2025-11-25 14:30",
    urgent: true,
  },
  {
    id: 2,
    type: "换货",
    orderId: "ODR-20251125091603012-ABCD",
    message: "您发起的换货请求已被市场确认，供应商正在准备新品配送",
    time: "2025-11-25 13:15",
    urgent: false,
  },
  {
    id: 3,
    type: "验收",
    orderId: "ODR-20251125091603013-EFGH",
    message: "订单 EFGH 预计今日下午到达，请做好验收准备",
    time: "2025-11-25 11:45",
    urgent: false,
  },
];

export default function CustomerDashboard() {
  const router = useRouter();
  const { organization } = useWorkspace();
  const currentDate = new Date().toLocaleDateString("zh-CN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [overviewData, setOverviewData] = useState<DashboardStats>({
    pendingConfirmation: 0,
    inTransit: 0,
    arrivingToday: 0,
    inAcceptance: 0,
    exceptions: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<StatisticsData>({
    orders: 0,
    totalSpent: "0.00",
    returnRate: 0,
    topProducts: [],
  });
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);

  // Fetch dashboard stats from API
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoadingStats(true);
        setStatsError(null);
        const response = await fetch('/api/orders/dashboard-stats');
        const result: DashboardStatsResponse = await response.json();

        if (result.code === 200 && result.data) {
          setOverviewData(result.data);
        } else {
          setStatsError(result.message || '获取统计数据失败');
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setStatsError('获取统计数据时发生错误');
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      if (!organization?.id) {
        return;
      }

      try {
        setOrdersLoading(true);
        setOrdersError(null);
        // 获取当日日期，格式为 YYYY-MM-DD
        const today = format(new Date(), 'yyyy-MM-dd');
        const response = await fetch(`/api/customers/${organization.id}/orders?deliveryDate=${today}`);
        const result: CustomerOrdersResponse = await response.json();

        if (result.code === 200 && result.data) {
          setOrders(result.data);
        } else {
          setOrdersError(result.message || '获取订单数据失败');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setOrdersError('获取订单数据时发生错误');
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [organization?.id]);

  // Fetch statistics from API
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setStatisticsLoading(true);
        setStatisticsError(null);
        const response = await fetch('/api/orders/statistics');
        const result: StatisticsResponse = await response.json();

        if (result.code === 200 && result.data) {
          setStatistics(result.data);
        } else {
          setStatisticsError(result.message || '获取统计数据失败');
        }
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setStatisticsError('获取统计数据时发生错误');
      } finally {
        setStatisticsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "MARKET_DELIVERING":
      case "EXCHANGE_NEW_DELIVERING": return <Truck className="w-4 h-4" />;
      case "CUSTOMER_INSPECTING":
      case "MARKET_INSPECTING":
      case "EXCHANGE_INSPECTING": return <Package className="w-4 h-4" />;
      case "COMPLETED":
      case "EXCHANGE_COMPLETED": return <CheckCircle2 className="w-4 h-4" />;
      case "EXCHANGE_REQUESTED":
      case "EXCHANGE_IN_PROGRESS": return <RefreshCw className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "MARKET_DELIVERING":
      case "EXCHANGE_NEW_DELIVERING": return "bg-blue-50 text-blue-700 border-blue-200";
      case "CUSTOMER_INSPECTING":
      case "MARKET_INSPECTING":
      case "EXCHANGE_INSPECTING": return "bg-amber-50 text-amber-700 border-amber-200";
      case "COMPLETED":
      case "EXCHANGE_COMPLETED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "EXCHANGE_REQUESTED":
      case "EXCHANGE_IN_PROGRESS": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatOrderDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  // Calculate progress data from overviewData
  const progressData = [
    { name: "待确认", value: overviewData.pendingConfirmation, color: "#94a3b8" }, // slate-400
    { name: "配送中", value: overviewData.inTransit, color: "#3b82f6" }, // blue-500
    { name: "今日已收货", value: overviewData.arrivingToday, color: "#10b981" }, // emerald-500
    { name: "正在验收", value: overviewData.inAcceptance, color: "#f59e0b" }, // amber-500
    { name: "异常", value: overviewData.exceptions, color: "#ef4444" },   // red-500
  ];

  return (
    <div className="w-full bg-slate-50/50 min-h-screen p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            我的工作台
          </h1>
          <p className="text-slate-500 flex items-center gap-2 text-sm">
            <CalendarIcon className="w-4 h-4" />
            {currentDate} • 订单管理中心
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            size="sm"
            onClick={() => router.push('/workspace/procurement')}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            去采购
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all" size="sm">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 1. Order Processing Progress Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        <ProgressStatCard
          title="待确认订单"
          value={overviewData.pendingConfirmation}
          icon={Clock}
          colorClass="text-slate-600"
          bgClass="bg-slate-50"
        />
        <ProgressStatCard
          title="配送中订单"
          value={overviewData.inTransit}
          icon={Truck}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <ProgressStatCard
          title="今日已收订单"
          value={overviewData.arrivingToday}
          icon={CheckCircle2}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <ProgressStatCard
          title="正在验收"
          value={overviewData.inAcceptance}
          icon={Package}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <ProgressStatCard
          title="验收异常"
          value={overviewData.exceptions}
          icon={AlertCircle}
          colorClass="text-red-600"
          bgClass="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Orders & Tasks */}
        <div className="xl:col-span-2 space-y-8">

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-100">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">订单概览</TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">待办事项</TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">统计分析</TabsTrigger>
            </TabsList>

            {/* Orders Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">

              {/* 2. Orders List */}
              <Card className="border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-50 px-6 py-5">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    我的订单
                  </CardTitle>
                  <CardDescription>实时查看订单状态和进度</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-50">
                        <TableHead className="pl-6 h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">订单信息</TableHead>
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">状态</TableHead>
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">商品数量</TableHead>
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">订购金额</TableHead>
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">配送员</TableHead>
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
                      ) : orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <span className="text-sm text-slate-500">暂无订单</span>
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => (
                          <TableRow key={order.orderCode} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                            <TableCell className="pl-6 py-4">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-900 font-mono text-xs">{order.orderCode}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <span className="font-medium">下单时间：</span>
                                  <Calendar className="w-3 h-3" />
                                  {formatOrderDate(order.createdAt)}
                                </div>
                                {/* <div className="text-xs text-slate-400 line-clamp-1">
                                  {order.deliveryAddress}
                                </div> */}
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(order.orderStatus)}
                                <Badge className={`rounded-md px-2 py-0.5 text-xs font-medium border-0 ${getStatusColor(order.orderStatus)}`}>
                                  {translateOrderStatus(order.orderStatus)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <span className="font-mono text-slate-600 text-xs">{order.skuCount} 件</span>
                            </TableCell>
                            <TableCell className="py-4">
                              <span className="font-bold font-mono text-slate-900 text-xs">¥{order.totalAmount}</span>
                            </TableCell>
                            <TableCell className="py-4">
                              {order.shipperName ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                      {order.shipperName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="text-xs">
                                    <div className="font-medium">{order.shipperName}</div>
                                    <div className="text-slate-400">{order.shipperPhone}</div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">未分配</span>
                              )}
                            </TableCell>
                            <TableCell className="pr-6 py-4">
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2 text-xs"
                                  onClick={() => router.push(`/workspace/customers/${organization?.id}/orders/${order.orderCode}`)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  详情
                                </Button>
                                {(order.orderStatus === "CUSTOMER_INSPECTING" || order.orderStatus === "EXCHANGE_INSPECTING") && (
                                  <Button 
                                    size="sm" 
                                    className="h-8 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                                    onClick={() => router.push(`/workspace/customers/${organization?.id}/orders/${order.orderCode}/inspection`)}
                                  >
                                    验收
                                  </Button>
                                )}
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

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-6 mt-6">
              <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
                <CardHeader className="px-6 py-5">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    待处理事项
                  </CardTitle>
                  <CardDescription>需要您立即处理的重要任务</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className={`p-4 rounded-xl border transition-colors ${
                      task.urgent
                        ? "bg-red-50/50 border-red-100 hover:bg-red-50"
                        : "bg-white border-slate-100 hover:bg-slate-50"
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium ${
                                task.type === "验收"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-orange-50 text-orange-700 border-orange-200"
                              }`}
                            >
                              {task.type}
                            </Badge>
                            {task.urgent && (
                              <Badge variant="destructive" className="text-xs">
                                紧急
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 font-medium">
                            {task.message}
                          </p>
                          <p className="text-xs text-slate-500">
                            {task.time}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                            查看详情
                          </Button>
                          {task.type === "验收" && (
                            <Button size="sm" className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700">
                              立即验收
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Monthly Stats */}
                <div className="md:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statisticsLoading ? (
                      <>
                        <Card className="border-slate-100 shadow-sm bg-white rounded-xl p-5">
                          <div className="flex items-center justify-center h-24">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        </Card>
                        <Card className="border-slate-100 shadow-sm bg-white rounded-xl p-5">
                          <div className="flex items-center justify-center h-24">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        </Card>
                        <Card className="border-slate-100 shadow-sm bg-white rounded-xl p-5">
                          <div className="flex items-center justify-center h-24">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        </Card>
                      </>
                    ) : statisticsError ? (
                      <Card className="md:col-span-3 border-slate-100 shadow-sm bg-white rounded-xl p-5">
                        <div className="flex items-center justify-center gap-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">{statisticsError}</span>
                        </div>
                      </Card>
                    ) : (
                      <>
                        <StatCard
                          title="本月订单数"
                          value={statistics.orders}
                          unit="单"
                          trend={statistics.ordersTrend}
                          trendUp={statistics.ordersTrendUp}
                          icon={Package}
                          color="text-blue-600"
                        />
                        <StatCard
                          title="本月消费"
                          value={parseFloat(statistics.totalSpent)}
                          unit="元"
                          trend={statistics.totalSpentTrend}
                          trendUp={statistics.totalSpentTrendUp}
                          icon={DollarSign}
                          color="text-emerald-600"
                        />
                        <StatCard
                          title="退换货比例"
                          value={statistics.returnRate}
                          unit="%"
                          trend={statistics.returnRateTrend}
                          trendUp={statistics.returnRateTrendUp}
                          icon={RefreshCw}
                          color="text-amber-600"
                        />
                      </>
                    )}
                  </div>

                  {/* Top Products */}
                  <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
                    <CardHeader className="px-6 py-5">
                      <CardTitle className="text-lg font-bold text-slate-900">常购商品 TOP 5</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {statisticsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : statisticsError ? (
                        <div className="flex items-center justify-center gap-2 text-red-600 py-8">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">{statisticsError}</span>
                        </div>
                      ) : statistics.topProducts && statistics.topProducts.length > 0 ? (
                        statistics.topProducts.map((product, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <span className="font-medium text-slate-700 text-sm">{product.name}</span>
                            </div>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                              {product.count} 次
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-500 text-sm">暂无数据</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Chart */}
                <Card className="border-slate-100 shadow-sm bg-white rounded-2xl h-full flex flex-col">
                  <CardHeader className="px-6 py-5">
                    <CardTitle className="text-lg font-bold text-slate-900">订单状态分布</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-center px-6 pb-6">
                    <div className="h-[250px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={progressData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                            cornerRadius={6}
                            stroke="none"
                          >
                            {progressData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: '12px',
                              border: 'none',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              padding: '12px'
                            }}
                            itemStyle={{ fontWeight: 600 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Notifications */}
        <div className="space-y-8">
          {/* 5. Notifications Center */}
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

function StatCard({
  title,
  value,
  unit,
  trend,
  trendUp,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  unit: string;
  trend?: string;
  trendUp?: boolean;
  icon: any;
  color: string;
}) {
  return (
    <Card className="border-slate-100 shadow-sm bg-white rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-slate-50 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
            trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            <TrendingUp className={`w-3 h-3 mr-1 ${!trendUp ? 'rotate-180' : ''}`} />
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-900">{value}<span className="text-sm text-slate-500 ml-1">{unit}</span></h3>
        <p className="text-sm text-slate-500 mt-1">{title}</p>
      </div>
    </Card>
  );
}
