import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parse } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function translateOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    "PENDING": "待指派",
    "ASSIGNED": "已指派",
    "SUPPLIER_PREPARING": "供应商备货中",
    "SUPPLIER_DELIVERING": "供应商正在交付",
    "COMPLETED": "已完成",
    "REJECTED": "服务中心处理中",
    "EXCHANGE_REQUESTED": "申请换货",
    "EXCHANGE_IN_PROGRESS": "处理换货中",
    "EXCHANGE_DELIVERING": "换货交付中",
    "EXCHANGE_INSPECTING": "换货验收中",
    "EXCHANGE_NEW_DELIVERING": "换货商品交付中",
    "CANCELLED": "已取消",
    "RETURN_REQUESTED": "申请退货",
  };

  return statusMap[status] || status;
}

export function getStatusVariant(status: string): "default" | "success" | "primary" | "warning" | "outline" | "destructive" | "secondary" | "orderPending" | "orderAssigned" | "orderProcessing" | "orderStocked" | "orderCompleted" | "orderCanceled" {
  switch (status) {
    case "COMPLETED":
      return "orderCompleted";
    case "SUPPLIER_DELIVERING":
      return "orderStocked";
    case "PENDING":
      return "orderPending";
    case "SUPPLIER_PREPARING":
      return "orderProcessing";
    case "ASSIGNED":
      return "orderAssigned";
    case "REJECTED":
      return "warning";
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