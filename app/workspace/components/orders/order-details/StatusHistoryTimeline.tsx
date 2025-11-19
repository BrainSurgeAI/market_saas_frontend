import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, ChevronUp, ChevronDown } from "lucide-react";
import { StatusHistoryItem } from "@/lib/types/orderStatus";
import { OrderStatus } from "@/lib/types/orderStatus";

interface StatusHistoryTimelineProps {
  statusHistory: StatusHistoryItem[];
  currentStatus: string;
}

// 状态显示名称映射
const statusLabelMap: Record<string, string> = {
  PENDING: "待处理",
  ASSIGNED: "已分配",
  SUPPLIER_PREPARING: "供应商备货中",
  SUPPLIER_DELIVERING: "供应商配送中",
  MARKET_INSPECTING: "市场验收中",
  MARKET_ACCEPTED: "市场已验收",
  MARKET_DELIVERING: "市场配送中",
  CUSTOMER_INSPECTING: "客户验收中",
  COMPLETED: "已完成",
  RETURN_REQUESTED: "退货申请中",
  RETURNED: "已退货",
  EXCHANGE_REQUESTED: "换货申请中",
  EXCHANGE_IN_PROGRESS: "换货备货中",
  EXCHANGE_DELIVERING: "换货配送中",
  EXCHANGE_INSPECTING: "换货验收中",
  EXCHANGE_NEW_DELIVERING: "换货新配送中",
  EXCHANGE_COMPLETED: "换货已完成",
  CANCELLED: "已取消",
};

export function StatusHistoryTimeline({ statusHistory, currentStatus }: StatusHistoryTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!statusHistory || statusHistory.length === 0) {
    return null;
  }

  // 按时间排序（从早到晚）
  const sortedHistory = [...statusHistory].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // 默认显示最近3个状态
  const DISPLAY_COUNT = 3;
  const shouldShowExpandButton = sortedHistory.length > DISPLAY_COUNT;
  const visibleHistory = isExpanded ? sortedHistory : sortedHistory.slice(-DISPLAY_COUNT);
  const hiddenCount = sortedHistory.length - DISPLAY_COUNT;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            订单状态历史
          </CardTitle>
          {shouldShowExpandButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs h-7 px-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  展开 ({hiddenCount} 个)
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* 横向时间轴容器 */}
        <div className="relative overflow-x-auto pb-4">
          <div className={`relative ${isExpanded ? 'min-w-[600px]' : 'min-w-[400px]'} px-4`}>
            {/* 时间轴水平线条 */}
            <div className="absolute top-8 left-4 right-4 h-0.5 bg-gray-200"></div>
            
            {/* 状态节点和内容 */}
            <div className="relative flex items-start justify-between gap-2">
              {visibleHistory.map((item, index) => {
                const originalIndex = isExpanded 
                  ? index 
                  : sortedHistory.length - DISPLAY_COUNT + index;
                const isCurrentStatus = item.toStatus === currentStatus;
                const statusLabel = statusLabelMap[item.toStatus] || item.toStatus;
                const date = new Date(item.createdAt);
                const formattedDate = date.toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={originalIndex} className="relative flex flex-col items-center flex-1 min-w-0">
                    {/* 时间轴节点 */}
                    <div className="relative z-10 flex-shrink-0 mb-2">
                      {isCurrentStatus ? (
                        <div className="w-8 h-8 rounded-full bg-primary border-4 border-white shadow-lg flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 border-4 border-white shadow-sm flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>

                    {/* 内容区域 */}
                    <div className="flex flex-col items-center text-center w-full px-1">
                      <div className="flex flex-col items-center gap-1 mb-1">
                        <Badge 
                          variant={isCurrentStatus ? "default" : "secondary"}
                          className={isCurrentStatus ? "bg-primary text-xs" : "text-xs"}
                        >
                          {statusLabel}
                        </Badge>
                        {isCurrentStatus && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            当前
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1 line-clamp-2 leading-tight">{item.changeReason}</p>
                      <p className="text-[10px] text-gray-500 whitespace-nowrap">{formattedDate}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 移动端优化：如果折叠状态，显示折叠提示 */}
        {!isExpanded && shouldShowExpandButton && (
          <div className="block md:hidden mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="w-full text-xs"
            >
              <ChevronDown className="h-3 w-3 mr-1" />
              展开查看全部 {sortedHistory.length} 个状态
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

