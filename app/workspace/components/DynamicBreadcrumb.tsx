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
  // 添加更多路径映射
}

// 定义要跳过的动态路由段
const isDynamicSegment = (segment: string) => {
  // 检查是否是动态路由段，如 [org_name], [id] 等
  return segment.startsWith('[') && segment.endsWith(']') || 
         // 或者检查实际值，例如 UUID 或特定格式
         /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(segment) ||
         // 检查组织名称格式（如果有特定格式）
         /^[a-z0-9_-]+$/.test(segment) && !Object.keys(pathMap).includes(segment);
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  
  // 忽略空字符串（根路径）
  const pathSegments = pathname.split("/").filter(Boolean)
  
  // 过滤掉不想显示的路径段，并构建新的面包屑路径
  const visibleSegments: {segment: string, href: string}[] = [];
  let currentPath = "";
  
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    
    // 如果不是动态段，或者是我们想要显示的特定动态段，则添加到可见段中
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