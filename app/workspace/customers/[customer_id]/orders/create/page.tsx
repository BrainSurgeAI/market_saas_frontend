"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@/app/workspace/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

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
import { Minus, Plus, X, Package, ShoppingCart } from "lucide-react";


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

interface CreateOrderItemPayload {
  categoryId: number;
  productCode: string;
  orderedQty: string;
  remark: string | null;
  processingServices: {
    type: string;
    description?: string;
  }[];
}

interface CreateOrderPayload {
  deliveryInfo: {
    deliveryDate: string;
    address: string;
    contactName: string;
    contactPhone: string;
  };
  items: CreateOrderItemPayload[];
}

export default function CreateOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, organization } = useWorkspace();
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 计算步长（根据单位类型）
  const getItemStepValue = (unit: string) => {
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit === "kg" || lowerUnit === "g") {
      // kg和g单位按100g变化
      return lowerUnit === "kg" ? 0.1 : 100;
    }
    // 其他单位按1变化
    return 1;
  };

  // 更新商品数量
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (!pendingOrder) return;

    const item = pendingOrder.items.find(item => (item.uniqueId || item.productId) === itemId);
    if (!item || newQuantity < (item.minOrderQuantity || 1)) return;

    const updatedItems = pendingOrder.items.map(cartItem =>
      (cartItem.uniqueId || cartItem.productId) === itemId
        ? {
          ...cartItem,
          quantity: newQuantity,
          total: Number((cartItem.price * newQuantity).toFixed(2)),
          originalTotal: Number((cartItem.originalPrice * newQuantity).toFixed(2))
        }
        : cartItem
    );

    const newTotal = Number(updatedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2));

    setPendingOrder({
      ...pendingOrder,
      items: updatedItems,
      totalAmount: newTotal
    });
  };

  // 移除商品
  const removeItem = (itemId: string) => {
    if (!pendingOrder) return;

    const updatedItems = pendingOrder.items.filter(item => (item.uniqueId || item.productId) !== itemId);
    const newTotal = Number(updatedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2));

    setPendingOrder({
      ...pendingOrder,
      items: updatedItems,
      totalAmount: newTotal
    });
  };

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

      const requestPayload: CreateOrderPayload = {
        deliveryInfo: orderWithDelivery.deliveryInfo,
        items: pendingOrder.items.map((item) => ({
          categoryId: item.categoryId,
          productCode: item.productCode ?? item.productId,
          orderedQty: Number(item.quantity).toFixed(2),
          remark: item.customNote?.trim() ? item.customNote : null,
          processingServices: (item.processingServices ?? []).map((service) => ({
            type: service.type,
            description: service.description,
          })),
        })),
      };

      const response = await fetch(`/api/customers/${organization?.nameHash}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error('创建订单失败');
      }

      const data = await response.json();
      console.log(data);

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
    <div className="w-full bg-slate-50/50 min-h-screen p-6">
      <div className="w-full space-y-8">
        {/* 页面头部 */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">确认订单信息</h1>
          <p className="text-slate-500 text-sm">请确认以下采购信息，提交后将无法修改</p>
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

        <Card className="border-slate-100 shadow-sm bg-white rounded-2xl relative z-10">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              送货信息
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-slate-700">送货地址</Label>
                  <Input
                    id="address"
                    value={deliveryInfo.address}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="请输入详细的送货地址"
                    className="border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">送货日期</Label>
                  <FutureDatePicker
                    value={deliveryInfo.deliveryDate}
                    onChange={(date) => setDeliveryInfo(prev => ({ ...prev, deliveryDate: date }))}
                    placeholder="选择日期"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="text-sm font-medium text-slate-700">收货人姓名</Label>
                  <Input
                    id="contactName"
                    value={deliveryInfo.contactName}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="请输入收货人姓名"
                    className="border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-sm font-medium text-slate-700">联系电话</Label>
                  <Input
                    id="contactPhone"
                    value={deliveryInfo.contactPhone}
                    onChange={(e) => setDeliveryInfo(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="请输入联系电话"
                    className="border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">商品清单</CardTitle>
                <p className="text-sm text-slate-500 mt-1">确认您的采购商品</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* 商品列表 */}
            <div className="space-y-4 mb-6">
              {pendingOrder.items.map((item, index) => {
                return (
                  <div key={item.uniqueId || `${item.productId}_${index}`} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow h-40">
                  <div className="flex h-full">
                    {/* 商品图片 - 占满左侧区域 */}
                    <div className="relative w-40 h-full flex-shrink-0 bg-slate-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-fill"
                          sizes="160px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* 商品信息和操作区域 */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-h-[160px]">
                      {/* 商品头部信息和删除按钮 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-slate-900 font-mono">
                              ¥{Number(item.price).toFixed(2)}
                            </span>
                            <span className="text-xs text-slate-500">/{item.unit}</span>
                            {item.discountRate && item.discountRate < 1 && (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5"
                              >
                                -{Math.round((1 - item.discountRate) * 100)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full flex-shrink-0"
                          onClick={() => removeItem(item.uniqueId || item.productId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* 加工服务和备注 */}
                      {((item.processingServices && item.processingServices.length > 0) || item.customNote) && (
                        <div className="mb-3 space-y-1">
                          {item.processingServices?.map((service, serviceIndex) => (
                            <div key={serviceIndex} className="flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                              <span className="text-xs text-slate-600">
                                {service.type}
                                {service.description && ` - ${service.description}`}
                              </span>
                            </div>
                          ))}
                          {item.customNote && (
                            <div className="flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                              <span className="text-xs text-slate-600">
                                备注: {item.customNote}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 数量控制和价格 */}
                      <div className="flex items-center justify-between">
                        {/* 数量控制 */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-none"
                              onClick={() => updateItemQuantity(item.uniqueId || item.productId, item.quantity - getItemStepValue(item.unit))}
                              disabled={item.quantity - getItemStepValue(item.unit) < (item.minOrderQuantity || 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="w-12 h-8 flex items-center justify-center text-sm font-medium border-x border-slate-200">
                              {item.unit.toLowerCase() === "kg" || item.unit.toLowerCase() === "g"
                                ? item.quantity.toFixed(item.unit.toLowerCase() === "kg" ? 1 : 0)
                                : item.quantity
                              }
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-none"
                              onClick={() => updateItemQuantity(item.uniqueId || item.productId, item.quantity + getItemStepValue(item.unit))}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-xs text-slate-500">{item.unit}</span>
                        </div>

                        {/* 小计价格 */}
                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-900 font-mono">
                            ¥{Number(item.total).toFixed(2)}
                          </div>
                          {Number(item.originalTotal) > Number(item.total) && (
                            <div className="text-xs text-slate-500 line-through font-mono">
                              ¥{Number(item.originalTotal).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* 订单摘要 */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-4">
              {/* 订单统计 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">商品总价</span>
                  <span className="font-medium font-mono">¥{pendingOrder.items.reduce((sum, item) => sum + item.originalTotal, 0).toFixed(2)}</span>
                </div>
                {pendingOrder.totalAmount < pendingOrder.items.reduce((sum, item) => sum + item.originalTotal, 0) && (
                  <div className="flex justify-between">
                    <span className="text-green-600">优惠金额</span>
                    <span className="font-medium text-green-600 font-mono">
                      -¥{(pendingOrder.items.reduce((sum, item) => sum + item.originalTotal, 0) - pendingOrder.totalAmount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* 总计 */}
              <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                <span className="font-medium text-slate-900">订单总计</span>
                <span className="text-xl font-bold text-slate-900 font-mono">¥{pendingOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            返回修改
          </Button>
          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isSubmitting || validationErrors.length > 0}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 px-8"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isSubmitting ? "提交中..." : "确认订单"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <AlertDialogTitle className="text-lg font-bold text-slate-900">
                      确认提交订单
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-500 mt-1">
                      请确认以下订单信息，提交后将无法修改
                    </AlertDialogDescription>
                  </div>
                </div>
              </AlertDialogHeader>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">订单总金额</span>
                    <span className="font-bold font-mono text-slate-900">¥{pendingOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">商品数量</span>
                    <span className="font-bold text-slate-900">{pendingOrder.items.length} 件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">收货人</span>
                    <span className="font-medium text-slate-900">{deliveryInfo.contactName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">联系电话</span>
                    <span className="font-medium text-slate-900">{deliveryInfo.contactPhone}</span>
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">送货地址</span>
                    <span className="font-medium text-slate-900 text-right max-w-[200px]">{deliveryInfo.address}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">送货日期</span>
                    <span className="font-medium text-slate-900">{format(new Date(deliveryInfo.deliveryDate), "yyyy年MM月dd日")}</span>
                  </div>
                </div>
              </div>

              <AlertDialogFooter className="flex gap-3 pt-6">
                <AlertDialogCancel className="flex-1 h-12 rounded-xl border-slate-200">
                  取消
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirm}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20"
                >
                  {isSubmitting ? "提交中..." : "确认提交"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
