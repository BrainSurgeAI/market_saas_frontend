"use client";

import { useState, useEffect, useMemo } from "react";
import { useWorkspace } from "@/lib/WorkspaceContext";
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
import {
  ClipboardList,
  Truck,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowRight,
  TrendingUp,
  Clock,
  User,
  MoreHorizontal,
  ArrowUpRight,
  Filter,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsCard } from "../NotificationsCard";

// --- Type Definitions ---

interface TrendData {
  value: string;
  up: boolean;
}

interface CardMetadata {
  subtitle?: string;
  active?: boolean;
}

interface OrderStatisticsData {
  newOrders: number;
  pendingAssignment: number;
  pendingInspection: number;
  exceptions: number;
  completed: number;
  trends?: {
    newOrders?: TrendData;
    pendingAssignment?: TrendData;
    pendingInspection?: TrendData;
    exceptions?: TrendData;
    completed?: TrendData;
  };
  metadata?: {
    pendingAssignment?: CardMetadata;
    [key: string]: CardMetadata | undefined;
  };
}

interface ApiResponse {
  code: number;
  message: string;
  data: OrderStatisticsData;
  requestId: string;
  timestamp: string;
}

// --- Default Data (fallback) ---

const defaultOverviewData: OrderStatisticsData = {
  newOrders: 0,
  pendingAssignment: 0,
  pendingInspection: 0,
  exceptions: 0,
  completed: 0,
};

// tasksData 将在组件内部根据 API 数据动态生成

const providerData = [
  {
    id: 1,
    name: "鲜丰水果批发",
    deliveryVolume: 450,
    onTimeRate: 98,
    acceptanceRate: 99,
    exceptionRate: 1,
    avatar: "鲜",
    status: "excellent",
  },
  {
    id: 2,
    name: "绿野蔬菜基地",
    deliveryVolume: 320,
    onTimeRate: 92,
    acceptanceRate: 95,
    exceptionRate: 5,
    avatar: "绿",
    status: "good",
  },
  {
    id: 3,
    name: "晨曦肉类供应",
    deliveryVolume: 210,
    onTimeRate: 88,
    acceptanceRate: 92,
    exceptionRate: 8,
    avatar: "晨",
    status: "average",
  },
  {
    id: 4,
    name: "海鲜大市场",
    deliveryVolume: 150,
    onTimeRate: 95,
    acceptanceRate: 96,
    exceptionRate: 4,
    avatar: "海",
    status: "good",
  },
  {
    id: 5,
    name: "调味品总汇",
    deliveryVolume: 80,
    onTimeRate: 100,
    acceptanceRate: 100,
    exceptionRate: 0,
    avatar: "调",
    status: "excellent",
  },
];

// Mock data for a tiny trend chart in cards
const trendData = [
  { value: 40 }, { value: 35 }, { value: 55 }, { value: 45 }, { value: 60 }, { value: 75 }, { value: 65 }
];

