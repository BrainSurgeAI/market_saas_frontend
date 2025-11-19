import { Fragment } from "react";
import { Card, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, RotateCcw, RefreshCw, CheckCircle } from "lucide-react";
import { Order, OrderItem, OperationType, Receipt } from "@/lib/types/orderStatus";
import { ProductStatusSummary } from "./types";
import { RoundGroupedData, getDeliveredQuantityFromRound, getReceivedQuantityFromRound, getCustomerReceivedQuantity, getInspectedQuantityForDisplay } from "./roundGrouping";
import { RoundProductList } from "./RoundProductList";

interface ProductListSectionProps {
  orderDetail: Order;
  orderItems: OrderItem[];
  tenantType: string;
  isEditing: boolean;
  itemErrors: Record<number, string>;
  shouldShowDeliverQuantityColumn: boolean;
  shouldShowReceivedQuantityColumn: boolean;
  shouldShowInspectMenu: boolean;
  shouldShowStatusColumn: boolean;
  handleActualQuantityChange?: (id: number, value: string) => void;
  handleActualQuantityKeyDown: (event: React.KeyboardEvent<HTMLInputElement>, id: number) => void;
  handleOperation: (id: number, type: OperationType) => void;
  productStatusSummary: ProductStatusSummary;
  isUnitAllowingDecimal: (unit: string) => boolean;
  roundGroups?: RoundGroupedData[];
  inspections?: any[];
  receipts?: Receipt[];
}

