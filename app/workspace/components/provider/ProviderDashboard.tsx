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
  Truck,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  AlertTriangle,
  Calendar,
  TrendingUp,
  MapPin,
  ShoppingCart,
  Bell,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  CalendarDays as CalendarIcon,
  Filter,
  Search,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Mock Data ---

const todaySummaryData = {
  needDeliver: 8,      // 今日待配送订单数
  delivering: 12,      // 今日配送中订单数
  completed: 15,       // 今日已完成配送
  exchangeTasks: 3,    // 今日退换货任务数
  pendingSku: 24,      // 今日待备货 SKU 数
};

const stockOverviewData = [
  {
    category: "猪肉类",
    items: [
      { sku: "五花肉", totalQty: 55, unit: "kg" },
      { sku: "猪后腿肉", totalQty: 32, unit: "kg" },
      { sku: "猪瘦肉", totalQty: 28, unit: "kg" },
    ]
  },
  {
    category: "蔬菜类",
    items: [
      { sku: "西红柿", totalQty: 33, unit: "kg" },
      { sku: "白菜", totalQty: 45, unit: "kg" },
      { sku: "黄瓜", totalQty: 22, unit: "kg" },
    ]
  },
  {
    category: "调味品类",
    items: [
      { sku: "食用盐", totalQty: 150, unit: "袋" },
      { sku: "酱油", totalQty: 80, unit: "瓶" },
      { sku: "料酒", totalQty: 60, unit: "瓶" },
    ]
  },
];

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

const exchangeTasksData = [
  {
    id: "EX-001",
    orderId: "ODR-20251125091603010-DAFK",
    sku: "新鲜猪肉",
    quantity: 5,
    unit: "kg",
    reason: "质量不合格",
    deadline: "2025-11-26",
    status: "待处理",
    statusColor: "bg-red-50 text-red-700",
  },
  {
    id: "EX-002",
    orderId: "ODR-20251125091603011-XYZQ",
    sku: "时令蔬菜",
    quantity: 10,
    unit: "kg",
    reason: "规格不符",
    deadline: "2025-11-27",
    status: "换货中",
    statusColor: "bg-blue-50 text-blue-700",
  },
  {
    id: "EX-003",
    orderId: "ODR-20251125091603012-ABCD",
    sku: "调味品套餐",
    quantity: 2,
    unit: "盒",
    reason: "破损",
    deadline: "2025-11-28",
    status: "完成",
    statusColor: "bg-emerald-50 text-emerald-700",
  },
];

const todayOrdersData = [
  {
    id: "ODR-20251125091603010-DAFK",
    marketName: "望京市场",
    itemsCount: 5,
    totalQty: 125,
    status: "ASSIGNED", // 已指派
    statusText: "待配送",
    deadline: "14:00",
    urgent: false,
  },
  {
    id: "ODR-20251125091603011-XYZQ",
    marketName: "三里屯市场",
    itemsCount: 8,
    totalQty: 89,
    status: "DELIVERING", // 配送中
    statusText: "配送中",
    deadline: "15:30",
    urgent: true,
  },
  {
    id: "ODR-20251125091603012-ABCD",
    marketName: "朝阳大悦城市场",
    itemsCount: 3,
    totalQty: 67,
    status: "COMPLETED", // 已完成
    statusText: "已完成",
    deadline: "16:00",
    urgent: false,
  },
];

const notificationsData = [
  {
    id: 1,
    type: "验收反馈",
    title: "市场验收完成，要求换货",
    message: "望京市场验收订单 ODR-20251125091603010-DAFK，发现新鲜猪肉质量不合格，要求换5kg",
    time: "2025-11-25 14:30",
    read: false,
    urgent: true,
  },
  {
    id: 2,
    type: "新订单",
    title: "新订单分配",
    message: "您有新的订单 ODR-20251125091603013-EFGH 需要处理",
    time: "2025-11-25 13:15",
    read: false,
    urgent: false,
  },
  {
    id: 3,
    type: "配送异常",
    title: "配送异常提醒",
    message: "订单 ODR-20251125091603011-XYZQ 配送过程中遇到交通堵塞",
    time: "2025-11-25 11:45",
    read: true,
    urgent: false,
  },
];

