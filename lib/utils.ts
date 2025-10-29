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
    "PROCESSING": "备货中",
    "STOCKED": "正在交付",
    "COMPLETED": "已完成",
    "REJECTED": "服务中心处理中",
    "AFTER_SALE": "申请售后",
  };

  return statusMap[status] || status;
}

export function getStatusVariant(status: string): "default" | "success" | "primary" | "warning" | "outline" | "destructive" | "secondary" | "orderPending" | "orderAssigned" | "orderProcessing" | "orderStocked" | "orderCompleted" | "orderCanceled" {
  switch (status) {
    case "COMPLETED":
      return "orderCompleted";
    case "STOCKED":
      return "orderStocked";
    case "PENDING":
      return "orderPending";
    case "PROCESSING":
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