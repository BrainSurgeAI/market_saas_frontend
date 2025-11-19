"use client";

import { Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { OrderItem, ReturnExchangeItem, OperationType, OrderInspection } from "@/lib/types/orderStatus";
import { RoundGroupedData, getDeliveredQuantityFromRound, getReceivedQuantityFromRound } from "./order-details/roundGrouping";

interface ProductSignDialogProps {
  // 对话框控制
  showOperationDialog: boolean;
  setShowOperationDialog: (show: boolean) => void;
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;

  // 操作数据
  operatingProductId: number;
  setOperatingProductId: (id: number) => void;
  operationType: OperationType | null;
  setOperationType: (type: OperationType | null) => void;
  operatingQuantity: string;
  setOperatingQuantity: (quantity: string) => void;
  operatingReason: string;
  setOperatingReason: (reason: string) => void;
  useFullQuantity: boolean;
  setUseFullQuantity: (use: boolean) => void;

  // 错误信息
  quantityError: string;
  setQuantityError: (error: string) => void;
  reasonError: string;
  setReasonError: (error: string) => void;

  // 回调函数
  handleQuantityChange: (value: string) => void;
  handleReasonChange: (value: string) => void;
  handleUseFullQuantity: (use: boolean) => void;
  handleSubmitOperation: () => void;
  handleConfirmOperation: () => void;
  getItemReturnExchangeRecords: (id: number) => ReturnExchangeItem[];

  // 订单数据
  orderItems: OrderItem[];

  // 订单状态
  orderStatus?: string;
  tenantType?: string;

  // 轮数分组数据（用于获取实际到货量）
  roundGroups?: RoundGroupedData[];
  
  // 验收数据（用于CUSTOMER获取实际到货量）
  inspections?: OrderInspection[];
}

export default function ProductSignDialog({
  showOperationDialog,
  setShowOperationDialog,
  showConfirmDialog,
  setShowConfirmDialog,
  operatingProductId,
  setOperatingProductId,
  operationType,
  setOperationType,
  operatingQuantity,
  setOperatingQuantity,
  operatingReason,
  setOperatingReason,
  useFullQuantity,
  setUseFullQuantity,
  quantityError,
  setQuantityError,
  reasonError,
  setReasonError,
  handleQuantityChange,
  handleReasonChange,
  handleUseFullQuantity,
  handleSubmitOperation,
  handleConfirmOperation,
  getItemReturnExchangeRecords,
  orderItems,
  orderStatus,
  tenantType,
  roundGroups,
  inspections = [],
}: ProductSignDialogProps) {
  const currentItem = orderItems.find(item => item.id === operatingProductId);
  const itemRecords = getItemReturnExchangeRecords(operatingProductId);

  // 获取实际到货量
  // MARKET用户：从deliveries中最近一轮的记录中获取
  // CUSTOMER用户：从inspections中获取MARKET的验收数量（与商品清单中的发货数量一致）
  const getActualDeliveredQuantity = (orderDetailId: number): string => {
    // MARKET用户：从deliveries中最近一轮的记录中获取
    if (tenantType?.toLowerCase() === 'market') {
      if (!roundGroups || roundGroups.length === 0) {
        return "0";
      }
      
      // 找到最新的一轮（isLatest 为 true）
      const latestRound = roundGroups.find(group => group.isLatest);
      if (!latestRound || latestRound.deliveries.length === 0) {
        return "0";
      }
      
      return getDeliveredQuantityFromRound(orderDetailId, latestRound.deliveries);
    }
    
    // CUSTOMER用户：从inspections中获取MARKET的验收数量（与商品清单中的发货数量一致）
    if (tenantType?.toLowerCase() === 'customer' && inspections && inspections.length > 0) {
      return getReceivedQuantityFromRound(orderDetailId, "MARKET", inspections);
    }
    
    // 其他情况（PROVIDER等），从deliveries中获取
    if (!roundGroups || roundGroups.length === 0) {
      return "0";
    }
    
    // 找到最新的一轮（isLatest 为 true）
    const latestRound = roundGroups.find(group => group.isLatest);
    if (!latestRound || latestRound.deliveries.length === 0) {
      return "0";
    }
    
    return getDeliveredQuantityFromRound(orderDetailId, latestRound.deliveries);
  };

  const actualDeliveredQuantity = currentItem 
    ? getActualDeliveredQuantity(currentItem.id)
    : "0";

  const handleDialogClose = () => {
    setShowOperationDialog(false);
    // 清除状态
    setTimeout(() => {
      setOperatingProductId(0);
      setOperationType(null);
      setOperatingQuantity("0");
      setOperatingReason("");
      setUseFullQuantity(false);
      setQuantityError("");
      setReasonError("");
      setShowConfirmDialog(false);
    }, 100);
  };

  return (
    <Fragment>
      {/* 操作对话框 */}
      <Dialog open={showOperationDialog} onOpenChange={(open) => {
        if (!open) {
          handleDialogClose();
        } else {
          setShowOperationDialog(true);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {operationType === 'RETURN' ? '商品退货' :
                operationType === 'EXCHANGE' ? '商品换货' : '商品签收'}:
              {currentItem?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              请填写{operationType === 'RETURN' ? '退货' :
                operationType === 'EXCHANGE' ? '签收' : '签收'}信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {/* 商品信息展示 */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
              <div className="text-xs">
                <span className="text-gray-500">客户需求量：</span>
                <span className="font-mono font-semibold">
                  {(() => {
                    // 对于换货操作，显示换货数量；否则显示原始下单数量
                    if (operationType === 'EXCHANGE') {
                      const exchangeRecord = itemRecords.find(record => record.operationType === 'EXCHANGE');
                      return exchangeRecord ? exchangeRecord.quantity : (currentItem?.orderedQty || 0);
                    }
                    return currentItem?.orderedQty || 0;
                  })()} {currentItem?.unit}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-gray-500">实际到货量：</span>
                <span className="font-mono font-semibold">{actualDeliveredQuantity} {currentItem?.unit}</span>
              </div>
            </div>

            {/* 普通数量输入（非换货操作） */}
         
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="col-span-4 text-sm">
                  {operationType === 'RETURN' ? '退货' : operationType === 'EXCHANGE' ? '签收' : '签收'}数量 ({currentItem?.unit || ''})
                </Label>
                {/* 在 MARKET_INSPECTING、EXCHANGE_INSPECTING 或 CUSTOMER_INSPECTING 状态下，退货操作自动退货全部，不显示输入框 */}
                {operationType === 'RETURN' && 
                 ((tenantType?.toLowerCase() === 'market' && (orderStatus === 'MARKET_INSPECTING' || orderStatus === 'EXCHANGE_INSPECTING')) ||
                  (tenantType?.toLowerCase() === 'customer' && orderStatus === 'CUSTOMER_INSPECTING')) ? (
                  <div className="col-span-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="text-xs text-blue-800">
                      <p className="font-medium">退货全部数量</p>
                      <p className="mt-1 font-mono text-base">
                        {operatingQuantity || '0'} {currentItem?.unit || ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="col-span-4 flex items-center space-x-2">
                      <Input
                        id="quantity"
                        type="number"
                        value={operatingQuantity || '0'}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        className={`flex-grow font-mono ${operationType === 'RETURN' ? 'text-red-600' : ''} ${quantityError ? 'border-red-500' : ''}`}
                        step={(() => {
                          // 如果是签收或换货操作，且单位是 kg 或 g，则允许小数，否则只允许整数
                          if ((operationType === 'SIGN' || operationType === 'EXCHANGE') && currentItem?.unit) {
                            const unit = currentItem.unit.toLowerCase();
                            return (unit === 'kg' || unit === 'g') ? '0.01' : '1';
                          }
                          // 退货操作允许小数
                          return '0.1';
                        })()}
                        min="0"
                        max={actualDeliveredQuantity}
                      />
                    </div>
                    {quantityError && (
                      <p className="text-xs text-red-500 col-span-4">{quantityError}</p>
                    )}
                    {/* 全选复选框 */}
                    <div className="flex items-center space-x-2 col-span-4">
                      <Checkbox
                        id="useFullQuantity"
                        checked={useFullQuantity}
                        onCheckedChange={(checked) => handleUseFullQuantity(checked === true)}
                      />
                      <label
                        htmlFor="useFullQuantity"
                        className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >全选</label>
                    </div>
                  </>
                )}
              </div>
            

            {/* 原因输入 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="col-span-4">
                备注
                {(operationType === 'SIGN' || operationType === 'EXCHANGE') && <span className="text-xs text-gray-500 ml-1">(可选)</span>}
              </Label>
              <Textarea
                id="reason"
                value={operatingReason || ''}
                onChange={(e) => handleReasonChange(e.target.value)}
                placeholder={(operationType === 'SIGN' || operationType === 'EXCHANGE') ?
                  "请填写签收备注（可选）..." :
                  "请填写详细原因，不少于8个字..."}
                className={`col-span-4 resize-none ${reasonError ? 'border-red-500' : ''}`}
                maxLength={255}
              />
              {reasonError && (
                <p className="text-xs text-red-500 col-span-4">{reasonError}</p>
              )}
              <div className="text-xs text-right text-gray-500 col-span-4">
                {operatingReason.length}/255 {(operationType !== 'SIGN' && operationType !== 'EXCHANGE') && operatingReason.length < 8 ? `(至少需要8个字)` : ''}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleDialogClose}>
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitOperation}
              disabled={!!quantityError || operatingQuantity === "0" ||
                ((operationType !== 'SIGN' && operationType !== 'EXCHANGE') && (!!reasonError || operatingReason.length < 8))}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认对话框 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">
              确认{operationType === 'RETURN' ? '退货' :
                operationType === 'EXCHANGE' ? '换货' : '签收'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {operationType === 'SIGN' || operationType === 'EXCHANGE' ? (
                <span>您确定要签收商品吗？签收后将确认商品已收到并检查无误。</span>
              ) : (
                <span>您确定要提交以下退货信息吗？</span>
              )}
            </AlertDialogDescription>
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <Separator />
              <p className="text-xs">商品名称: <span className="font-semibold text-gray-800 ml-2">{currentItem?.name}</span></p>
              {operationType === 'SIGN' ? (
                <p className="text-xs">收货数量: <span className="font-mono font-semibold text-gray-800 ml-2">{operatingQuantity || '0'}({currentItem?.unit})</span> </p>
              ) : operationType === 'EXCHANGE' ? (
                <Fragment>
                  <p className="text-xs">签收数量: <span className="font-mono font-semibold text-gray-800 ml-2">{operatingQuantity || '0'} {currentItem?.unit}</span></p>
                  <p className="text-xs">换货原因: <span className="font-semibold text-gray-800 ml-2">{operatingReason || '无'}</span></p>
                </Fragment>
              ) : (
                <Fragment>
                  <p className="text-xs">退货数量: <span className="font-mono font-semibold text-gray-800 ml-2">{operatingQuantity} {currentItem?.unit}</span></p>
                  <p className="text-xs">退货原因: <span className="font-semibold text-gray-800 ml-2">{operatingReason || '无'}</span></p>
                </Fragment>
              )}
              <Separator />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOperation} className="text-xs">
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Fragment>
  );
}