export default function ProviderDashboard() {
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
      case "ASSIGNED": return <Clock className="w-4 h-4" />;
      case "DELIVERING": return <Truck className="w-4 h-4" />;
      case "COMPLETED": return <CheckCircle2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED": return "bg-slate-50 text-slate-700 border-slate-200";
      case "DELIVERING": return "bg-blue-50 text-blue-700 border-blue-200";
      case "COMPLETED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
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
            {currentDate} • 配送管理中心
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
        <ProgressStatCard
          title="待配送订单"
          value={todaySummaryData.needDeliver}
          icon={Clock}
          colorClass="text-slate-600"
          bgClass="bg-slate-50"
        />
        <ProgressStatCard
          title="配送中订单"
          value={todaySummaryData.delivering}
          icon={Truck}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <ProgressStatCard
          title="已完成配送"
          value={todaySummaryData.completed}
          icon={CheckCircle2}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <ProgressStatCard
          title="退换货任务"
          value={todaySummaryData.exchangeTasks}
          icon={RefreshCw}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <ProgressStatCard
          title="待备货 SKU"
          value={todaySummaryData.pendingSku}
          icon={Package}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
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
                    <CardDescription>Round 1 - 第一轮配送</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <ProgressItem
                        label="已配送"
                        value={deliveryProgressData.round1.delivered}
                        color="text-blue-600"
                        bgColor="bg-blue-50"
                        icon={Truck}
                      />
                      <ProgressItem
                        label="待配送"
                        value={deliveryProgressData.round1.pending}
                        color="text-slate-600"
                        bgColor="bg-slate-50"
                        icon={Clock}
                      />
                      <ProgressItem
                        label="已送达"
                        value={deliveryProgressData.round1.arrived}
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
                    <CardDescription>Round 2 - 换货配送</CardDescription>
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
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">商品数</TableHead>
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">总数量</TableHead>
                        <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">截止时间</TableHead>
                        <TableHead className="pr-6 h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayOrdersData.map((order) => (
                        <TableRow key={order.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <div className="space-y-1">
                              <div className="font-bold text-slate-900">{order.id}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="font-medium text-slate-700">{order.marketName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              <Badge className={`rounded-md px-2 py-0.5 text-xs font-medium border-0 ${getStatusColor(order.status)}`}>
                                {order.statusText}
                              </Badge>
                              {order.urgent && (
                                <Badge variant="destructive" className="text-xs">紧急</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="font-mono text-slate-600">{order.itemsCount} 件</span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="font-bold font-mono text-slate-900">{order.totalQty}</span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm text-slate-600">{order.deadline}</span>
                          </TableCell>
                          <TableCell className="pr-6 py-4">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                详情
                              </Button>
                              <Button size="sm" className="h-8 px-2 text-xs bg-blue-600 hover:bg-blue-700">
                                开始配送
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
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
                  <CardDescription>按商品类别统计今日需求总量</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {stockOverviewData.map((category) => (
                    <div key={category.category} className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">
                        {category.category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.items.map((item, index) => (
                          <div key={index} className="p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-slate-700">{item.sku}</span>
                              <Badge variant="secondary" className="text-xs">{item.unit}</Badge>
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                              {item.totalQty}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
                  {exchangeTasksData.map((task) => (
                    <div key={task.id} className="p-4 rounded-xl border transition-colors hover:bg-slate-50/50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs font-medium bg-white"
                            >
                              {task.id}
                            </Badge>
                            <Badge className={`text-xs font-medium ${task.statusColor}`}>
                              {task.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium text-slate-900">{task.sku}</span>
                            <span className="text-slate-600">{task.quantity} {task.unit}</span>
                            <span className="text-slate-500">订单: {task.orderId}</span>
                          </div>
                          <p className="text-xs text-slate-600">原因: {task.reason}</p>
                          <p className="text-xs text-slate-500">截止时间: {task.deadline}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                            查看详情
                          </Button>
                          {task.status === "待处理" && (
                            <Button size="sm" className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700">
                              开始处理
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Notifications */}
        <div className="space-y-8">
          {/* 6. 通知中心 */}
          <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                消息通知
                {notificationsData.filter(n => !n.read).length > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                    {notificationsData.filter(n => !n.read).length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>最新订单和验收通知</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                {notificationsData.map((notification) => (
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