export function ProductListSection({
  orderDetail,
  orderItems,
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
  roundGroups,
  inspections = [],
  receipts = [],
}: ProductListSectionProps) {
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

  // 如果有轮数分组数据，按轮数分组显示
  if (roundGroups && roundGroups.length > 0) {
    // 检查是否有任何轮次包含商品
    const hasItems = roundGroups.some(group => group.items && group.items.length > 0);
    
    // 如果所有轮次都没有商品，回退到显示所有商品
    if (!hasItems) {
      // 继续执行下面的代码，显示所有商品
    } else {
      // 如果只有一个轮次且是第一轮，不显示轮数标题
      const shouldShowRoundTitle = !(roundGroups.length === 1 && roundGroups[0].round === 1);
      
      return (
        <div className="space-y-4">
          {roundGroups.map((group) => (
            <RoundProductList
              key={group.round}
              group={group}
              orderDetail={orderDetail}
              tenantType={tenantType}
              isEditing={isEditing}
              itemErrors={itemErrors}
              shouldShowDeliverQuantityColumn={shouldShowDeliverQuantityColumn}
              shouldShowReceivedQuantityColumn={shouldShowReceivedQuantityColumn}
              shouldShowInspectMenu={shouldShowInspectMenu}
              shouldShowStatusColumn={shouldShowStatusColumn}
              handleActualQuantityChange={handleActualQuantityChange}
              handleActualQuantityKeyDown={handleActualQuantityKeyDown}
              handleOperation={handleOperation}
              productStatusSummary={productStatusSummary}
              isUnitAllowingDecimal={isUnitAllowingDecimal}
              inspections={inspections}
              receipts={receipts}
              showRoundTitle={shouldShowRoundTitle}
            />
          ))}
        </div>
      );
    }
  }

  // 如果没有轮数分组数据，保持原有显示方式（向后兼容）
  return (
    <div className="space-y-4">
      <CardDescription className="text-xs text-gray-500 mb-4">
        共 {orderItems.length} 类商品，下表中单价为下单日产品中间价
      </CardDescription>
      
      {/* 移动端卡片布局 */}
      <div className="block md:hidden space-y-3">
        {orderItems.map((item) => {
          const actualStatus = productStatusSummary.itemStatusMap[item.id] || "PENDING";
          const canEdit = !["SIGN", "RETURN", "EXCHANGE"].includes(actualStatus);
          // PROVIDER和MARKET用户：从所有inspections中获取市场接收和客户接收数量
          const isProvider = tenantType?.toLowerCase() === "provider";
          const isMarket = tenantType?.toLowerCase() === "market";
          const marketReceivedQtyForDisplay = (isProvider || isMarket) 
            ? getInspectedQuantityForDisplay(item.id, "MARKET", inspections)
            : (inspections.length > 0 ? getReceivedQuantityFromRound(item.id, "MARKET", inspections) : "0");
          const customerReceivedQtyForDisplay = (isProvider || isMarket)
            ? getInspectedQuantityForDisplay(item.id, "CUSTOMER", inspections)
            : (inspections.length > 0 ? getReceivedQuantityFromRound(item.id, "CUSTOMER", inspections) : "0");
          const marketReceivedQuantity = marketReceivedQtyForDisplay ? parseFloat(marketReceivedQtyForDisplay) : 0;
          const customerReceivedQuantity = customerReceivedQtyForDisplay ? parseFloat(customerReceivedQtyForDisplay) : 0;
          // CUSTOMER 用户：发货数量显示市场接收数量
          const isCustomer = tenantType?.toLowerCase() === "customer";
          const deliveredQuantityForCustomer = isCustomer && inspections.length > 0
            ? getReceivedQuantityFromRound(item.id, "MARKET", inspections)
            : "0";
          
          // CUSTOMER 用户：从inspections的最近轮中获取收货量
          const customerReceivedQtyForCustomer = isCustomer 
            ? getCustomerReceivedQuantity(item.id, inspections)
            : "";
          // 小计计算：优先用客户接收，如果客户接收没有，则用市场接收，如果市场接收没有，则用发货数量，如果发货数量没有，则用下单数量
          // 发货数量：编辑模式下使用输入的deliveredQuantity，否则使用deliveredQuantityForCustomer
          const deliveredQtyForSubtotal = isEditing && (item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity
            ? parseFloat((item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || "0")
            : parseFloat(deliveredQuantityForCustomer) || 0;
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
                    <div className="text-xs text-gray-500">下单数量</div>
                    <div className="font-mono font-semibold mt-1">{parseFloat(item.orderedQty).toFixed(2)} {item.unit}</div>
                  </div>
                  {shouldShowDeliverQuantityColumn && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">发货数量</div>
                      {isEditing ? (
                        <div className="mt-1">
                          <Input
                            type="number"
                            value={(item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || ""}
                            onChange={(event) => handleActualQuantityChange?.(item.id, event.target.value)}
                            className={`w-full text-center font-mono font-semibold text-sm ${itemErrors[item.id] ? "border-red-500" : ""}`}
                            step={isUnitAllowingDecimal(item.unit) ? "0.01" : "1"}
                            min="0"
                            max="999999.99"
                            onKeyDown={(event) => handleActualQuantityKeyDown(event, item.id)}
                            disabled={!canEdit}
                          />
                          {itemErrors[item.id] && <p className="text-xs text-red-500 mt-1">{itemErrors[item.id]}</p>}
                        </div>
                      ) : (
                        <div className="font-mono font-semibold mt-1">
                          {isCustomer 
                            ? (parseFloat(deliveredQuantityForCustomer) > 0 ? `${parseFloat(deliveredQuantityForCustomer).toFixed(2)} ${item.unit}` : "-")
                            : `${parseFloat("0").toFixed(2)} ${item.unit}`
                          }
                        </div>
                      )}
                    </div>
                  )}
                  {shouldShowReceivedQuantityColumn && !isCustomer && (
                    <>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">市场接收</div>
                        <div className="font-mono font-semibold mt-1">
                          {marketReceivedQtyForDisplay ? `${marketReceivedQtyForDisplay} ${item.unit}` : "-"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">客户接收</div>
                        <div className="font-mono font-semibold mt-1">
                          {customerReceivedQtyForDisplay ? `${customerReceivedQtyForDisplay} ${item.unit}` : "-"}
                        </div>
                      </div>
                    </>
                  )}
                          {shouldShowReceivedQuantityColumn && isCustomer && (
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-xs text-gray-500">收货量</div>
                              <div className="font-mono font-semibold mt-1">
                                {customerReceivedQtyForCustomer ? `${customerReceivedQtyForCustomer} ${item.unit}` : "-"}
                              </div>
                            </div>
                          )}
                </div>

                {/* 价格信息 */}
                <div className="grid grid-cols-2 gap-2 text-sm border-t pt-2">
                  <div>
                    <div className="text-xs text-gray-500">折扣价</div>
                    <div className="font-mono font-semibold mt-1">¥{parseFloat(item.discountedUnitPrice).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">小计（折后）</div>
                    <div className="font-mono font-semibold mt-1 text-lg">
                      ¥{(parseFloat(item.discountedUnitPrice) * subtotalQuantity).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                {shouldShowInspectMenu && (
                  <div className="flex justify-end border-t pt-2">
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
      <div className="hidden md:block overflow-x-auto" style={{ position: "relative" }}>
        <div className="relative" style={{ maxHeight: "600px", overflowY: "auto", zIndex: 40 }}>
          <Table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "250px" }} />
              <col />
              <col />
                      {shouldShowDeliverQuantityColumn && <col />}
                      {shouldShowReceivedQuantityColumn && tenantType?.toLowerCase() !== "customer" && <col />}
                      {shouldShowReceivedQuantityColumn && tenantType?.toLowerCase() !== "customer" && <col />}
                      {shouldShowReceivedQuantityColumn && tenantType?.toLowerCase() === "customer" && <col />}
              <col />
              <col />
              <col />
              {shouldShowInspectMenu && <col />}
              {shouldShowStatusColumn && <col />}
            </colgroup>
            <TableHeader
              style={{ position: "sticky", top: 0, zIndex: 1000, backgroundColor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
            >
              <TableRow className="text-xs font-semibold bg-black text-white">
                <TableHead className="text-left p-3 border-b">商品名称</TableHead>
                <TableHead className="text-left p-3 border-b">类别</TableHead>
                <TableHead className="text-center p-3 border-b">下单数量</TableHead>
                {shouldShowDeliverQuantityColumn && <TableHead className="text-center p-3 border-b">发货数量</TableHead>}
                {shouldShowReceivedQuantityColumn && tenantType?.toLowerCase() !== "customer" && <TableHead className="text-center p-3 border-b">市场接收</TableHead>}
                {shouldShowReceivedQuantityColumn && tenantType?.toLowerCase() !== "customer" && <TableHead className="text-center p-3 border-b">客户接收</TableHead>}
                {shouldShowReceivedQuantityColumn && tenantType?.toLowerCase() === "customer" && <TableHead className="text-center p-3 border-b">收货量</TableHead>}
                <TableHead className="text-center p-3 border-b">单位</TableHead>
                <TableHead className="text-right p-3 border-b">折扣价</TableHead>
                <TableHead className="text-right p-3 border-b">小计（折后）</TableHead>
                {shouldShowInspectMenu && <TableHead className="text-right p-3 border-b">操作</TableHead>}
                {shouldShowStatusColumn && <TableHead className="text-center p-3 border-b">状态</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item) => {
                const actualStatus = productStatusSummary.itemStatusMap[item.id] || "PENDING";
                const canEdit = !["SIGN", "RETURN", "EXCHANGE"].includes(actualStatus);
                // PROVIDER和MARKET用户：从所有inspections中获取市场接收和客户接收数量
                const isProvider = tenantType?.toLowerCase() === "provider";
                const isMarket = tenantType?.toLowerCase() === "market";
                const marketReceivedQtyForDisplay = (isProvider || isMarket) 
                  ? getInspectedQuantityForDisplay(item.id, "MARKET", inspections)
                  : (inspections.length > 0 ? getReceivedQuantityFromRound(item.id, "MARKET", inspections) : "0");
                const customerReceivedQtyForDisplay = (isProvider || isMarket)
                  ? getInspectedQuantityForDisplay(item.id, "CUSTOMER", inspections)
                  : (inspections.length > 0 ? getReceivedQuantityFromRound(item.id, "CUSTOMER", inspections) : "0");
                const marketReceivedQuantity = marketReceivedQtyForDisplay ? parseFloat(marketReceivedQtyForDisplay) : 0;
                const customerReceivedQuantity = customerReceivedQtyForDisplay ? parseFloat(customerReceivedQtyForDisplay) : 0;
                // CUSTOMER 用户：发货数量显示市场接收数量
                const isCustomer = tenantType?.toLowerCase() === "customer";
                const deliveredQuantityForCustomer = isCustomer && inspections.length > 0
                  ? getReceivedQuantityFromRound(item.id, "MARKET", inspections)
                  : "0";
                
                // PROVIDER/MARKET 用户：从 roundGroups 中获取发货数量（非编辑模式下）
                let deliveredQuantityForProviderMarket = "0";
                if (!isCustomer && roundGroups && roundGroups.length > 0) {
                  // 找到最新的一轮（isLatest 为 true）
                  const latestRound = roundGroups.find(group => group.isLatest);
                  if (latestRound && latestRound.deliveries.length > 0) {
                    deliveredQuantityForProviderMarket = getDeliveredQuantityFromRound(item.id, latestRound.deliveries);
                  }
                }
                
                // CUSTOMER 用户：从inspections的最近轮中获取收货量
                const customerReceivedQty = isCustomer 
                  ? getCustomerReceivedQuantity(item.id, inspections)
                  : "";
                // PROVIDER 用户：获取客户签收数量（已移除，因为现在使用customerReceivedQtyForDisplay）
                const providerCustomerSignQty = "";
                // 小计计算：优先用客户接收，如果客户接收没有，则用市场接收，如果市场接收没有，则用发货数量，如果发货数量没有，则用下单数量
                // 发货数量：编辑模式下使用输入的deliveredQuantity，否则根据用户类型使用不同的数据源
                const deliveredQtyForSubtotal = isEditing && (item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity
                  ? parseFloat((item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || "0")
                  : (isCustomer 
                    ? parseFloat(deliveredQuantityForCustomer) || 0
                    : parseFloat(deliveredQuantityForProviderMarket) || 0);
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
                      {parseFloat(item.orderedQty).toFixed(2)}
                    </TableCell>
                    {shouldShowDeliverQuantityColumn && (
                      <TableCell className="p-2 text-center border-b w-[120px]">
                        {isEditing ? (
                          <div>
                            <Input
                              type="number"
                              value={(item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || ""}
                              onChange={(event) => handleActualQuantityChange?.(item.id, event.target.value)}
                              className={`max-w-[100px] text-center font-mono font-semibold ${itemErrors[item.id] ? "border-red-500" : ""}`}
                              step={isUnitAllowingDecimal(item.unit) ? "0.01" : "1"}
                              min="0"
                              max="999999.99"
                              onKeyDown={(event) => handleActualQuantityKeyDown(event, item.id)}
                              disabled={!canEdit}
                            />
                            {itemErrors[item.id] && <p className="text-xs text-red-500 mt-1">{itemErrors[item.id]}</p>}
                          </div>
                        ) : (
                          <span className="font-mono font-semibold">
                            {isCustomer 
                              ? (parseFloat(deliveredQuantityForCustomer) > 0 ? parseFloat(deliveredQuantityForCustomer).toFixed(2) : "-")
                              : (parseFloat(deliveredQuantityForProviderMarket) > 0 ? parseFloat(deliveredQuantityForProviderMarket).toFixed(2) : "-")
                            }
                          </span>
                        )}
                      </TableCell>
                    )}
                    {shouldShowReceivedQuantityColumn && !isCustomer && (
                      <TableCell className="p-2 text-center border-b font-mono font-semibold">
                        {marketReceivedQtyForDisplay || "-"}
                      </TableCell>
                    )}
                    {shouldShowReceivedQuantityColumn && !isCustomer && (
                      <TableCell className="p-2 text-center border-b font-mono font-semibold">
                        {customerReceivedQtyForDisplay || "-"}
                      </TableCell>
                    )}
                    {shouldShowReceivedQuantityColumn && isCustomer && (
                      <TableCell className="p-2 text-center border-b font-mono font-semibold">
                        {customerReceivedQty || "-"}
                      </TableCell>
                    )}
                    <TableCell className="p-2 text-center border-b font-mono">{item.unit}</TableCell>
                    <TableCell className="p-2 text-right border-b font-mono font-semibold">¥{parseFloat(item.discountedUnitPrice).toFixed(2)}</TableCell>
                    <TableCell className="p-2 text-right border-b font-mono font-semibold">
                      ¥{(parseFloat(item.discountedUnitPrice) * subtotalQuantity).toFixed(2)}
                    </TableCell>
                    {shouldShowInspectMenu && (
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
                        {renderStatusBadges(item, actualStatus)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}


