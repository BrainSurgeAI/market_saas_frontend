import { Suspense, ReactNode } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { EntityType } from "@/app/types/reconciliationTypes";

interface BreadcrumbConfig {
  label: string;
  href: string;
}

interface InvoiceSettlementsPageLayoutProps {
  entityType: EntityType;
  entityId: string;
  children: ReactNode;
  customBreadcrumbs?: BreadcrumbConfig[];
}

/**
 * 实体类型显示名称映射
 */
const EntityTypeDisplayMap: Record<EntityType, string> = {
  customer: '客户',
  provider: '供应商',
  market: '市场'
};


/**
 * 加载骨架屏组件
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* 统计卡片骨架屏 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 表格骨架屏 */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-4" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 结算单页面共享布局组件
 */
export default function InvoiceSettlementsPageLayout({
  entityType,
  entityId,
  children,
  customBreadcrumbs
}: InvoiceSettlementsPageLayoutProps) {
  return (
    <div className="container mx-auto p-6 space-y-6">

      {/* 页面标题 */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-base font-bold tracking-tight">我的结算单</h1>
      </div>

      {/* 内容区域 */}
      <Suspense fallback={<LoadingSkeleton />}>
        {children}
      </Suspense>
    </div>
  );
} 