import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Package, RotateCcw, DollarSign } from "lucide-react";
import type { OrderItem, ExchangeReturnRecord } from "@/lib/types/orderStatus";

interface ReturnListSectionProps {
  returnRecords: ExchangeReturnRecord[];
  orderItems: OrderItem[];
}

export function ReturnListSection({ returnRecords, orderItems }: ReturnListSectionProps) {
  if (returnRecords.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">暂无退货记录</p>
      </div>
    );
  }

  return (
    <>
      {/* 移动端卡片布局 */}
      <div className="block md:hidden space-y-3">
        {returnRecords.map((record) => {
          const orderItem = orderItems.find((item) => item.id === record.orderDetailId);
          const returnAmount = orderItem
            ? (parseFloat(orderItem.discountedUnitPrice) * parseFloat(record.quantity.toString())).toFixed(2)
            : "0.00";

          return (
            <Card key={record.orderDetailId} className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
              <div className="space-y-3">
                {/* 商品信息和状态 */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <RotateCcw className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-900">{record.productName}</h3>
                    </div>
                  </div>
                  {renderStatusBadge(record.status)}
                </div>

                {/* 数量信息 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2 rounded border border-red-100">
                    <div className="text-xs text-gray-500">退货数量</div>
                    <div className="font-mono font-semibold mt-1 text-sm">
                      {record.quantity} {record.unit}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded border border-red-100">
                    <div className="text-xs text-gray-500">退货金额</div>
                    <div className="font-mono font-semibold mt-1 text-sm text-red-600">
                      ¥{returnAmount}
                    </div>
                  </div>
                </div>

                {/* 退货原因 */}
                {record.reason && (
                  <div className="border-t pt-2">
                    <div className="text-xs text-gray-500 mb-1">退货原因</div>
                    <div className="text-sm text-gray-700 bg-white p-2 rounded border border-red-100">
                      {record.reason}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 桌面端表格布局 */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">商品名称</TableHead>
              <TableHead className="text-center">退货数量</TableHead>
              <TableHead className="text-center">单位</TableHead>
              <TableHead className="text-left">退货原因</TableHead>
              <TableHead className="text-center">状态</TableHead>
              <TableHead className="text-right">退货金额</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returnRecords.map((record) => {
              const orderItem = orderItems.find((item) => item.id === record.orderDetailId);
              const returnAmount = orderItem
                ? (parseFloat(orderItem.discountedUnitPrice) * parseFloat(record.quantity.toString())).toFixed(2)
                : "0.00";

              return (
                <TableRow key={record.orderDetailId}>
                  <TableCell className="font-medium">{record.productName}</TableCell>
                  <TableCell className="text-center font-mono">{record.quantity}</TableCell>
                  <TableCell className="text-center">{record.unit}</TableCell>
                  <TableCell>{record.reason || "-"}</TableCell>
                  <TableCell className="text-center">{renderStatusBadge(record.status)}</TableCell>
                  <TableCell className="text-right font-mono">¥{returnAmount}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function renderStatusBadge(status: string) {
  if (status === "PENDING") {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
        待确认
      </Badge>
    );
  }

  if (status === "COMPLETED") {
    return (
      <Badge variant="default" className="bg-green-500 text-white">
        已完成
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
      处理中
    </Badge>
  );
}

