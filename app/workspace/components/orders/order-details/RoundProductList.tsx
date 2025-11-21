import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDownIcon, RotateCcw, RefreshCw, CheckCircle, Package, ChevronUpIcon } from "lucide-react";
import { Order, OrderItem, OperationType, Receipt } from "@/lib/types/orderStatus";
import { ProductStatusSummary } from "./types";
import { RoundGroupedData, getDeliveredQuantityFromRound, getReceivedQuantityFromRound, getCustomerReceivedQuantity, getInspectedQuantityForDisplay, getExchangeQuantityFromReceipts } from "./roundGrouping";

interface RoundProductListProps {
  group: RoundGroupedData;
  orderDetail: Order;
  tenantType: string;
  isEditing: boolean;
  itemErrors: Record<number, string>;
  shouldShowDeliverQuantityColumn: boolean;
  shouldShowReceivedQuantityColumn: boolean;
  shouldShowInspectMenu: boolean;
  shouldShowStatusColumn: boolean;
  handleActualQuantityChange?: (id: number, value: string) => void;
  handleActualQuantityKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>, id: number) => void;
  handleOperation?: (id: number, type: OperationType) => void;
  productStatusSummary: ProductStatusSummary;
  isUnitAllowingDecimal: (unit: string) => boolean;
  inspections?: any[];
  receipts?: Receipt[];
  showRoundTitle?: boolean;
}

