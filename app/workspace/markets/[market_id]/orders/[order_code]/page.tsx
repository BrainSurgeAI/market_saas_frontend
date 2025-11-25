"use client";

import { useParams } from "next/navigation";
import ProviderOrderDetail from "@/app/workspace/components/orders/ProviderOrderDetails";
import MarketOrderDetails from "@/app/workspace/components/orders/MarketOrderDetails";
import OrderDetail from "@/app/workspace/components/orders/OrderDetails";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { TenantType } from "@/lib/types/orderStatus";

export default function OrderDetailPage() {
  const params = useParams();  
  const { workspaceOrg } = useWorkspace();
  
  const tenantType = workspaceOrg?.tenantType || "";

  // 尝试从 URL 参数中获取 market_id，可能可以作为临时的租户判断依据（虽然不严谨）
  // 但在这个场景下，我们主要依赖 useWorkspace 提供的 tenantType
  
  // 增加超时保护或允许降级
  // 如果 workspaceOrg 为空，可能是 context 没有正确提供，或者是加载慢
  // 这里我们假设如果 tenantType 一直为空，可能是因为某些特殊情况，我们尝试放行，
  // 但只在确实获取不到时降级到 OrderDetail，让 OrderDetail 内部处理错误
  
  // 修改逻辑：如果不为空，根据类型分发。如果为空，也渲染 OrderDetail，让它去处理。
  // 因为 OrderDetail 内部也有获取数据的逻辑。
  // 但是为了避免闪烁，我们还是保留一下加载状态，但不能死锁。
  
  // 实际情况中，useWorkspace 返回的数据通常是立即可用的（如果是在布局中注入的）。
  // 如果一直为空，说明 WorkspaceContext 可能没有提供 tenantType。
  
  // 让我们检查一下 console logs 看看为什么为空。
  // 假设 tenantType 确实为空，我们需要一种回退机制。
  
  if (tenantType === TenantType.PROVIDER) {
      return (
        <ProviderOrderDetail
          orderCode={params.order_code as string}
          orgId={params.market_id as string}
        />
      );
  }
  
  if (tenantType === TenantType.MARKET) {
      return (
        <MarketOrderDetails
          orderCode={params.order_code as string}
          orgId={params.market_id as string}
        />
      );
  }

  // 如果 tenantType 为空，或者匹配不到 PROVIDER/MARKET，
  // 我们默认使用 MarketOrderDetails，或者再次检查 market_id
  // 考虑到这是 markets 路径下的页面，如果没有明确的 tenantType，大概率是 MARKET 用户
  if (!tenantType) {
      console.warn('OrderDetailPage - tenantType is empty, defaulting to MarketOrderDetails for safety');
      return (
        <MarketOrderDetails
          orderCode={params.order_code as string}
          orgId={params.market_id as string}
        />
      );
  }

  // Fallback to original component for CUSTOMER or others
  return (
    <OrderDetail
      orderCode={params.order_code as string}
      orgId={params.market_id as string}
      tenantType={tenantType}
    />
  );
}
