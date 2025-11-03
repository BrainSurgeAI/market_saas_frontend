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
            {/* 数量输入 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="col-span-4 text-sm">
                {operationType === 'RETURN' ? '退货' :
                  operationType === 'EXCHANGE' ? '换货' : '签收'}数量 ({currentItem?.unit || ''})
              </Label>
              <div className="col-span-4 flex items-center space-x-2">
                <Input
                  id="quantity"
                  type="number"
                  value={operatingQuantity || '0'}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className={`flex-grow font-mono ${operationType !== 'SIGN' ? 'text-red-600' : ''} ${quantityError ? 'border-red-500' : ''}`}
                  step="0.1"
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
                <p className="text-xs">收货数量: <span className="font-mono font-semibold text-gray-800 ml-2">{currentItem?.actualQuantity}({currentItem?.unit})</span> </p>
              ) : (
                <Fragment>
                  <p className="text-xs">{operationType === 'RETURN' ? '退货' : '换货'}数量: <span className="font-mono font-semibold text-gray-800 ml-2">{operatingQuantity} {currentItem?.unit}</span></p>
                  <p className="text-xs">{operationType === 'RETURN' ? '退货' : '换货'}原因: <span className="font-semibold text-gray-800 ml-2">{operatingReason || '无'}</span></p>
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
