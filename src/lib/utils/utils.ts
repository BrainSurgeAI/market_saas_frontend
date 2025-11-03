import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parse } from "date-fns"
import { OrderStatus } from "@/lib/types/orderStatus"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function translateOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    [OrderStatus.PENDING]: "待指派",
    [OrderStatus.ASSIGNED]: "已指派",
    [OrderStatus.SUPPLIER_PREPARING]: "供应商备货中",
    [OrderStatus.SUPPLIER_DELIVERING]: "供应商正在交付",
    [OrderStatus.MARKET_INSPECTING]: "市场验收中",
    [OrderStatus.MARKET_ACCEPTED]: "市场已验收",
    [OrderStatus.MARKET_DELIVERING]: "配送至客户中",
    [OrderStatus.CUSTOMER_INSPECTING]: "客户验收中",
    [OrderStatus.COMPLETED]: "已完成",
    [OrderStatus.RETURN_REQUESTED]: "申请退货",
    [OrderStatus.RETURNED]: "退货完成",
    [OrderStatus.EXCHANGE_REQUESTED]: "申请换货",
    [OrderStatus.EXCHANGE_IN_PROGRESS]: "换货备货中",
    [OrderStatus.EXCHANGE_DELIVERING]: "换货配送中",
    [OrderStatus.EXCHANGE_INSPECTING]: "换货验收中",
    [OrderStatus.EXCHANGE_NEW_DELIVERING]: "换货新品配送中",
    [OrderStatus.EXCHANGE_COMPLETED]: "换货完成",
    [OrderStatus.CANCELLED]: "已取消",
  };

  return statusMap[status as OrderStatus] ?? status;
}

export function getStatusVariant(status: string): "default" | "success" | "primary" | "warning" | "outline" | "destructive" | "secondary" | "orderPending" | "orderAssigned" | "orderProcessing" | "orderStocked" | "orderCompleted" | "orderCanceled" {
  switch (status) {
    case OrderStatus.COMPLETED:
      return "orderCompleted";
    case OrderStatus.EXCHANGE_COMPLETED:
      return "orderCompleted";
    case OrderStatus.SUPPLIER_DELIVERING:
    case OrderStatus.MARKET_DELIVERING:
    case OrderStatus.EXCHANGE_DELIVERING:
    case OrderStatus.EXCHANGE_NEW_DELIVERING:
      return "orderStocked";
    case OrderStatus.PENDING:
      return "orderPending";
    case OrderStatus.ASSIGNED:
      return "orderAssigned";
    case OrderStatus.SUPPLIER_PREPARING:
    case OrderStatus.EXCHANGE_IN_PROGRESS:
      return "orderProcessing";
    case OrderStatus.MARKET_INSPECTING:
    case OrderStatus.EXCHANGE_INSPECTING:
    case OrderStatus.CUSTOMER_INSPECTING:
      return "primary";
    case OrderStatus.MARKET_ACCEPTED:
      return "success";
    case OrderStatus.RETURN_REQUESTED:
    case OrderStatus.EXCHANGE_REQUESTED:
      return "warning";
    case OrderStatus.RETURNED:
      return "destructive";
    case OrderStatus.CANCELLED:
      return "orderCanceled";
    default:
      return "destructive";
  }
};

// 日期格式转换工具函数
export function formatDateForApi(dateString: string): string {
  if (!dateString) return '';

  let formattedDate = dateString;

  // 如果日期包含"星期"，先去掉星期信息
  if (formattedDate.includes('星期')) {
      formattedDate = formattedDate.split('星期')[0].trim();
  }

  // 如果日期是中文格式（如：2025年03月10日），则转换为标准格式（2025-03-10）
  if (formattedDate.includes('年') && formattedDate.includes('月') && formattedDate.includes('日')) {
      try {
          const parsedDate = parse(formattedDate, 'yyyy年MM月dd日', new Date());
          formattedDate = format(parsedDate, 'yyyy-MM-dd');
      } catch (error) {
          console.error('日期格式转换失败:', error, formattedDate);
      }
  }

  return formattedDate;
};