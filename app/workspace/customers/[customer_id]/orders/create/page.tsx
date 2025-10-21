"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@/app/workspace/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { format, addDays } from "date-fns";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { FutureDatePicker } from "@/lib/components/FutureDatePicker";


interface PendingOrder {
  items: CartItem[];
  totalAmount: number;
  date: string;
  deliveryInfo: {
    address: string;
    deliveryDate: string;
    contactName: string;
    contactPhone: string;
  };
}

interface ValidationError {
  field: string;
  message: string;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, organization } = useWorkspace();
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 送货信息表单状态
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: organization?.address || "",
    deliveryDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    contactName: user?.name || "",
    contactPhone: user?.phone || "",
  });

  useEffect(() => {
    try {
      // 从 sessionStorage 获取订单数据
      const orderData = sessionStorage.getItem('pendingOrder');
      if (!orderData) {
        toast({
          title: "错误",
          description: "未找到订单数据，请返回采购页面重试",
          variant: "destructive",
        });
        router.back();
        return;
      }

      const parsedOrder = JSON.parse(orderData);

      // 验证订单数据结构
      if (!validateOrderStructure(parsedOrder)) {
        toast({
          title: "数据错误",
          description: "订单数据格式不正确，请重新创建订单",
          variant: "destructive",
        });
        router.back();
        return;
      }

      // 添加送货信息
      parsedOrder.deliveryInfo = deliveryInfo;
      setPendingOrder(parsedOrder);
    } catch (error) {
      console.error("解析订单数据时出错:", error);
      toast({
        title: "数据错误",
        description: "订单数据无效，请重新创建订单",
        variant: "destructive",
      });
      router.back();
    }
  }, [router, toast, deliveryInfo]);

  // 验证订单数据结构
  const validateOrderStructure = (order: any): order is PendingOrder => {
    if (!order || typeof order !== 'object') return false;
    if (!Array.isArray(order.items) || order.items.length === 0) return false;
    if (typeof order.totalAmount !== 'number' || order.totalAmount <= 0) return false;
    if (typeof order.date !== 'string' || !Date.parse(order.date)) return false;

    return true;
  };

  // 验证订单数据
  const validateOrder = (order: PendingOrder): ValidationError[] => {
    const errors: ValidationError[] = [];

    // 验证订单总金额
    const calculatedTotal = Number(order.items.reduce((sum, item) => sum + item.total, 0).toFixed(2));
    if (Math.abs(calculatedTotal - order.totalAmount) > 0.01) {
      errors.push({
        field: 'totalAmount',
        message: `订单总金额不匹配，计算金额为 ¥${calculatedTotal}`
      });
    }

    // 验证送货信息
    if (!order.deliveryInfo.address.trim()) {
      errors.push({
        field: 'address',
        message: '送货地址不能为空'
      });
    } else if (order.deliveryInfo.address.length > 128) {
      errors.push({
        field: 'address',
        message: '送货地址不能超过128个字符'
      });
    }

    if (!order.deliveryInfo.contactName.trim()) {
      errors.push({
        field: 'contactName',
        message: '收货人姓名不能为空'
      });
    } else if (order.deliveryInfo.contactName.length > 32) {
      errors.push({
        field: 'contactName',
        message: '收货人姓名不能超过32个字符'
      });
    }

    if (!order.deliveryInfo.contactPhone.trim()) {
      errors.push({
        field: 'contactPhone',
        message: '联系电话不能为空'
      });
    } else if (order.deliveryInfo.contactPhone.length > 16) {
      errors.push({
        field: 'contactPhone',
        message: '联系电话不能超过16位'
      });
    }

    // 验证每个商品
    order.items.forEach((item, index) => {
      // 验证商品数量
      if (item.quantity <= 0) {
        errors.push({
          field: `items[${index}].quantity`,
          message: `商品 "${item.name}" 的数量必须大于0`
        });
      }

      // 验证商品单价
      if (item.price <= 0) {
        errors.push({
          field: `items[${index}].price`,
          message: `商品 "${item.name}" 的单价必须大于0`
        });
      }

      if (item.originalPrice <= 0) {
        errors.push({
          field: `items[${index}].originalPrice`,
          message: `商品 "${item.name}" 的原始单价必须大于0`
        });
      }

      // 验证商品总价
      const calculatedItemTotal = Number((item.price * item.quantity).toFixed(2));
      const calculatedOriginalTotal = Number((item.originalPrice * item.quantity).toFixed(2));

      if (Math.abs(calculatedItemTotal - item.total) > 0.01) {
        errors.push({
          field: `items[${index}].total`,
          message: `商品 "${item.name}" 的总价不匹配，应为 ¥${calculatedItemTotal}`
        });
      }

      if (Math.abs(calculatedOriginalTotal - item.originalTotal) > 0.01) {
        errors.push({
          field: `items[${index}].originalTotal`,
          message: `商品 "${item.name}" 的原始总价不匹配，应为 ¥${calculatedOriginalTotal}`
        });
      }

      // 验证折扣率
      if (item.discountRate < 0 || item.discountRate > 1) {
        errors.push({
          field: `items[${index}].discountRate`,
          message: `商品 "${item.name}" 的折扣率必须在0到1之间`
        });
      }

      // 验证必要字段
      if (!item.productId || !item.name || !item.unit) {
        errors.push({
          field: `items[${index}]`,
          message: `商品 "${item.name}" 缺少必要信息`
        });
      }
    });

    return errors;
  };

  const handleConfirm = async () => {
    if (!pendingOrder || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // 更新订单的送货信息
      const orderWithDelivery = {
        ...pendingOrder,
        deliveryInfo: {
          ...deliveryInfo,
          // 转换为 MySQL DATE 格式 (YYYY-MM-DD)
          deliveryDate: format(new Date(deliveryInfo.deliveryDate), "yyyy-MM-dd")
        }
      };

      // 验证订单数据
      const errors = validateOrder(orderWithDelivery);
      if (errors.length > 0) {
        setValidationErrors(errors);
        errors.forEach(error => {
          toast({
            title: "验证错误",
            description: error.message,
            variant: "destructive",
          });
        });
        return;
      }

      const response = await fetch(`/api/customers/${organization?.nameHash}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderWithDelivery),
      });

      if (!response.ok) {
        throw new Error('创建订单失败');
      }

      const data = await response.json();

      toast({
        title: "订单已提交",
        description: `您的采购订单已成功提交，订单号为 ${data.data.orderCode}`,
        variant: "success",
        duration: 1000,
      });

      sessionStorage.removeItem('pendingOrder');
      sessionStorage.removeItem(`cart_${organization?.nameHash}`);
      router.push('/workspace');
    } catch (error) {
      toast({
        title: "提交失败",
        description: "订单提交失败，请重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pendingOrder) {
    return <div>加载中...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold text-lg">确认订单信息</h2>
          <p className="text-sm text-gray-500">请确认以下采购信息</p>
        </div>

        {validationErrors.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-sm text-red-600 space-y-1">
                <p className="font-medium">订单数据存在以下问题：</p>
                <ul className="list-disc pl-4 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>送货信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 grid gap-2">
                  <Label htmlFor="address" className="text-sm text-gray-500">送货地址</Label>
                  <Input
                    id="address"
                    value={deliveryInfo.address}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="请输入详细的送货地址"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm text-gray-500">送货日期</Label>
                  <FutureDatePicker
                        value={deliveryInfo.deliveryDate}
                        onChange={(date) => setDeliveryInfo(prev => ({ ...prev, deliveryDate: date }))}
                        placeholder="选择日期"
                      />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contactName" className="text-sm text-gray-500">收货人姓名</Label>
                  <Input
                    id="contactName"
                    value={deliveryInfo.contactName}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="请输入收货人姓名"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactPhone" className="text-sm text-gray-500">联系电话</Label>
                  <Input
                    id="contactPhone"
                    value={deliveryInfo.contactPhone}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>商品清单</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOrder.items.map((item, index) => (
                <div key={item.uniqueId || `${item.productId}_${index}`} className="flex items-start justify-between pb-4 border-b last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm">{item.name}</p>
                    <p className="text-sm text-gray-500 font-mono">
                      ¥{Number(item.price).toFixed(2)}/{item.unit} × {item.quantity}
                      {Number(item.originalPrice) > Number(item.price) && (
                        <span className="ml-2 text-gray-400 line-through font-mono">
                          ¥{Number(item.originalPrice).toFixed(2)}/{item.unit}
                        </span>
                      )}
                    </p>
                    {(item.processingServices && item.processingServices.length > 0 || item.customNote) && (
                      <div className="mt-1">
                        {item.processingServices && item.processingServices.map((service, serviceIndex) => (
                          <p key={`${index}_service_${serviceIndex}`} className="text-xs text-gray-500">
                            · {service.type}
                            {service.description && ` - ${service.description}`}
                          </p>
                        ))}
                        {item.customNote && (
                          <p className="text-xs text-gray-500">
                            · 备注: {item.customNote}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium font-mono">¥{Number(item.total).toFixed(2)}</p>
                    {Number(item.originalTotal) > Number(item.total) && (
                      <p className="text-sm text-gray-400 line-through font-mono">
                        ¥{Number(item.originalTotal).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">总计金额</span>
              <span className="font-semibold text-primary font-mono">
                ¥{pendingOrder.totalAmount.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()} size="sm">
            返回修改
          </Button>
          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isSubmitting || validationErrors.length > 0} size="sm">
                {isSubmitting ? "提交中..." : "确认订单"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认订单?</AlertDialogTitle>
                <div className="space-y-2">
                  <AlertDialogDescription>
                    提交后将无法修改订单信息。请确认以下信息无误：
                  </AlertDialogDescription>
                  <div className="mt-2 space-y-1 text-xs font-mono">
                    <div>订单总金额：¥{pendingOrder.totalAmount.toFixed(2)}</div>
                    <div>商品数量：{pendingOrder.items.length} 件</div>
                    <div>收货人：{deliveryInfo.contactName}</div>
                    <div>联系电话：{deliveryInfo.contactPhone}</div>
                    <div>送货地址：{deliveryInfo.address}</div>
                    <div>送货日期：{format(new Date(deliveryInfo.deliveryDate), "yyyy年MM月dd日")}</div>
                  </div>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm} className="bg-primary hover:bg-primary/90 text-xs">
                  {isSubmitting ? "提交中..." : "确认"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
