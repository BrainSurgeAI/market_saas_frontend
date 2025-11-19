import { TenantType } from "@/lib/types/orderStatus";
import type { OrderStrategy } from "./OrderStrategy";
import { ProviderOrderStrategy } from "./ProviderOrderStrategy";
import { MarketOrderStrategy } from "./MarketOrderStrategy";
import { CustomerOrderStrategy } from "./CustomerOrderStrategy";

// 策略实例缓存
const strategyCache = new Map<string, OrderStrategy>();

export function getOrderStrategy(tenantType: string): OrderStrategy {
  const tenantLower = tenantType.toLowerCase();
  
  // 检查缓存
  if (strategyCache.has(tenantLower)) {
    return strategyCache.get(tenantLower)!;
  }

  // 创建策略实例
  let strategy: OrderStrategy;
  switch (tenantLower) {
    case TenantType.PROVIDER:
      strategy = new ProviderOrderStrategy();
      break;
    case TenantType.MARKET:
      strategy = new MarketOrderStrategy();
      break;
    case TenantType.CUSTOMER:
      strategy = new CustomerOrderStrategy();
      break;
    default:
      throw new Error(`Unknown tenant type: ${tenantType}`);
  }

  // 缓存策略实例
  strategyCache.set(tenantLower, strategy);
  return strategy;
}

