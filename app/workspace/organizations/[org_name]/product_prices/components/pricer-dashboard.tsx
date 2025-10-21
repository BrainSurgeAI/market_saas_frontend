"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ClipboardX
} from "lucide-react";

import { StatCard } from "./stat-card";

import { useRouter } from "next/navigation";
import { formatDate } from "date-fns";
import { PriceStatus } from "@/app/models";
import { useWorkspace } from "@/lib/WorkspaceContext";

interface PricerDashboardProps {
  productPrices: PriceStatus[];
  isAuditor?: boolean;
}

export function PricerDashboard({ productPrices: priceStatus, isAuditor: isAuditor = false }: PricerDashboardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { organization } = useWorkspace();


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">加载中...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {!isAuditor && (
        <>
        <div className="mb-6">
          <h2 className="font-bold text-gray-900 text-lg">商品价格管理</h2>
          <p className="text-gray-600 text-sm">{formatDate(new Date(), 'yyyy年MM月dd日')}</p>
        </div>
     
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="今日待报价"
            value={priceStatus.reduce((acc, curr) => acc + curr.products_without_price, 0)}
            icon={<ClipboardList className="h-5 w-5 text-primary" />}
            linkTo={`/workspace/organizations/${organization.nameHash}/product_prices/entry`}
          //trend={5} 
          />
          <StatCard
            title="今日待审核"
            value={priceStatus.reduce((acc, curr) => acc + curr.products_pending, 0)}
            icon={<AlertTriangle className="h-5 w-5 text-primary" />}
            linkTo={`/workspace/organizations/${organization.nameHash}/product_prices/pending`}
          //trend={-2}
          />
          <StatCard
            title="今日已发布"
            value={priceStatus.reduce((acc, curr) => acc + curr.products_published, 0)}
            icon={<CheckCircle className="h-5 w-5 text-primary" />}
            linkTo={`/workspace/organizations/${organization.nameHash}/product_prices/published`}
          //trend={15}
          />
           <StatCard
            title="今日已拒绝"
            value={priceStatus.reduce((acc, curr) => acc + curr.products_rejected, 0)}
            icon={<ClipboardX className="h-5 w-5 text-primary" />}
          //trend={15}
          />
        </div>
        </>
      )}


      <div className="flex flex-wrap gap-3 mb-6">
        {isAuditor && (
          <Button onClick={() => router.push(`/workspace/organizations/${organization.nameHash}/product_prices/entry`)}>
             审核
          </Button>
        )}

        {!isAuditor && (
          <>
            <Button size="sm"  onClick={() => router.push(`/workspace/organizations/${organization.nameHash}/product_prices/entry`)}>
             去报价
            </Button>
          </>
        )}

        <Button variant="outline" size="sm">
          <BarChart3 className="mr-2 h-4 w-4" /> 价格分析
        </Button>
      </div>

      {/* <TaskList tasks={pendingTasks} /> */}
      {/* <Tabs defaultValue="vegetables" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="vegetables" className="text-xs">蔬菜类</TabsTrigger>
          <TabsTrigger value="fruits" className="text-xs">水果类</TabsTrigger>
          <TabsTrigger value="meats" className="text-xs">肉类</TabsTrigger>
        </TabsList>
        <TabsContent value="vegetables">
          <div className="h-[400px]">
            <PriceChart data={vegetablePriceData} />
          </div>
        </TabsContent>
        <TabsContent value="fruits">
          <div className="h-[400px]">
            <PriceChart data={fruitPriceData} />
          </div>
        </TabsContent>
        <TabsContent value="meats">
          <div className="h-[400px]">
            <PriceChart data={meatPriceData} />
          </div>
        </TabsContent>
      </Tabs> */}

      {/* <ActivityFeed activities={activities} /> */}
    </div>
  );
}