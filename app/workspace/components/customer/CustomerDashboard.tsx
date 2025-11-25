"use client";

import React, { useState } from "react";
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
  Filter,
  Search,
  CalendarDays as CalendarIcon,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Mock Data ---

const overviewData = {
  pendingConfirmation: 3, // 待确认订单
  inTransit: 12,        // 配送中订单
  arrivingToday: 8,     // 今日预计到达
  awaitingAcceptance: 5, // 等待验收
  exceptions: 2,        // 验收异常
};

const ordersData = [
  {
    id: "ODR-20251125091603010-DAFK",
    createdAt: "2025-11-25 09:16",
    status: "DELIVERING", // 配送中
    statusText: "配送中",
    statusColor: "bg-blue-50 text-blue-700",
    itemsCount: 3,
    totalAmount: "¥60.00",
    deliveryStaff: {
      name: "张三",
      phone: "13800138001",
      avatar: "张",
    },
    products: ["一级猪尾巴", "猪血", "无耳猪头"],
  },
  {
    id: "ODR-20251125091603011-XYZQ",
    createdAt: "2025-11-25 10:30",
    status: "ARRIVED", // 已到达
    statusText: "等待验收",
    statusColor: "bg-amber-50 text-amber-700",
    itemsCount: 5,
    totalAmount: "¥150.00",
    deliveryStaff: {
      name: "李四",
      phone: "13800138002",
      avatar: "李",
    },
    products: ["新鲜蔬菜套餐", "优质肉类", "水果组合"],
  },
  {
    id: "ODR-20251125091603012-ABCD",
    createdAt: "2025-11-25 08:15",
    status: "EXCHANGE_IN_PROGRESS", // 换货中
    statusText: "换货进行中",
    statusColor: "bg-orange-50 text-orange-700",
    itemsCount: 2,
    totalAmount: "¥45.00",
    deliveryStaff: null,
    products: ["新鲜猪肉", "调味品"],
  },
];

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

const notifications = [
  {
    id: 1,
    type: "验收完成",
    title: "订单已验收",
    message: "您的订单 ODR-20251124091603009 已由市场验收完成",
    time: "2025-11-25 10:30",
    read: false,
  },
  {
    id: 2,
    type: "配送更新",
    title: "配送状态更新",
    message: "您的订单 ODR-20251125091603010-DAFK 正在配送中",
    time: "2025-11-25 09:45",
    read: false,
  },
  {
    id: 3,
    type: "换货通知",
    title: "换货已处理",
    message: "您发起的换货请求已通过市场审核",
    time: "2025-11-24 16:20",
    read: true,
  },
];

const progressData = [
  { name: "待确认", value: 3, color: "#94a3b8" }, // slate-400
  { name: "配送中", value: 12, color: "#3b82f6" }, // blue-500
  { name: "今日到货", value: 8, color: "#10b981" }, // emerald-500
  { name: "待验收", value: 5, color: "#f59e0b" }, // amber-500
  { name: "异常", value: 2, color: "#ef4444" },   // red-500
];

const monthlyStats = {
  orders: 45,
  totalSpent: 12580,
  returnRate: 3.2,
  topProducts: [
    { name: "新鲜猪肉", count: 12 },
    { name: "时令蔬菜", count: 8 },
    { name: "优质水果", count: 6 },
    { name: "调味品", count: 5 },
  ],
};

export default function CustomerDashboard() {
  const router = useRouter();
  const currentDate = new Date().toLocaleDateString("zh-CN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [activeTab, setActiveTab] = useState("overview");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERING": return <Truck className="w-4 h-4" />;
      case "ARRIVED": return <CheckCircle2 className="w-4 h-4" />;
      case "EXCHANGE_IN_PROGRESS": return <RefreshCw className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERING": return "bg-blue-50 text-blue-700 border-blue-200";
      case "ARRIVED": return "bg-amber-50 text-amber-700 border-amber-200";
      case "EXCHANGE_IN_PROGRESS": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

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
          title="今日到货"
          value={overviewData.arrivingToday}
          icon={CheckCircle2}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <ProgressStatCard
          title="等待验收"
          value={overviewData.awaitingAcceptance}
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
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">金额</TableHead>
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">配送员</TableHead>
                        <TableHead className="pr-6 h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersData.map((order) => (
                        <TableRow key={order.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <div className="space-y-1">
                              <div className="font-bold text-slate-900">{order.id}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {order.createdAt}
                              </div>
                              <div className="text-xs text-slate-400 line-clamp-1">
                                {order.products.join("，")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              <Badge className={`rounded-md px-2 py-0.5 text-xs font-medium border-0 ${getStatusColor(order.status)}`}>
                                {order.statusText}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="font-mono text-slate-600">{order.itemsCount} 件</span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="font-bold font-mono text-slate-900">{order.totalAmount}</span>
                          </TableCell>
                          <TableCell className="py-4">
                            {order.deliveryStaff ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                    {order.deliveryStaff.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="text-xs">
                                  <div className="font-medium">{order.deliveryStaff.name}</div>
                                  <div className="text-slate-400">{order.deliveryStaff.phone}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">未分配</span>
                            )}
                          </TableCell>
                          <TableCell className="pr-6 py-4">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                详情
                              </Button>
                              {order.status === "ARRIVED" && (
                                <Button size="sm" className="h-8 px-2 text-xs bg-blue-600 hover:bg-blue-700">
                                  验收
                                </Button>
                              )}
                              {order.status === "EXCHANGE_IN_PROGRESS" && (
                                <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  售后
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
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
                    <StatCard
                      title="本月订单数"
                      value={monthlyStats.orders}
                      unit="单"
                      trend="+15%"
                      trendUp={true}
                      icon={Package}
                      color="text-blue-600"
                    />
                    <StatCard
                      title="本月消费"
                      value={monthlyStats.totalSpent}
                      unit="元"
                      trend="+8%"
                      trendUp={true}
                      icon={DollarSign}
                      color="text-emerald-600"
                    />
                    <StatCard
                      title="退换货比例"
                      value={monthlyStats.returnRate}
                      unit="%"
                      trend="-2%"
                      trendUp={false}
                      icon={RefreshCw}
                      color="text-amber-600"
                    />
                  </div>

                  {/* Top Products */}
                  <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
                    <CardHeader className="px-6 py-5">
                      <CardTitle className="text-lg font-bold text-slate-900">常购商品 TOP 5</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {monthlyStats.topProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-slate-700">{product.name}</span>
                          </div>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                            {product.count} 次
                          </Badge>
                        </div>
                      ))}
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
          <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                消息通知
              </CardTitle>
              <CardDescription>最新订单状态更新</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                      notification.read
                        ? "bg-slate-50/50 border-slate-100"
                        : "bg-blue-50/50 border-blue-100"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs px-2 py-0.5 bg-white"
                        >
                          {notification.type}
                        </Badge>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-blue-600 hover:bg-blue-50">
                查看全部通知
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
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
