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
import { OrderItem, ReturnExchangeItem, OperationType } from "@/lib/types/orderStatus";

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
}: ProductSignDialogProps) {
  const currentItem = orderItems.find(item => item.id === operatingProductId);
  const itemRecords = getItemReturnExchangeRecords(operatingProductId);

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
                operationType === 'EXCHANGE' ? '换货' : '签收'}信息
              {itemRecords.length > 0 && (
                <Fragment>
                  <span className="block mt-1 text-red-500 text-xs font-mono">注意：此操作将覆盖该商品之前的退换货记录</span>
                  {itemRecords.map((record, index) => (
                    <span key={index} className="block mt-1 text-xs text-gray-500">
                      之前记录: {record.operationType === 'RETURN' ? '退货' :
                        record.operationType === 'EXCHANGE' ? '换货' : '签收'} {record.quantity} {record.unit}
                    </span>
                  ))}
                </Fragment>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {/* 商品信息展示 */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
              <div className="text-xs">
                <span className="text-gray-500">客户需求量：</span>
                <span className="font-mono font-semibold">{currentItem?.orderedQty} {currentItem?.unit}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-500">实际到货量：</span>
                <span className="font-mono font-semibold">{currentItem?.deliveredQuantity || '0'} {currentItem?.unit}</span>
              </div>
            </div>

            {/* 换货数量计算 */}
            {operationType === 'EXCHANGE' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="damagedQuantity" className="col-span-4 text-sm font-medium">
                  坏货数量 ({currentItem?.unit || ''})
                </Label>
                <div className="col-span-4 flex items-center space-x-2">
                  <Input
                    id="damagedQuantity"
                    type="number"
                    value={operatingQuantity || '0'}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className={`flex-grow font-mono text-red-600 ${quantityError ? 'border-red-500' : ''}`}
                    step="0.01"
                    min="0"
                    max={currentItem?.deliveredQuantity || '0'}
                    placeholder="输入坏货数量"
                  />
                </div>
                {quantityError && (
                  <p className="text-xs text-red-500 col-span-4">{quantityError}</p>
                )}

                {/* 计算结果展示 */}
                <div className="col-span-4 p-3 bg-blue-50 rounded-md border">
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">客户需求量：</span>
                      <span className="font-mono">{currentItem?.orderedQty} {currentItem?.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">实际到货量：</span>
                      <span className="font-mono">{currentItem?.deliveredQuantity || '0'} {currentItem?.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">坏货数量：</span>
                      <span className="font-mono text-red-600">-{operatingQuantity || '0'} {currentItem?.unit}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span className="text-green-600">需要换货量：</span>
                      <span className="font-mono text-green-600">
                        {(() => {
                          const quantity = parseFloat(currentItem?.orderedQty || '0');
                          const deliveredQuantity = parseFloat(currentItem?.deliveredQuantity || '0');
                          const damagedQuantity = parseFloat(operatingQuantity || '0');
                          const exchangeQuantity = Math.max(0, quantity - (deliveredQuantity - damagedQuantity));
                          return exchangeQuantity.toFixed(2);
                        })()} {currentItem?.unit}
                      </span>
                    </div>
                  </div>

                  {/* 当换货数量为0时的提示 */}
                  {(() => {
                    const quantity = parseFloat(currentItem?.orderedQty || '0');
                    const deliveredQuantity = parseFloat(currentItem?.deliveredQuantity || '0');
                    const damagedQuantity = parseFloat(operatingQuantity || '0');
                    const exchangeQuantity = Math.max(0, quantity - (deliveredQuantity - damagedQuantity));

                    const shouldShowHint = exchangeQuantity === 0 && (
                      (tenantType?.toLowerCase() === 'market' && orderStatus === 'MARKET_INSPECTING') ||
                      (tenantType?.toLowerCase() === 'customer' && orderStatus === 'CUSTOMER_INSPECTING')
                    );

                    return shouldShowHint ? (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="text-xs text-blue-800">
                            <p className="font-medium">无需换货</p>
                            <p className="mt-1">计算结果显示换货数量为0，建议您按客户下单数量执行签收操作，以确认商品验收完成。</p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            {/* 普通数量输入（非换货操作） */}
            {operationType !== 'EXCHANGE' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="col-span-4 text-sm">
                  {operationType === 'RETURN' ? '退货' : '签收'}数量 ({currentItem?.unit || ''})
                </Label>
                <div className="col-span-4 flex items-center space-x-2">
                  <Input
                    id="quantity"
                    type="number"
                    value={operatingQuantity || '0'}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className={`flex-grow font-mono ${operationType !== 'SIGN' ? 'text-red-600' : ''} ${quantityError ? 'border-red-500' : ''}`}
                    step={(() => {
                      // 如果是签收操作，且单位是 kg 或 g，则允许小数，否则只允许整数
                      if (operationType === 'SIGN' && currentItem?.unit) {
                        const unit = currentItem.unit.toLowerCase();
                        return (unit === 'kg' || unit === 'g') ? '0.01' : '1';
                      }
                      // 退货操作允许小数
                      return '0.1';
                    })()}
                    min="0"
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
              </div>
            )}

            {/* 原因输入 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="col-span-4">
                {operationType === 'RETURN' ? '退货' :
                  operationType === 'EXCHANGE' ? '换货' : '签收'}原因
                {operationType === 'SIGN' && <span className="text-xs text-gray-500 ml-1">(可选)</span>}
              </Label>
              <Textarea
                id="reason"
                value={operatingReason || ''}
                onChange={(e) => handleReasonChange(e.target.value)}
                placeholder={operationType === 'SIGN' ?
                  "请填写签收备注（可选）..." :
                  "请填写详细原因，不少于8个字..."}
                className={`col-span-4 resize-none ${reasonError ? 'border-red-500' : ''}`}
                maxLength={255}
              />
              {reasonError && (
                <p className="text-xs text-red-500 col-span-4">{reasonError}</p>
              )}
              <div className="text-xs text-right text-gray-500 col-span-4">
                {operatingReason.length}/255 {operationType !== 'SIGN' && operatingReason.length < 8 ? `(至少需要8个字)` : ''}
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
                (operationType !== 'SIGN' && (!!reasonError || operatingReason.length < 8))}
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
              {operationType === 'SIGN' ? (
                <span>您确定要签收商品吗？签收后将确认商品已收到并检查无误。</span>
              ) : (
                <span>您确定要提交以下{operationType === 'RETURN' ? '退货' : '换货'}信息吗？</span>
              )}
              {itemRecords.length > 0 && (
                <Fragment>
                  <span className="block mt-1 text-red-500 font-medium">此操作将覆盖该商品之前的退换货记录</span>
                  {itemRecords.map((record, index) => (
                    <span key={index} className="block mt-1 p-2 bg-gray-100 rounded-sm text-xs">
                      <span className="block">之前的操作: {record.operationType === 'RETURN' ? '退货' :
                        record.operationType === 'EXCHANGE' ? '换货' : '签收'}</span>
                      <span className="block mt-1 font-mono">数量: {record.quantity} {record.unit}</span>
                      <span className="block mt-1">原因: {record.reason}</span>
                    </span>
                  ))}
                </Fragment>
              )}
            </AlertDialogDescription>
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <Separator />
              <p className="text-xs">商品名称: <span className="font-semibold text-gray-800 ml-2">{currentItem?.name}</span></p>
              {operationType === 'SIGN' ? (
                <p className="text-xs">收货数量: <span className="font-mono font-semibold text-gray-800 ml-2">{operatingQuantity || '0'}({currentItem?.unit})</span> </p>
              ) : operationType === 'EXCHANGE' ? (
                <Fragment>
                  <p className="text-xs">坏货数量: <span className="font-mono font-semibold text-red-600 ml-2">{operatingQuantity} {currentItem?.unit}</span></p>
                  <p className="text-xs">换货数量: <span className="font-mono font-semibold text-green-600 ml-2">
                    {(() => {
                      const quantity = parseFloat(currentItem?.orderedQty || '0');
                      const deliveredQuantity = parseFloat(currentItem?.deliveredQuantity || '0');
                      const damagedQuantity = parseFloat(operatingQuantity || '0');
                      const exchangeQuantity = Math.max(0, quantity - (deliveredQuantity - damagedQuantity));
                      return exchangeQuantity.toFixed(2);
                    })()} {currentItem?.unit}
                  </span></p>
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