export function RoundProductList({
  group,
  orderDetail,
  tenantType,
  isEditing,
  itemErrors,
  shouldShowDeliverQuantityColumn,
  shouldShowReceivedQuantityColumn,
  shouldShowInspectMenu,
  shouldShowStatusColumn,
  handleActualQuantityChange,
  handleActualQuantityKeyDown,
  handleOperation,
  productStatusSummary,
  isUnitAllowingDecimal,
  inspections = [],
  receipts = [],
  showRoundTitle = true,
}: RoundProductListProps) {
  const [isCollapsed, setIsCollapsed] = useState(!group.isLatest);
  const renderStatusBadges = (item: OrderItem, actualStatus: string) => {
    return (
      <div className="flex flex-wrap gap-1">
        {actualStatus === "RETURN" && (
          <Badge variant="secondary" className="bg-red-500 text-white dark:bg-red-600 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />
            退货
          </Badge>
        )}
        {actualStatus === "EXCHANGE" && (
          <Badge variant="secondary" className="bg-orange-500 text-white dark:bg-orange-600 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            换货
          </Badge>
        )}
        {actualStatus === "SIGN" && (
          <Badge variant="secondary" className="bg-green-500 text-white dark:bg-green-600 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            签收
          </Badge>
        )}
      </div>
    );
  };

  // 如果该轮次没有商品，不显示
  if (!group.items || group.items.length === 0) {
    return null;
  }

  // 检查该轮是否有 EXCHANGE 类型的 deliveries
  const hasExchangeDelivery = group.deliveries.some(d => d.deliveryType === 'EXCHANGE');
  const isProvider = tenantType?.toLowerCase() === "provider";
  const isMarket = tenantType?.toLowerCase() === "market";
  const isCustomer = tenantType?.toLowerCase() === "customer";
  const isExchangeInProgress = orderDetail?.orderStatus === "EXCHANGE_IN_PROGRESS";
  const isLatestRound = group.isLatest;

  // group.inspections已经只包含当前轮次的inspections

  return (
    <Card className={isLatestRound ? "border-2 border-blue-500 shadow-lg shadow-blue-100" : ""}>
      {showRoundTitle && (
        <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-blue-50/50 transition-colors">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  第 {group.round} 轮配送
                  {isLatestRound && (
                    <Badge className="bg-primary text-white text-xs ml-2">最新</Badge>
                  )}
                  {isCollapsed ? (
                    <ChevronDownIcon className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronUpIcon className="h-4 w-4 ml-2" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <CardDescription>
                    {group.deliveries.length > 0 && group.deliveries[0].deliveredAt && (
                      <span className="text-xs">
                        配送时间: {new Date(group.deliveries[0].deliveredAt).toLocaleString('zh-CN')}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-4">
        {/* 移动端卡片布局 */}
        <div className="block md:hidden space-y-3">
          {group.items.map((item) => {
            const actualStatus = productStatusSummary.itemStatusMap[item.id] || "PENDING";
            const canEdit = !["SIGN", "RETURN", "EXCHANGE"].includes(actualStatus);
            const canEditThisRound = isProvider && isExchangeInProgress ? isLatestRound : true;
            const canEditQuantity = canEdit && canEditThisRound;


            // 获取数量显示值
            // 每个轮次都只显示该轮次的验收数据，不累加之前轮次的数据
            const marketReceivedQtyForDisplay = getReceivedQuantityFromRound(item.id, "MARKET", group.inspections);
            const customerReceivedQtyForDisplay = getReceivedQuantityFromRound(item.id, "CUSTOMER", group.inspections);
            
            const deliveredQuantityFromRound = isCustomer
              ? getReceivedQuantityFromRound(item.id, "MARKET", group.inspections)
              : ((isProvider || isMarket)
                ? getDeliveredQuantityFromRound(item.id, group.deliveries)
                : "0");
            
            const customerReceivedQtyForCustomer = isCustomer 
              ? getCustomerReceivedQuantity(item.id, inspections)
              : "";

            // 小计计算
            const deliveredQtyForSubtotal = isEditing && (item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity
              ? parseFloat((item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || "0")
              : parseFloat(deliveredQuantityFromRound) || 0;
            const customerReceivedQtyValue = customerReceivedQtyForDisplay ? parseFloat(customerReceivedQtyForDisplay) : 0;
            const marketReceivedQtyValue = marketReceivedQtyForDisplay ? parseFloat(marketReceivedQtyForDisplay) : 0;
            const orderedQtyValue = parseFloat(item.orderedQty) || 0;
            const subtotalQuantity = customerReceivedQtyValue > 0 
              ? customerReceivedQtyValue
              : (marketReceivedQtyValue > 0 
                ? marketReceivedQtyValue 
                : (deliveredQtyForSubtotal > 0 
                  ? deliveredQtyForSubtotal 
                  : orderedQtyValue));

            const shouldShowInput = isEditing && canEditQuantity;
            const forceShowInput = isProvider && isExchangeInProgress && isLatestRound && canEdit && !isEditing;

            return (
              <Card key={item.id} className="p-4">
                <div className="space-y-3">
                  {/* 商品名称、类别和状态 */}
                  <div>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
                      </div>
                      {shouldShowStatusColumn && (
                        <div className="ml-2 flex-shrink-0">
                          {(() => {
                            const hasInspection = inspections.some(ins => 
                              ins.items?.some((inspectionItem: any) => inspectionItem.orderDetailId === item.id)
                            );
                            
                            if (isProvider && isExchangeInProgress && isLatestRound && !hasInspection && actualStatus === "PENDING") {
                              return <span className="text-gray-400 text-xs">-</span>;
                            }
                            
                            return renderStatusBadges(item, actualStatus);
                          })()}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">类别: {item.category}</p>
                    {(item.processingRequirements || item.remark) && (
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        {item.processingRequirements && <div className="p-2 bg-gray-50 rounded">{item.processingRequirements}</div>}
                        {item.remark && <div>备注: {item.remark}</div>}
                      </div>
                    )}
                  </div>

                  {/* 数量信息 */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">{hasExchangeDelivery ? '换货数量' : '下单数量'}</div>
                      <div className="font-mono font-semibold mt-1">
                        {hasExchangeDelivery
                          ? (getExchangeQuantityFromReceipts(item.productId, receipts) || parseFloat(item.orderedQty).toFixed(2))
                          : parseFloat(item.orderedQty).toFixed(2)
                        } {item.unit}
                      </div>
                    </div>
                    {shouldShowDeliverQuantityColumn && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">发货数量</div>
                        {shouldShowInput || forceShowInput ? (
                          <div className="mt-1">
                            <Input
                              type="number"
                              value={(item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity ?? ""}
                              onChange={(event) => handleActualQuantityChange?.(item.id, event.target.value)}
                              className={`w-full text-center font-mono font-semibold text-sm ${itemErrors[item.id] ? "border-red-500" : ""}`}
                              step={isUnitAllowingDecimal(item.unit) ? "0.01" : "1"}
                              min="0"
                              max="999999.99"
                              onKeyDown={(event) => handleActualQuantityKeyDown?.(event, item.id)}
                              disabled={!canEditQuantity}
                              placeholder="输入数量"
                            />
                            {itemErrors[item.id] && <p className="text-xs text-red-500 mt-1">{itemErrors[item.id]}</p>}
                          </div>
                        ) : (
                          <div className="font-mono font-semibold mt-1">
                            {parseFloat(deliveredQuantityFromRound) > 0 ? `${parseFloat(deliveredQuantityFromRound).toFixed(2)} ${item.unit}` : "-"}
                          </div>
                        )}
                      </div>
                    )}
                    {shouldShowReceivedQuantityColumn && !isCustomer && (
                      <>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500">市场接收</div>
                          <div className="font-mono font-semibold mt-1">{marketReceivedQtyForDisplay || "-"}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500">客户接收</div>
                          <div className="font-mono font-semibold mt-1">{customerReceivedQtyForDisplay || "-"}</div>
                        </div>
                      </>
                    )}
                    {shouldShowReceivedQuantityColumn && isCustomer && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">收货量</div>
                        <div className="font-mono font-semibold mt-1">{customerReceivedQtyForCustomer || "-"}</div>
                      </div>
                    )}
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">折扣价</div>
                      <div className="font-mono font-semibold mt-1">¥{parseFloat(item.discountedUnitPrice).toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">小计（折后）</div>
                      <div className="font-mono font-semibold mt-1 text-blue-600">¥{(parseFloat(item.discountedUnitPrice) * subtotalQuantity).toFixed(2)}</div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  {shouldShowInspectMenu && handleOperation && (
                    <div className="flex justify-end">
                      {actualStatus === "PENDING" && canEdit ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              操作
                              <ChevronDownIcon className="ml-1 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.SIGN)} className="cursor-pointer text-xs">
                              签收
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.RETURN)} className="cursor-pointer text-xs">
                              退货
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.EXCHANGE)} className="cursor-pointer text-xs">
                              换货
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Badge variant="outline" className="rounded-full bg-gray-50 text-gray-500 border-gray-200">
                          -
                        </Badge>
                      )}
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
            <colgroup>
              <col className="w-[200px]" />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
              {shouldShowDeliverQuantityColumn && <col className="w-[120px]" />}
              {shouldShowReceivedQuantityColumn && !isCustomer && <col />}
              {shouldShowReceivedQuantityColumn && !isCustomer && <col />}
              {shouldShowReceivedQuantityColumn && isCustomer && <col />}
              <col className="w-[80px]" />
              <col className="w-[100px]" />
              <col className="w-[120px]" />
              {shouldShowInspectMenu && handleOperation && <col className="w-[100px]" />}
              {shouldShowStatusColumn && <col className="w-[100px]" />}
            </colgroup>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-left p-3 border-b">商品名称</TableHead>
                <TableHead className="text-left p-3 border-b">类别</TableHead>
                <TableHead className="text-center p-3 border-b">
                  {hasExchangeDelivery ? '换货数量' : '下单数量'}
                </TableHead>
                {shouldShowDeliverQuantityColumn && <TableHead className="text-center p-3 border-b">发货数量</TableHead>}
                {shouldShowReceivedQuantityColumn && tenantType?.toLowerCase() !== "customer" && <TableHead className="text-center p-3 border-b">市场接收</TableHead>}
                {shouldShowReceivedQuantityColumn && tenantType?.toLowerCase() !== "customer" && <TableHead className="text-center p-3 border-b">客户接收</TableHead>}
                {shouldShowReceivedQuantityColumn && tenantType?.toLowerCase() === "customer" && <TableHead className="text-center p-3 border-b">收货量</TableHead>}
                <TableHead className="text-center p-3 border-b">单位</TableHead>
                <TableHead className="text-right p-3 border-b">折扣价</TableHead>
                <TableHead className="text-right p-3 border-b">小计（折后）</TableHead>
                {shouldShowInspectMenu && handleOperation && <TableHead className="text-right p-3 border-b">操作</TableHead>}
                {shouldShowStatusColumn && <TableHead className="text-center p-3 border-b">状态</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.items.map((item) => {
                const actualStatus = productStatusSummary.itemStatusMap[item.id] || "PENDING";
                const canEdit = !["SIGN", "RETURN", "EXCHANGE"].includes(actualStatus);
                const canEditThisRound = isProvider && isExchangeInProgress ? isLatestRound : true;
                const canEditQuantity = canEdit && canEditThisRound;

                // 每个轮次都只显示该轮次的验收数据，不累加之前轮次的数据
                const marketReceivedQty = getReceivedQuantityFromRound(item.id, "MARKET", group.inspections);
                const customerReceivedQty = getReceivedQuantityFromRound(item.id, "CUSTOMER", group.inspections);
                
                const deliveredQuantityFromRound = isCustomer
                  ? getReceivedQuantityFromRound(item.id, "MARKET", group.inspections)
                  : ((isProvider || isMarket)
                    ? getDeliveredQuantityFromRound(item.id, group.deliveries)
                    : "0");
                
                const customerReceivedQtyForCustomer = isCustomer 
                  ? getCustomerReceivedQuantity(item.id, inspections)
                  : "";

                const deliveredQtyForSubtotal = isEditing && (item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity
                  ? parseFloat((item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || "0")
                  : parseFloat(deliveredQuantityFromRound) || 0;
                const customerReceivedQtyValue = customerReceivedQty ? parseFloat(customerReceivedQty) : 0;
                const marketReceivedQtyValue = marketReceivedQty ? parseFloat(marketReceivedQty) : 0;
                const orderedQtyValue = parseFloat(item.orderedQty) || 0;
                const subtotalQuantity = customerReceivedQtyValue > 0 
                  ? customerReceivedQtyValue
                  : (marketReceivedQtyValue > 0 
                    ? marketReceivedQtyValue 
                    : (deliveredQtyForSubtotal > 0 
                      ? deliveredQtyForSubtotal 
                      : orderedQtyValue));

                const shouldShowInput = isEditing && canEditQuantity;
                const forceShowInput = isProvider && isExchangeInProgress && isLatestRound && canEdit && !isEditing;


                return (
                  <TableRow key={item.id} className="text-xs text-gray-700">
                    <TableCell className="p-2 border-b">
                      {item.name}
                      {(item.processingRequirements || item.remark) && (
                        <div className="mt-1 text-xs text-gray-500">
                          {item.processingRequirements && <div className="mb-1">{item.processingRequirements}</div>}
                          {item.remark && <div>备注: {item.remark}</div>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="p-2 border-b">{item.category}</TableCell>
                    <TableCell className="p-2 text-center border-b font-mono font-semibold">
                      {hasExchangeDelivery
                        ? (getExchangeQuantityFromReceipts(item.productId, receipts) || parseFloat(item.orderedQty).toFixed(2))
                        : parseFloat(item.orderedQty).toFixed(2)
                      }
                    </TableCell>
                    {shouldShowDeliverQuantityColumn && (
                      <TableCell className="p-2 text-center border-b w-[120px]">
                        {shouldShowInput || forceShowInput ? (
                          <div>
                            <Input
                              type="number"
                              value={(item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || ""}
                              onChange={(event) => handleActualQuantityChange?.(item.id, event.target.value)}
                              className={`max-w-[100px] text-center font-mono font-semibold ${itemErrors[item.id] ? "border-red-500" : ""}`}
                              step={isUnitAllowingDecimal(item.unit) ? "0.01" : "1"}
                              min="0"
                              max="999999.99"
                              onKeyDown={(event) => handleActualQuantityKeyDown?.(event, item.id)}
                              disabled={!canEditQuantity}
                              placeholder="0.00"
                            />
                            {itemErrors[item.id] && <p className="text-xs text-red-500 mt-1">{itemErrors[item.id]}</p>}
                          </div>
                        ) : (
                          <span className="font-mono font-semibold">
                            {parseFloat(deliveredQuantityFromRound) > 0 ? parseFloat(deliveredQuantityFromRound).toFixed(2) : "-"}
                          </span>
                        )}
                      </TableCell>
                    )}
                    {shouldShowReceivedQuantityColumn && !isCustomer && (
                      <TableCell className="p-2 text-center border-b font-mono font-semibold">
                        {marketReceivedQty || "-"}
                      </TableCell>
                    )}
                    {shouldShowReceivedQuantityColumn && !isCustomer && (
                      <TableCell className="p-2 text-center border-b font-mono font-semibold">
                        {customerReceivedQty || "-"}
                      </TableCell>
                    )}
                    {shouldShowReceivedQuantityColumn && isCustomer && (
                      <TableCell className="p-2 text-center border-b font-mono font-semibold">
                        {customerReceivedQtyForCustomer || "-"}
                      </TableCell>
                    )}
                    <TableCell className="p-2 text-center border-b font-mono">{item.unit}</TableCell>
                    <TableCell className="p-2 text-right border-b font-mono font-semibold">¥{parseFloat(item.discountedUnitPrice).toFixed(2)}</TableCell>
                    <TableCell className="p-2 text-right border-b font-mono font-semibold">
                      ¥{(parseFloat(item.discountedUnitPrice) * subtotalQuantity).toFixed(2)}
                    </TableCell>
                    {shouldShowInspectMenu && handleOperation && (
                      <TableCell className="p-2 text-right border-b">
                        {actualStatus === "PENDING" && canEdit ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                ...
                                <ChevronDownIcon className="ml-1 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.SIGN)} className="cursor-pointer text-xs">
                                签收
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.RETURN)} className="cursor-pointer text-xs">
                                退货
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.EXCHANGE)} className="cursor-pointer text-xs">
                                换货
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge variant="outline" className="rounded-full bg-gray-50 text-gray-500 border-gray-200">
                            -
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    {shouldShowStatusColumn && (
                      <TableCell className="p-2 text-center border-b">
                        {(() => {
                          const hasInspection = inspections.some(ins => 
                            ins.items?.some((inspectionItem: any) => inspectionItem.orderDetailId === item.id)
                          );
                          
                          if (isProvider && isExchangeInProgress && isLatestRound && !hasInspection && actualStatus === "PENDING") {
                            return <span className="text-gray-400">-</span>;
                          }
                          
                          return renderStatusBadges(item, actualStatus);
                        })()}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      )}
      {!showRoundTitle && (
        <CardContent className="pt-4">
          {/* 移动端卡片布局 */}
          <div className="block md:hidden space-y-3">
            {group.items.map((item) => {
              const actualStatus = productStatusSummary.itemStatusMap[item.id] || "PENDING";
              const canEdit = !["SIGN", "RETURN", "EXCHANGE"].includes(actualStatus);
              const canEditThisRound = isProvider && isExchangeInProgress ? isLatestRound : true;
              const canEditQuantity = canEdit && canEditThisRound;

            // 获取数量显示值
            // 发货数量、市场接收、客户接收都按对应轮数的deliveries和inspections显示
            const marketReceivedQtyForDisplay = getReceivedQuantityFromRound(item.id, "MARKET", group.inspections);
            const customerReceivedQtyForDisplay = getReceivedQuantityFromRound(item.id, "CUSTOMER", group.inspections);

              const deliveredQuantityFromRound = isCustomer
                ? getReceivedQuantityFromRound(item.id, "MARKET", group.inspections)
                : ((isProvider || isMarket)
                  ? getDeliveredQuantityFromRound(item.id, group.deliveries)
                  : "0");

              const customerReceivedQtyForCustomer = isCustomer
                ? getCustomerReceivedQuantity(item.id, inspections)
                : "";

              // 小计计算
              const deliveredQtyForSubtotal = isEditing && (item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity
                ? parseFloat((item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || "0")
                : parseFloat(deliveredQuantityFromRound) || 0;
              const customerReceivedQtyValue = customerReceivedQtyForDisplay ? parseFloat(customerReceivedQtyForDisplay) : 0;
              const marketReceivedQtyValue = marketReceivedQtyForDisplay ? parseFloat(marketReceivedQtyForDisplay) : 0;
              const orderedQtyValue = parseFloat(item.orderedQty) || 0;
              const subtotalQuantity = customerReceivedQtyValue > 0
                ? customerReceivedQtyValue
                : (marketReceivedQtyValue > 0
                  ? marketReceivedQtyValue
                  : (deliveredQtyForSubtotal > 0
                    ? deliveredQtyForSubtotal
                    : orderedQtyValue));

              const shouldShowInput = isEditing && canEditQuantity;
              const forceShowInput = isProvider && isExchangeInProgress && isLatestRound && canEdit && !isEditing;

              return (
                <Card key={item.id} className="p-4">
                  <div className="space-y-3">
                    {/* 商品名称、类别和状态 */}
                    <div>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
                        </div>
                        {shouldShowStatusColumn && (
                          <div className="ml-2 flex-shrink-0">
                            {renderStatusBadges(item, actualStatus)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">类别: {item.category}</p>
                      {(item.processingRequirements || item.remark) && (
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          {item.processingRequirements && <div className="p-2 bg-gray-50 rounded">{item.processingRequirements}</div>}
                          {item.remark && <div>备注: {item.remark}</div>}
                        </div>
                      )}
                    </div>

                    {/* 数量信息 */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">{hasExchangeDelivery ? '换货数量' : '下单数量'}</div>
                        <div className="font-mono font-semibold mt-1">
                          {hasExchangeDelivery
                            ? (getExchangeQuantityFromReceipts(item.productId, receipts) || parseFloat(item.orderedQty).toFixed(2))
                            : parseFloat(item.orderedQty).toFixed(2)
                          } {item.unit}
                        </div>
                      </div>
                      {shouldShowDeliverQuantityColumn && (
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500">发货数量</div>
                          {shouldShowInput || forceShowInput ? (
                            <div className="mt-1">
                              <Input
                                type="number"
                                value={(item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || ""}
                                onChange={(event) => handleActualQuantityChange?.(item.id, event.target.value)}
                                className={`w-full text-center font-mono font-semibold text-sm ${itemErrors[item.id] ? "border-red-500" : ""}`}
                                step={isUnitAllowingDecimal(item.unit) ? "0.01" : "1"}
                                min="0"
                                max="999999.99"
                                onKeyDown={(event) => handleActualQuantityKeyDown?.(event, item.id)}
                                disabled={!canEditQuantity}
                                placeholder="0.00"
                              />
                              {itemErrors[item.id] && <p className="text-xs text-red-500 mt-1">{itemErrors[item.id]}</p>}
                            </div>
                          ) : (
                            <div className="font-mono font-semibold mt-1">
                              {parseFloat(deliveredQuantityFromRound) > 0 ? `${parseFloat(deliveredQuantityFromRound).toFixed(2)} ${item.unit}` : "-"}
                            </div>
                          )}
                        </div>
                      )}
                      {shouldShowReceivedQuantityColumn && !isCustomer && (
                        <>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-xs text-gray-500">市场接收</div>
                            <div className="font-mono font-semibold mt-1">{marketReceivedQtyForDisplay || "-"}</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-xs text-gray-500">客户接收</div>
                            <div className="font-mono font-semibold mt-1">{customerReceivedQtyForDisplay || "-"}</div>
                          </div>
                        </>
                      )}
                      {shouldShowReceivedQuantityColumn && isCustomer && (
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500">收货量</div>
                          <div className="font-mono font-semibold mt-1">{customerReceivedQtyForCustomer || "-"}</div>
                        </div>
                      )}
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">折扣价</div>
                        <div className="font-mono font-semibold mt-1">¥{parseFloat(item.discountedUnitPrice).toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">小计（折后）</div>
                        <div className="font-mono font-semibold mt-1 text-blue-600">¥{(parseFloat(item.discountedUnitPrice) * subtotalQuantity).toFixed(2)}</div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    {shouldShowInspectMenu && handleOperation && (
                      <div className="flex justify-end">
                        {actualStatus === "PENDING" && canEdit ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                操作
                                <ChevronDownIcon className="ml-1 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.SIGN)} className="cursor-pointer text-xs">
                                签收
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.RETURN)} className="cursor-pointer text-xs">
                                退货
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.EXCHANGE)} className="cursor-pointer text-xs">
                                换货
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge variant="outline" className="rounded-full bg-gray-50 text-gray-500 border-gray-200">
                            -
                          </Badge>
                        )}
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
              <colgroup>
                <col className="w-[200px]" />
                <col className="w-[100px]" />
                <col className="w-[100px]" />
                {shouldShowDeliverQuantityColumn && <col className="w-[120px]" />}
                {shouldShowReceivedQuantityColumn && !isCustomer && <col />}
                {shouldShowReceivedQuantityColumn && !isCustomer && <col />}
                {shouldShowReceivedQuantityColumn && isCustomer && <col />}
                <col className="w-[80px]" />
                <col className="w-[100px]" />
                <col className="w-[120px]" />
                {shouldShowInspectMenu && handleOperation && <col className="w-[100px]" />}
                {shouldShowStatusColumn && <col className="w-[100px]" />}
              </colgroup>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-left p-3 border-b">商品名称</TableHead>
                  <TableHead className="text-left p-3 border-b">类别</TableHead>
                  <TableHead className="text-center p-3 border-b">
                    {hasExchangeDelivery ? '换货数量' : '下单数量'}
                  </TableHead>
                  {shouldShowDeliverQuantityColumn && <TableHead className="text-center p-3 border-b">发货数量</TableHead>}
                  {shouldShowReceivedQuantityColumn && tenantType?.toLowerCase() !== "customer" && <TableHead className="text-center p-3 border-b">市场接收</TableHead>}
                  {shouldShowReceivedQuantityColumn && tenantType?.toLowerCase() !== "customer" && <TableHead className="text-center p-3 border-b">客户接收</TableHead>}
                  {shouldShowReceivedQuantityColumn && tenantType?.toLowerCase() === "customer" && <TableHead className="text-center p-3 border-b">收货量</TableHead>}
                  <TableHead className="text-center p-3 border-b">单位</TableHead>
                  <TableHead className="text-right p-3 border-b">折扣价</TableHead>
                  <TableHead className="text-right p-3 border-b">小计（折后）</TableHead>
                  {shouldShowInspectMenu && handleOperation && <TableHead className="text-right p-3 border-b">操作</TableHead>}
                  {shouldShowStatusColumn && <TableHead className="text-center p-3 border-b">状态</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.items.map((item) => {
                  const actualStatus = productStatusSummary.itemStatusMap[item.id] || "PENDING";
                  const canEdit = !["SIGN", "RETURN", "EXCHANGE"].includes(actualStatus);
                  const canEditThisRound = isProvider && isExchangeInProgress ? isLatestRound : true;
                  const canEditQuantity = canEdit && canEditThisRound;

                // 市场接收、客户接收都按对应轮数的inspections显示
                const marketReceivedQty = getReceivedQuantityFromRound(item.id, "MARKET", group.inspections);
                const customerReceivedQty = getReceivedQuantityFromRound(item.id, "CUSTOMER", group.inspections);

                  const deliveredQuantityFromRound = isCustomer
                    ? getReceivedQuantityFromRound(item.id, "MARKET", group.inspections)
                    : ((isProvider || isMarket)
                      ? getDeliveredQuantityFromRound(item.id, group.deliveries)
                      : "0");

                  const customerReceivedQtyForCustomer = isCustomer
                    ? getCustomerReceivedQuantity(item.id, inspections)
                    : "";

                  const deliveredQtyForSubtotal = isEditing && (item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity
                    ? parseFloat((item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || "0")
                    : parseFloat(deliveredQuantityFromRound) || 0;
                  const customerReceivedQtyValue = customerReceivedQty ? parseFloat(customerReceivedQty) : 0;
                  const marketReceivedQtyValue = marketReceivedQty ? parseFloat(marketReceivedQty) : 0;
                  const orderedQtyValue = parseFloat(item.orderedQty) || 0;
                  const subtotalQuantity = customerReceivedQtyValue > 0
                    ? customerReceivedQtyValue
                    : (marketReceivedQtyValue > 0
                      ? marketReceivedQtyValue
                      : (deliveredQtyForSubtotal > 0
                        ? deliveredQtyForSubtotal
                        : orderedQtyValue));

                  const shouldShowInput = isEditing && canEditQuantity;
                  const forceShowInput = isProvider && isExchangeInProgress && isLatestRound && canEdit && !isEditing;

                  return (
                    <TableRow key={item.id} className="text-xs text-gray-700">
                      <TableCell className="p-2 border-b">
                        {item.name}
                        {(item.processingRequirements || item.remark) && (
                          <div className="mt-1 text-xs text-gray-500">
                            {item.processingRequirements && <div className="mb-1">{item.processingRequirements}</div>}
                            {item.remark && <div>备注: {item.remark}</div>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="p-2 border-b">{item.category}</TableCell>
                      <TableCell className="p-2 text-center border-b font-mono font-semibold">
                        {hasExchangeDelivery
                          ? (getExchangeQuantityFromReceipts(item.productId, receipts) || parseFloat(item.orderedQty).toFixed(2))
                          : parseFloat(item.orderedQty).toFixed(2)
                        }
                      </TableCell>
                      {shouldShowDeliverQuantityColumn && (
                        <TableCell className="p-2 text-center border-b w-[120px]">
                          {shouldShowInput || forceShowInput ? (
                            <div>
                              <Input
                                type="number"
                                value={(item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || ""}
                                onChange={(event) => handleActualQuantityChange?.(item.id, event.target.value)}
                                className={`max-w-[100px] text-center font-mono font-semibold ${itemErrors[item.id] ? "border-red-500" : ""}`}
                                step={isUnitAllowingDecimal(item.unit) ? "0.01" : "1"}
                                min="0"
                                max="999999.99"
                                onKeyDown={(event) => handleActualQuantityKeyDown?.(event, item.id)}
                                disabled={!canEditQuantity}
                                placeholder="0.00"
                              />
                              {itemErrors[item.id] && <p className="text-xs text-red-500 mt-1">{itemErrors[item.id]}</p>}
                            </div>
                          ) : (
                            <span className="font-mono font-semibold">
                              {parseFloat(deliveredQuantityFromRound) > 0 ? parseFloat(deliveredQuantityFromRound).toFixed(2) : "-"}
                            </span>
                          )}
                        </TableCell>
                      )}
                      {shouldShowReceivedQuantityColumn && !isCustomer && (
                        <TableCell className="p-2 text-center border-b font-mono font-semibold">
                          {marketReceivedQty || "-"}
                        </TableCell>
                      )}
                      {shouldShowReceivedQuantityColumn && !isCustomer && (
                        <TableCell className="p-2 text-center border-b font-mono font-semibold">
                          {customerReceivedQty || "-"}
                        </TableCell>
                      )}
                      {shouldShowReceivedQuantityColumn && isCustomer && (
                        <TableCell className="p-2 text-center border-b font-mono font-semibold">
                          {customerReceivedQtyForCustomer || "-"}
                        </TableCell>
                      )}
                      <TableCell className="p-2 text-center border-b font-mono">{item.unit}</TableCell>
                      <TableCell className="p-2 text-right border-b font-mono font-semibold">¥{parseFloat(item.discountedUnitPrice).toFixed(2)}</TableCell>
                      <TableCell className="p-2 text-right border-b font-mono font-semibold">
                        ¥{(parseFloat(item.discountedUnitPrice) * subtotalQuantity).toFixed(2)}
                      </TableCell>
                      {shouldShowInspectMenu && handleOperation && (
                        <TableCell className="p-2 text-right border-b">
                          {actualStatus === "PENDING" && canEdit ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  ...
                                  <ChevronDownIcon className="ml-1 h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.SIGN)} className="cursor-pointer text-xs">
                                  签收
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.RETURN)} className="cursor-pointer text-xs">
                                  退货
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOperation(item.id, OperationType.EXCHANGE)} className="cursor-pointer text-xs">
                                  换货
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Badge variant="outline" className="rounded-full bg-gray-50 text-gray-500 border-gray-200">
                              -
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {shouldShowStatusColumn && (
                        <TableCell className="p-2 text-center border-b">
                          {(() => {
                            const hasInspection = inspections.some(ins =>
                              ins.items?.some((inspectionItem: any) => inspectionItem.orderDetailId === item.id)
                            );

                            if (isProvider && isExchangeInProgress && isLatestRound && !hasInspection && actualStatus === "PENDING") {
                              return <span className="text-gray-400">-</span>;
                            }

                            return renderStatusBadges(item, actualStatus);
                          })()}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