export default function MarketDashboard() {
  const { organization } = useWorkspace();
  const [overviewData, setOverviewData] = useState<OrderStatisticsData>(defaultOverviewData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 获取 market_id，优先使用 nameHash，如果没有则使用 id
  const marketId = organization?.nameHash || organization?.id?.toString() || '';

  // 根据 API 数据动态生成 tasksData
  const tasksData = useMemo(() => {
    const basePath = marketId ? `/workspace/markets/${marketId}/orders` : '/workspace/markets/orders';
    return [
      {
        id: "assign",
        title: "待分配订单",
        count: overviewData.pendingAssignment,
        description: "需指派供应商",
        icon: ClipboardList,
        action: "立即分配",
        link: `${basePath}?status=PENDING`,
        theme: "blue",
      },
      {
        id: "inspect",
        title: "待验收配送",
        count: overviewData.pendingInspection,
        description: "供应商已送达",
        icon: Truck,
        action: "立即验收",
        link: `${basePath}?status=ARRIVED`,
        theme: "indigo",
      },
      {
        id: "exception",
        title: "验收异常",
        count: overviewData.exceptions,
        description: "需处理退换货",
        icon: AlertCircle,
        action: "立即处理",
        link: `${basePath}?status=EXCEPTION`,
        theme: "rose",
      },
    ];
  }, [overviewData, marketId]);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/orders/dashboard-stats');
        const result: ApiResponse = await response.json();
        
        if (result.code === 200 && result.data) {
          setOverviewData(result.data);
        } else {
          setError(result.message || '获取数据失败');
          // 使用默认数据作为降级方案
          setOverviewData(defaultOverviewData);
        }
      } catch (err) {
        console.error('获取订单统计数据失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');
        // 使用默认数据作为降级方案
        setOverviewData(defaultOverviewData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const currentDate = new Date().toLocaleDateString("zh-CN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full bg-slate-50/50 min-h-screen p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-500 flex items-center gap-2 text-sm">
            <CalendarIcon className="w-4 h-4" />
            {currentDate} • 今日运营概览
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            筛选视图
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all" size="sm">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 1. Overview Cards - Nexus Style: Clean, white, subtle borders, high contrast numbers */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-slate-100 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5 flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-rose-200 bg-rose-50 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          <NexusStatCard
            title="今日订单"
            value={overviewData.newOrders}
            trend={overviewData.trends?.newOrders?.value}
            trendUp={overviewData.trends?.newOrders?.up}
            icon={Package}
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
          />
          <NexusStatCard
            title="待分配订单"
            value={overviewData.pendingAssignment}
            subtitle={overviewData.metadata?.pendingAssignment?.subtitle}
            active={overviewData.metadata?.pendingAssignment?.active}
            trend={overviewData.trends?.pendingAssignment?.value}
            trendUp={overviewData.trends?.pendingAssignment?.up}
            icon={ClipboardList}
            colorClass="text-violet-600"
            bgClass="bg-violet-50"
          />
          <NexusStatCard
            title="待验收配送"
            value={overviewData.pendingInspection}
            trend={overviewData.trends?.pendingInspection?.value}
            trendUp={overviewData.trends?.pendingInspection?.up}
            icon={Truck}
            colorClass="text-indigo-600"
            bgClass="bg-indigo-50"
          />
          <NexusStatCard
            title="今日异常"
            value={overviewData.exceptions}
            trend={overviewData.trends?.exceptions?.value}
            trendUp={overviewData.trends?.exceptions?.up}
            icon={AlertCircle}
            colorClass="text-rose-600"
            bgClass="bg-rose-50"
          />
          <NexusStatCard
            title="已完成"
            value={overviewData.completed}
            trend={overviewData.trends?.completed?.value}
            trendUp={overviewData.trends?.completed?.up}
            icon={CheckCircle2}
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Tasks & Progress */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* 2. Actionable Tasks - Nexus Style: Horizontal cards with clear actions */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-500" />
                  待处理事项
                </h2>
                <Button 
                  variant="link" 
                  className="text-blue-600 h-auto p-0"
                  asChild
                >
                  <a href={marketId ? `/workspace/markets/${marketId}/orders` : '/workspace/markets/orders'}>
                    查看全部
                  </a>
                </Button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {tasksData.map((task) => (
                  <NexusTaskCard key={task.id} data={task} />
                ))}
             </div>
          </div>

          {/* 4. Provider Performance Table - Nexus Style: Clean table, minimalist headers */}
          <Card className="border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 px-6 py-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">供应商表现 Top 5</CardTitle>
                <CardDescription className="mt-1">监控今日履约质量与异常率</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-50">
                    <TableHead className="pl-6 h-12 text-xs uppercase tracking-wider font-semibold text-slate-500">供应商</TableHead>
                    <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">今日配送</TableHead>
                    <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">准时率</TableHead>
                    <TableHead className="h-12 text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">验收率</TableHead>
                    <TableHead className="pr-6 h-12 text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">异常率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providerData.map((provider, index) => (
                    <TableRow key={provider.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                      <TableCell className="pl-6 py-4 font-medium text-slate-700">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                            <AvatarFallback className={`text-xs font-bold ${
                              index === 0 ? 'bg-blue-100 text-blue-600' : 
                              index === 1 ? 'bg-indigo-100 text-indigo-600' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {provider.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">{provider.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600">
                        {provider.deliveryVolume}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Badge
                            variant="outline"
                            className={`rounded-md px-2 py-0.5 border-0 font-medium ${
                              provider.onTimeRate >= 95
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {provider.onTimeRate}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600">
                        {provider.acceptanceRate}%
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <span
                          className={`font-bold text-sm ${
                            provider.exceptionRate > 5
                              ? "text-rose-500"
                              : "text-slate-400"
                          }`}
                        >
                          {provider.exceptionRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Charts */}
        <div className="space-y-8">
          {/* 3. Notifications Card */}
          <NotificationsCard />
        </div>
      </div>
    </div>
  );
}

// --- Nexus Style Components ---

function NexusStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  colorClass,
  bgClass,
  active
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: any;
  trend?: string;
  trendUp?: boolean;
  colorClass: string;
  bgClass: string;
  active?: boolean;
}) {
  return (
    <Card className={`border-none shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group rounded-2xl ${active ? 'bg-gradient-to-br from-white to-blue-50/30 ring-1 ring-blue-100' : 'bg-white'}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass} bg-opacity-50 transition-colors group-hover:scale-110 duration-300`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-bold ${
              trendUp === undefined 
                ? 'bg-slate-50 text-slate-600' 
                : trendUp 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-rose-50 text-rose-600'
            }`}>
              {trendUp !== undefined && (
                trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
              )}
              {trend}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
          <div className="flex items-center justify-between mt-1">
             <p className="text-sm font-medium text-slate-500">{title}</p>
             {subtitle && <span className="text-xs text-rose-500 font-medium animate-pulse">{subtitle}</span>}
          </div>
        </div>
        
        {/* Tiny Area Chart for decoration */}
        <div className="h-8 mt-3 w-full opacity-20 group-hover:opacity-40 transition-opacity">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={trendData}>
               <defs>
                 <linearGradient id={`grad-${colorClass}`} x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="currentColor" className={colorClass} stopOpacity={0.8}/>
                   <stop offset="95%" stopColor="currentColor" className={colorClass} stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <Area type="monotone" dataKey="value" stroke="currentColor" className={colorClass} fill={`url(#grad-${colorClass})`} strokeWidth={2} />
             </AreaChart>
           </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function NexusTaskCard({ data }: { data: any }) {
  const themeColors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-200",
    rose: "bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-200",
  };
  
  const btnTheme: Record<string, string> = {
    blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
    indigo: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
    rose: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
  };

  return (
    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-2xl ${themeColors[data.theme].split(' ').slice(0, 2).join(' ')}`}>
              <data.icon className="w-6 h-6" />
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono text-sm px-2.5 py-0.5">
              {data.count}
            </Badge>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-900">{data.title}</h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{data.description}</p>
          </div>
        </div>
        <div className="px-6 pb-6 pt-0">
          <Button 
            className={`w-full rounded-xl shadow-lg text-white font-medium flex justify-between items-center group-hover:scale-[1.02] transition-transform ${btnTheme[data.theme]}`}
            asChild
          >
            <a href={data.link}>
              {data.action}
              <ArrowRight className="w-4 h-4 opacity-80" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
