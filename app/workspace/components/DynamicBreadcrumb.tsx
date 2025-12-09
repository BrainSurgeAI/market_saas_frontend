"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"
import React from "react"

// 定义路径映射表，将路径段映射为友好名称
const pathMap: Record<string, string> = {
  "workspace": "工作台",
  "organizations": "组织",
  "users": "用户",
  "settings": "设置",
  "pricer": "询价员",
  "dashboard": "仪表盘",
  "product_prices": "报价管理",
  "tasks": "任务",
  "reports": "报表",
  "markets": "市场",
  "orders": "订单管理",
  "providers": "供应商",
  "customers": "客户",
  "invoiceSettlements": "结算单",
  "delivery_staffs": "配送员",
  "inspection": "商品验收",
  // 添加更多路径映射
}

// 定义已知的静态路由段（不会被识别为动态段）
const staticSegments = new Set([
  "workspace",
  "organizations",
  "users",
  "settings",
  "pricer",
  "dashboard",
  "product_prices",
  "tasks",
  "reports",
  "markets",
  "orders",
  "providers",
  "customers",
  "invoiceSettlements",
  "delivery_staffs",
  "inspection",
]);

// 定义要跳过的动态路由段
const isDynamicSegment = (segment: string) => {
  // 如果是已知的静态段，不是动态段
  if (staticSegments.has(segment)) {
    return false;
  }
  
  // 检查是否是动态路由段，如 [org_name], [id] 等（这种情况不应该出现，因为这是实际路径值）
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return true;
  }
  
  // 检查是否是 UUID 格式
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return true;
  }
  
  // 检查是否是纯数字（可能是 ID）
  if (/^\d+$/.test(segment)) {
    return true;
  }
  
  // 检查是否是 hash/ID 格式（6-32 位字母数字混合，如 jkh2urp6）
  // 如果同时包含数字和字母，且不在静态段列表中，很可能是动态段
  const hasNumbers = /\d/.test(segment);
  const hasLetters = /[a-z]/i.test(segment);
  if (hasNumbers && hasLetters && /^[a-z0-9]{6,32}$/i.test(segment)) {
    return true;
  }
  
  return false;
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  
  // 忽略空字符串（根路径）
  const pathSegments = pathname.split("/").filter(Boolean)
  
  // 定义需要跳过的 tenant 类型段（因为 JWT token 中已包含 tenant_type 和 tenant_hash）
  const tenantTypeSegments = new Set(["markets", "providers", "customers"]);
  
  // 过滤掉不想显示的路径段，并构建新的面包屑路径
  const visibleSegments: {segment: string, href: string}[] = [];
  let currentPath = "";
  let skipNext = false; // 标记是否跳过下一个段（用于跳过 tenant ID）
  
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // 如果当前段是 tenant 类型段（markets/providers/customers），跳过它和下一个段（tenant ID）
    if (tenantTypeSegments.has(segment)) {
      skipNext = true;
      return; // 跳过当前段
    }
    
    // 如果标记了跳过下一个段（tenant ID），则跳过
    if (skipNext) {
      skipNext = false;
      return; // 跳过 tenant ID 段
    }
    
    // 如果不是动态段，则添加到可见段中
    // 注意：即使跳过动态段，currentPath 也已经更新，这样后续段的路径才是正确的
    if (!isDynamicSegment(segment)) {
      visibleSegments.push({
        segment,
        href: currentPath
      });
    }
  });
  
  // 构建面包屑项
  const breadcrumbItems = visibleSegments.map((item, index) => {
    // 获取显示名称
    const displayName = pathMap[item.segment] || item.segment;
    
    // 如果是最后一个段，使用 BreadcrumbPage
    const isLastSegment = index === visibleSegments.length - 1;
    
    return (
      <React.Fragment key={item.href}>
        {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
        <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
          {isLastSegment ? (
            <BreadcrumbPage>{displayName}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink href={item.href} asChild>
              <Link href={item.href}>{displayName}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
      </React.Fragment>
    );
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems}
      </BreadcrumbList>
    </Breadcrumb>
  );
}