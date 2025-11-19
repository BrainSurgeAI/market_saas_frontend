"use client";

import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { OrderItem, ExchangeItem, OperationType } from "@/lib/types/orderStatus";

interface ExchangeInspectDialogProps {
  // 对话框控制
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;

  // 操作数据
  operatingProductId: number;
  operatingQuantity: string;
  setOperatingQuantity: (quantity: string) => void;
  quantityError: string;
  operationType: OperationType;

  // 回调函数
  handleQuantityChange: (value: string) => void;
  handleConfirm: () => void;
  handleCancel: () => void;

  // 订单数据
  orderItems: OrderItem[];
  exchangeItems: ExchangeItem[];
}

export default function ExchangeInspectDialog({
  showDialog,
  setShowDialog,
  operatingProductId,
  operatingQuantity,
  setOperatingQuantity,
  quantityError,
  operationType,
  handleQuantityChange,
  handleConfirm,
  handleCancel,
  orderItems,
  exchangeItems,
}: ExchangeInspectDialogProps) {
  const currentItem = orderItems.find(item => item.id === operatingProductId);
  const currentExchangeItem = exchangeItems.find(item => item.id === operatingProductId);

  // 移除 useRef 和 useEffect
  // const wasOpenRef = useRef(showDialog);

  // useEffect(() => {
  //   if (wasOpenRef.current && !showDialog) {
  //     handleCancel();
  //   }
  //   wasOpenRef.current = showDialog;
  // }, [showDialog, handleCancel]);

  if (!currentItem || !currentExchangeItem) {
    return null;
  }

  const exchangeQuantity = currentExchangeItem.quantity;
  const actualQuantity = currentExchangeItem.actualQuantity || 0;

  return (
    <Dialog
      open={showDialog}
      onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          // 对话框关闭时立即重置状态
          handleCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {operationType === 'RETURN' ? '商品退货' :
             operationType === 'EXCHANGE' ? '商品换货' : '商品签收'}: {currentItem.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            请填写{operationType === 'RETURN' ? '退货' :
                   operationType === 'EXCHANGE' ? '换货' : '签收'}信息
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {/* 商品信息展示 */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
            <div className="text-xs">
              <span className="text-gray-500">需要换货：</span>
              <span className="font-mono font-semibold">{exchangeQuantity} {currentItem.unit}</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500">实际到货量：</span>
              <span className="font-mono font-semibold">{actualQuantity} {currentItem.unit}</span>
            </div>
          </div>

          {/* 签收数量输入 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="signQuantity" className="col-span-4 text-sm font-medium">
              签收数量 ({currentItem.unit})
            </Label>
            <div className="col-span-4 flex items-center space-x-2">
              <Input
                id="signQuantity"
                type="number"
                value={operatingQuantity || '0'}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className={`flex-grow font-mono ${quantityError ? 'border-red-500' : ''}`}
                step="0.01"
                min="0"
                max={actualQuantity.toString()}
                placeholder="输入签收数量"
              />
            </div>
            {quantityError && (
              <p className="text-xs text-red-500 col-span-4">{quantityError}</p>
            )}

            {/* 计算结果展示 */}
            <div className="col-span-4 p-3 bg-blue-50 rounded-md border">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">需要换货：</span>
                  <span className="font-mono">{exchangeQuantity} {currentItem.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">实际到货量：</span>
                  <span className="font-mono">{actualQuantity} {currentItem.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">签收数量：</span>
                  <span className="font-mono text-green-600">{operatingQuantity || '0'} {currentItem.unit}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span className="text-green-600">收货量：</span>
                  <span className="font-mono text-green-600">
                    {operatingQuantity || '0'} {currentItem.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="text-xs">
              取消
            </Button>
          </DialogClose>
          <Button
            onClick={handleConfirm}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white"
            disabled={!!quantityError || !operatingQuantity || parseFloat(operatingQuantity) <= 0}
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

