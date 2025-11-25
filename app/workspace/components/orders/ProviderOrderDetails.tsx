"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Package, RotateCcw, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// 导入商品清单组件
import { ProductListSection } from "./order-details/ProductListSection";

// 导入PROVIDER专用类型定义
import type {
  ProviderOrderData,
  ProviderOrderItem,
  ProviderOrderCurrent,
  ProviderOrderResponse
} from "@/lib/types/providerOrder";

// 导入配送人员相关类型
import type { DeliveryPerson } from "@/lib/types/orderStatus";

// 导入现有组件
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

// 导入工具函数
import { useToast } from "@/hooks/use-toast";
import { translateOrderStatus, getStatusVariant } from "@/lib/utils";

// 导入策略相关
import { getOrderStrategy } from "./order-details/strategies/OrderStrategyFactory";
import type { ActionDescriptor } from "./order-details/types";
import type { OrderStrategyContext } from "./order-details/strategies/OrderStrategy";
import { OrderStatus, TenantType, type Order, type OrderItem } from "@/lib/types/orderStatus";
import type { RoundGroupedData } from "./order-details/roundGrouping";

// 导入操作函数 - PROVIDER 保持简单实现

interface ProviderOrderDetailProps {
  orderCode: string;
  orgId: string;
}

// Helper component for rendering item badges
const RenderStatusBadges = ({ item }: { item: ProviderOrderItem }) => {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge variant="secondary" className="bg-blue-500 text-white dark:bg-blue-600 text-xs">
        待配送
      </Badge>
    </div>
  );
};

// Helper component for grouped round items
const RoundItemGroups = ({ items }: { items: ProviderOrderItem[] }) => {
  const groups = useMemo(() => {
    const g = {
      PENDING: [] as ProviderOrderItem[],
      SIGN: [] as ProviderOrderItem[],
      RETURN: [] as ProviderOrderItem[],
      EXCHANGE: [] as ProviderOrderItem[],
    };
    // 简化：所有商品都放在PENDING组中
    items.forEach(item => {
      g.PENDING.push(item);
    });
    return g;
  }, [items]);

  const [isSignOpen, setIsSignOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const ItemRow = ({ item }: { item: ProviderOrderItem }) => {

    return (
        <div className="py-4 px-4 rounded-lg border bg-muted/30 border-muted">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">{item.productName}</span>
                        <span className="text-xs text-muted-foreground">({item.productCode})</span>
                    </div>
                    <RenderStatusBadges item={item} />
                </div>
            </div>

            {/* Quantity Display - Horizontal Layout */}
            <div className="grid grid-cols-2 gap-6 mb-3">
                <div className="text-center">
                    <div className="text-xs font-medium text-muted-foreground mb-1">需求量</div>
                    <div className="text-sm font-semibold text-foreground bg-background rounded px-2 py-1">
                        {item.needToDeliverQty} {item.unit}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs font-medium text-muted-foreground mb-1">发货量</div>
                    <div className={`text-sm font-semibold rounded px-2 py-1 ${item.actualQty ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                        {item.actualQty || '0.00'} {item.actualQty ? item.unit : ''}
                    </div>
                </div>
            </div>

            {/* Processing Requirements */}
            {item.processingRequirements && (
                <div className="mt-3 pt-2 border-t border-muted">
                    <div className="text-xs text-muted-foreground mb-1">加工要求</div>
                    <div className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-200">
                        {item.processingRequirements}
                    </div>
                </div>
            )}
        </div>
    );
  };

  return (
      <div className="space-y-4">
          {/* Pending / To Inspect */}
          {groups.PENDING.length > 0 && (
              <div className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground">待验收 / 其他 ({groups.PENDING.length})</h5>
                  <div className="space-y-1">
                      {groups.PENDING.map(item => <ItemRow key={item.orderDetailId} item={item} />)}
                  </div>
              </div>
          )}
          
          {/* Exchange */}
           {groups.EXCHANGE.length > 0 && (
              <div className="space-y-2">
                  <h5 className="text-sm font-medium text-orange-600">换货 ({groups.EXCHANGE.length})</h5>
                  <div className="space-y-1">
                      {groups.EXCHANGE.map(item => <ItemRow key={item.orderDetailId} item={item} />)}
                  </div>
              </div>
          )}

          {/* RETURN - Collapsible (Default Closed) */}
          {groups.RETURN.length > 0 && (
             <Collapsible open={isReturnOpen} onOpenChange={setIsReturnOpen} className="border rounded-md p-2">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h5 className="text-sm font-medium text-red-600 flex items-center gap-2">
                        <RotateCcw className="h-4 w-4"/> 退货 ({groups.RETURN.length})
                    </h5>
                    {isReturnOpen ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-1">
                    {groups.RETURN.map(item => <ItemRow key={item.orderDetailId} item={item} />)}
                </CollapsibleContent>
             </Collapsible>
          )}

          {/* SIGN - Collapsible (Default Closed) */}
          {groups.SIGN.length > 0 && (
             <Collapsible open={isSignOpen} onOpenChange={setIsSignOpen} className="border rounded-md p-2">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h5 className="text-sm font-medium text-green-600 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4"/> 已签收 ({groups.SIGN.length})
                    </h5>
                    {isSignOpen ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-1">
                    {groups.SIGN.map(item => <ItemRow key={item.orderDetailId} item={item} />)}
                </CollapsibleContent>
             </Collapsible>
          )}
      </div>
  );
};

export default function ProviderOrderDetail({ orderCode, orgId }: ProviderOrderDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  // 添加组件标识
  console.log('🚀 PROVIDER COMPONENT LOADED:', { orderCode, orgId });

  // PROVIDER 数据状态
  const [providerOrderData, setProviderOrderData] = useState<ProviderOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 订单信息折叠状态，默认折叠
  const [isOrderInfoCollapsed, setIsOrderInfoCollapsed] = useState(true);

  // 商品数量编辑相关状态
  const [editableOrderItems, setEditableOrderItems] = useState<(OrderItem & { deliveredQuantity?: string })[]>([]);
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});

  // 完成备货确认对话框状态
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // 策略相关的状态管理
  const [savingChanges, setSavingChanges] = useState(false);
  const [startingExchange, setStartingExchange] = useState(false);
  const [processing, setProcessing] = useState(false);

  // 配送人员相关状态
  const [deliveryStaffs, setDeliveryStaffs] = useState<DeliveryPerson[]>([]);
  const [selectedDeliveryStaff, setSelectedDeliveryStaff] = useState<DeliveryPerson | null>(null);
  const [showDeliveryStaffDialog, setShowDeliveryStaffDialog] = useState(false);
  const [showNoStaffAlert, setShowNoStaffAlert] = useState(false);

  // 对话框状态管理
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    action?: ActionDescriptor & { type: "dialog" };
  }>({ open: false });

  // 根据订单状态计算是否可编辑
  // 只有订单状态为 EXCHANGE_IN_PROGRESS 或 SUPPLIER_PREPARING 时才能进入编辑模式
  const isEditing = useMemo(() => {
    if (!providerOrderData) return false;
    const status = providerOrderData.orderStatus;
    const editing = status === 'SUPPLIER_PREPARING' || status === 'EXCHANGE_IN_PROGRESS';
    console.log('🔍 ProviderOrderDetails - isEditing calculation:', { status, editing, deliveryStatus: providerOrderData.current.deliveryStatus });
    return editing;
  }, [providerOrderData]);

  // 验证数量输入
  const validateQuantity = (value: string, unit: string): string | null => {
    if (!value || value.trim() === '') {
      return '请输入数量';
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
      return '请输入有效的数字';
    }

    if (num <= 0) {
      return '数量必须大于0';
    }

    // 根据单位检查是否允许小数
    const allowDecimal = ['kg', 'g', '公斤', '克'].includes(unit.toLowerCase());
    if (!allowDecimal && !Number.isInteger(num)) {
      return '该单位只能输入整数';
    }

    // 检查小数位数
    if (allowDecimal && value.includes('.')) {
      const decimalPart = value.split('.')[1];
      if (decimalPart && decimalPart.length > 2) {
        return '小数位数不能超过2位';
      }
    }

    return null; // 验证通过
  };

  // 转换PROVIDER数据为标准格式
  const convertedData = useMemo(() => {
    if (!providerOrderData) {
      return null;
    }

    // 转换 PROVIDER 数据为策略期望的 Order 格式
    const convertedOrderDetail: Order = {
      id: 0, // PROVIDER 数据没有 id，使用默认值
      customerName: providerOrderData.customerName,
      orderedAmount: providerOrderData.orderedAmount,
      discountAmount: providerOrderData.discountAmount,
      netAmount: providerOrderData.netAmount,
      deliveryAddress: providerOrderData.deliveryAddress,
      deliveryDate: providerOrderData.deliveryDate,
      orderStatus: providerOrderData.orderStatus,
      shipperName: providerOrderData.shipperName || '',
      shipperPhone: providerOrderData.shipperPhone || '',
      receiverName: providerOrderData.receiverName,
      receiverPhone: providerOrderData.receiverPhone,
      createdAt: providerOrderData.createdAt,
      orderCode: providerOrderData.orderCode,
    };

    // 使用current的items
    const convertedOrderItems = providerOrderData.current.items.map(item => ({
      id: item.orderDetailId,
      productId: item.productCode,
      name: item.productName,
      category: item.categoryName,
      categoryId: item.categoryId,
      orderedQty: item.needToDeliverQty,
      unit: item.unit,
      unitPrice: item.unitPrice,
      discountedUnitPrice: item.unitPrice,
      processingRequirements: item.processingRequirements || '',
      remark: '', // 新格式没有remark
      discountRate: "0", // PROVIDER 数据没有折扣率
      netAmount: (parseFloat(item.unitPrice) * parseFloat(item.needToDeliverQty)).toString(),
      orderedAmount: (parseFloat(item.unitPrice) * parseFloat(item.needToDeliverQty)).toString(),
      // 保留原始数据
      actualQty: item.actualQty,
    }));

    return {
      orderDetail: convertedOrderDetail,
      orderItems: convertedOrderItems,
    };
  }, [providerOrderData]);


  // 重新获取订单数据
  const refreshData = async () => {
    try {
      console.log('🔄 ProviderOrderDetails - Refreshing data for:', orderCode);

      const apiUrl = `/api/orders/${orderCode}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ProviderOrderDetails - HTTP error response:', errorText);
        throw new Error(`获取订单详情失败: ${response.status}`);
      }

      // API路由已经返回了解包后的 data，直接使用
      const providerOrderData: ProviderOrderData = await response.json();
      console.log('✅ ProviderOrderDetails - Refreshed PROVIDER order data:', providerOrderData);

      setProviderOrderData(providerOrderData);

      // 重新初始化可编辑商品列表，包含服务器返回的actualQty
      const updatedItems = providerOrderData.current.items.map(item => ({
        id: item.orderDetailId,
        round: 1, // 只有一个current，所以round设为1
        productId: item.productCode,
        name: item.productName,
        category: item.categoryName,
        categoryId: item.categoryId,
        orderedQty: item.needToDeliverQty,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountedUnitPrice: item.unitPrice,
        processingRequirements: item.processingRequirements || '',
        remark: '', // 新格式没有remark
        discountRate: "0", // PROVIDER 数据没有折扣率
        netAmount: (parseFloat(item.unitPrice) * parseFloat(item.needToDeliverQty)).toString(),
        orderedAmount: (parseFloat(item.unitPrice) * parseFloat(item.needToDeliverQty)).toString(),
        // 使用服务器返回的actualQty作为初始值，确保是字符串
        deliveredQuantity: item.actualQty ? item.actualQty.toString() : "",
      }));
      setEditableOrderItems(updatedItems);
      setItemErrors({}); // 清空错误状态


    } catch (err) {
      console.error('❌ ProviderOrderDetails - Error refreshing data:', err);
      toast({
        title: "刷新失败",
        description: err instanceof Error ? err.message : '刷新订单数据失败',
        variant: "destructive",
      });
    }
  };

  // 初始化可编辑的商品列表
  useEffect(() => {
    if (providerOrderData && editableOrderItems.length === 0) {
      // 在初次加载时，使用服务器返回的actualQty作为初始值
      const initialItems = providerOrderData.current.items.map(item => ({
        id: item.orderDetailId,
        round: 1, // 只有一个current，所以round设为1
        productId: item.productCode,
        name: item.productName,
        category: item.categoryName,
        categoryId: item.categoryId,
        orderedQty: item.needToDeliverQty,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountedUnitPrice: item.unitPrice,
        processingRequirements: item.processingRequirements || '',
        remark: '', // 新格式没有remark
        discountRate: "0", // PROVIDER 数据没有折扣率
        netAmount: (parseFloat(item.unitPrice) * parseFloat(item.needToDeliverQty)).toString(),
        orderedAmount: (parseFloat(item.unitPrice) * parseFloat(item.needToDeliverQty)).toString(),
        // 为已有发货记录的商品设置actualQty，新配送的商品设置为0.00
        deliveredQuantity: item.actualQty ? item.actualQty.toString() : "0.00",
      }));
      setEditableOrderItems(initialItems);
    }
  }, [providerOrderData, editableOrderItems.length]);

  // PROVIDER 实现配送人员选择流程
  const submitStartProcessing = async () => {
    try {
      setProcessing(true);

      const response = await fetch(`/api/orders/${orderCode}/start-preparing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idCard: selectedDeliveryStaff?.idCard || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`开始备货失败: ${response.status}`);
      }

      const result = await response.json();
      const newStatus = result.data;

      // 更新订单状态
      if (providerOrderData) {
        setProviderOrderData({
          ...providerOrderData,
          orderStatus: newStatus
        });
      }

      // 关闭对话框
      setShowDeliveryStaffDialog(false);
      setSelectedDeliveryStaff(null);

      // 显示成功消息
      toast({
        title: '操作成功',
        description: `订单已开始备货处理${selectedDeliveryStaff ? `，配送人员：${selectedDeliveryStaff.name}` : ''}`,
        variant: 'default',
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: '操作失败',
        description: err instanceof Error ? err.message : '开始备货时出错',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setProcessing(false);
    }
  };

  // 保存实际数量
  const handleSaveActualQuantities = async () => {
    try {
      setSavingChanges(true);
      setItemErrors({});

      // 如果订单状态是EXCHANGE_IN_PROGRESS，调用换货配送API
      if (providerOrderData?.orderStatus === 'EXCHANGE_IN_PROGRESS') {

        // 收集当前配送的商品数据
        const exchangeItems = providerOrderData.current.items.map(item => {
          // 找到对应的editableOrderItems中的用户设置的数量
          const editableItem = editableOrderItems.find(e => e.id === item.orderDetailId);
          const actualQuantity = editableItem ? parseFloat((editableItem as any).deliveredQuantity || '0') : parseFloat(item.needToDeliverQty || '0');

          return {
            orderDetailId: item.orderDetailId,
            actualQuantity: actualQuantity,
          };
        });

        if (exchangeItems.length === 0) {
          toast({
            title: "提示",
            description: "没有需要保存的更改",
          });
          return;
        }

        // 调用换货配送API
        const response = await fetch(`/api/orders/${orderCode}/exchange-deliver`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: exchangeItems,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '提交换货配送失败');
        }

        const result = await response.json();

        toast({
          title: "成功",
          description: "换货配送已提交",
          variant: "default",
          duration: 3000,
        });
      } else {
        // 从editableOrderItems中收集有deliveredQuantity的商品
        const items = editableOrderItems
          .filter(item => (item as any).deliveredQuantity !== undefined && (item as any).deliveredQuantity !== null && (item as any).deliveredQuantity !== "")
          .map(item => ({
            id: item.id,
            deliveredQuantity: parseFloat((item as any).deliveredQuantity),
          }));

        if (items.length === 0) {
          toast({
            title: "提示",
            description: "没有需要保存的更改",
          });
          return;
        }

        // 调用API保存 - 配送到市场
        const response = await fetch(`/api/orders/${orderCode}/deliver-to-market`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '保存失败');
        }

        const result = await response.json();

        toast({
          title: "成功",
          description: "实际发货数量已更新",
          variant: "default",
          duration: 3000,
        });
      }

      // 重新获取订单数据，显示服务器返回的actualQty
      await refreshData();
    } catch (err) {
      toast({
        title: "保存失败",
        description: err instanceof Error ? err.message : '保存实际数量时出错',
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setSavingChanges(false);
    }
  };

  // 获取 PROVIDER 策略
  const orderStrategy = useMemo(() => getOrderStrategy(TenantType.PROVIDER), []);

  // 构建策略上下文
  const strategyContext: OrderStrategyContext = useMemo(() => {
    if (!providerOrderData || !convertedData) {
      return {} as OrderStrategyContext; // 返回空上下文
    }

    return {
      orderDetail: convertedData.orderDetail,
      orderItems: convertedData.orderItems,
      returnExchangeRecords: [], // PROVIDER 数据中没有退换货记录
      productStatusSummary: {
        totalItems: convertedData.orderItems.length,
        hasExchange: false,
        allInspected: false,
        itemStatusMap: {},
      }, // PROVIDER 数据中没有产品状态汇总
      inspectionProgress: {
        marketCompleted: false,
        customerCompleted: false,
        marketInspectionResult: null,
        customerInspectionResult: null,
      },
      currentInspectionResult: null,
      rawReceipts: [],
      deliveries: [],
      orderCode: providerOrderData.orderCode,
      isEditing: isEditing,
      savingChanges,
      hasErrors: () => false, // PROVIDER 模式下暂时没有错误检查
      actualTotal: parseFloat(providerOrderData.orderedAmount),
      discountTotal: parseFloat(providerOrderData.discountAmount),
      originalTotal: parseFloat(providerOrderData.orderedAmount),
      returnMoney: 0,
      status: providerOrderData.orderStatus as OrderStatus,
      tenantType: TenantType.PROVIDER,
      startingExchange,
      processing,
      handleBeginExchangeProcessing: async () => {
        setStartingExchange(true);
        try {
          const response = await fetch(`/api/orders/${orderCode}/begin-exchange-progress`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ operateBy: "PROVIDER_USER" }),
          });

          if (!response.ok) {
            throw new Error(`开始换货失败: ${response.status}`);
          }

          toast({
            title: '操作成功',
            description: '已确认退换货，开始处理',
            variant: 'default',
          });
          
          // 刷新数据
          refreshData();

        } catch (err) {
          toast({
            title: '操作失败',
            description: err instanceof Error ? err.message : '开始换货时出错',
            variant: 'destructive',
          });
        } finally {
          setStartingExchange(false);
        }
      },
      handleStartProcessing: async () => {
        // PROVIDER 实现：先获取配送人员，然后显示选择对话框
        try {
          setProcessing(true);

          // 获取配送人员列表
          const staffResponse = await fetch(`/api/providers/${orgId}/delivery-staffs`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!staffResponse.ok) {
            throw new Error(`获取配送人员列表失败: ${staffResponse.status}`);
          }

          const staffData = await staffResponse.json();
          const deliveryStaffsData = staffData.data || [];
          const activeStaffs = deliveryStaffsData.filter((staff: DeliveryPerson) => staff.status === 1);

          if (activeStaffs.length === 0) {
            setShowNoStaffAlert(true);
            return;
          }

          // 显示配送人员选择对话框
          setDeliveryStaffs(activeStaffs);
          setShowDeliveryStaffDialog(true);
        } catch (err) {
          toast({
            title: '操作失败',
            description: err instanceof Error ? err.message : '获取配送人员时出错',
            variant: 'destructive',
            duration: 3000,
          });
        } finally {
          setProcessing(false);
        }
      },

      submitStartProcessing,

      handleSaveActualQuantities,
    };
  }, [providerOrderData, savingChanges, startingExchange, processing, convertedData, isEditing, submitStartProcessing, handleSaveActualQuantities]);

  // 计算是否所有输入都有效
  const areAllInputsValid = useMemo(() => {
    if (!isEditing || editableOrderItems.length === 0) return false;

    // 检查是否有任何错误
    if (Object.keys(itemErrors).length > 0) return false;

    // 检查所有商品是否都有有效的发货数量
    return editableOrderItems.every(item => {
      const deliveredQuantity = (item as any).deliveredQuantity;
      if (!deliveredQuantity) return false;

      const error = validateQuantity(deliveredQuantity, item.unit);
      return error === null;
    });
  }, [isEditing, editableOrderItems, itemErrors]);

  // 获取策略按钮
  const strategyButtons = useMemo(() => {
    if (!providerOrderData || !strategyContext.orderDetail) {
      return [];
    }

    const buttons = orderStrategy.getActionDescriptors(strategyContext);

    // 修改"完成备货"按钮，添加确认对话框和验证
    return buttons.map(button => {
      if (button.key === 'provider-finalize-quantities') {
        return {
          ...button,
          disabled: button.disabled || !areAllInputsValid,
          onClick: () => setShowCompleteDialog(true),
        };
      }
      return button;
    });
  }, [orderStrategy, strategyContext, areAllInputsValid]);

  // 处理实际数量变更
  const handleActualQuantityChange = (id: number, round: number, value: string) => {
    // 找到对应的商品项
    const item = editableOrderItems.find(item => item.id === id && item.round === round);
    if (!item) return;

    // 验证输入值
    const error = validateQuantity(value, item.unit);

    // 更新商品数据
    setEditableOrderItems(prev =>
      prev.map(item => {
        if (item.id === id && item.round === round) {
          return {
            ...item,
            deliveredQuantity: value
          };
        }
        return item;
      })
    );

    // 设置或清除错误
    setItemErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[id] = error;
      } else {
        delete newErrors[id];
      }
      return newErrors;
    });
  };

  // 处理键盘事件
  const handleActualQuantityKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, id: number) => {
    if (event.key === 'Enter') {
      // 可以在这里添加自动保存逻辑
    }
  };

  // 加载 PROVIDER 订单数据
  useEffect(() => {
    const fetchProviderOrderDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = `/api/orders/${orderCode}`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });


        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // API 路由已经返回了解包后的 data，直接使用
        const providerOrderData: ProviderOrderData = await response.json();
        console.log('✅ ProviderOrderDetails - Received PROVIDER order data');

        setProviderOrderData(providerOrderData);

      } catch (error) {
        console.error('获取PROVIDER订单详情失败:', error);
        setError(error instanceof Error ? error.message : '获取订单详情失败');
        toast({
          title: "获取订单详情失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProviderOrderDetail();
  }, [orderCode, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !providerOrderData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">加载失败: {error}</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 头部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold">订单详情</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getStatusVariant(providerOrderData.orderStatus)}>
                {translateOrderStatus(providerOrderData.orderStatus)}
              </Badge>
            </div>
          </div>
        </div>

        {/* 操作按钮区域 */}
        <div className="flex items-center gap-2">
          {/* 策略生成的按钮 */}
          {strategyButtons.map((action) => {
            if (action.type === "dialog") {
              // 对话框类型的按钮
              return (
                <Button
                  key={action.key}
                  variant={action.variant || "default"}
                  size={action.size || "sm"}
                  className={action.className}
                  onClick={() => setDialogState({ open: true, action })}
                  disabled={action.disabled || action.loading}
                >
                  {action.loading ? action.label : (
                    <>
                      {action.icon}
                      {action.label}
                    </>
                  )}
                </Button>
              );
            } else {
              // 普通按钮
              return (
                <Button
                  key={action.key}
                  variant={action.variant || "default"}
                  size={action.size || "sm"}
                  className={action.className}
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                >
                  {action.loading ? action.label : (
                    <>
                      {action.icon}
                      {action.label}
                    </>
                  )}
                </Button>
              );
            }
          })}

          {/* 导出按钮 */}
          <Button variant="outline" size="sm" onClick={() => {
            toast({
              title: "导出功能",
              description: "导出功能正在开发中",
            });
          }}>
            <Download className="mr-2 h-4 w-4" />
            导出Excel
          </Button>
        </div>
      </div>

      {/* 订单基本信息 */}
      <Card>
        <CardHeader>
          <Collapsible open={!isOrderInfoCollapsed} onOpenChange={(open) => setIsOrderInfoCollapsed(!open)}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <CardTitle className="text-left">订单信息</CardTitle>
              {isOrderInfoCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
          </Collapsible>
        </CardHeader>
        <Collapsible open={!isOrderInfoCollapsed} onOpenChange={(open) => setIsOrderInfoCollapsed(!open)}>
          <CollapsibleContent>
            <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">订单号</p>
              <p className="text-sm">{providerOrderData.orderCode}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">创建时间</p>
              <p className="text-sm">{new Date(providerOrderData.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">配送日期</p>
              <p className="text-sm">{new Date(providerOrderData.deliveryDate).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">客户名称</p>
              <p className="text-sm">{providerOrderData.customerName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">收货人</p>
              <p className="text-sm">{providerOrderData.receiverName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">收货电话</p>
              <p className="text-sm">{providerOrderData.receiverPhone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">发货人</p>
              <p className="text-sm">{providerOrderData.shipperName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">发货电话</p>
              <p className="text-sm">{providerOrderData.shipperPhone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">配送地址</p>
              <p className="text-sm">{providerOrderData.deliveryAddress}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">订单金额</p>
              <p className="text-sm">¥{providerOrderData.orderedAmount}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">折扣金额</p>
              <p className="text-sm">¥{providerOrderData.discountAmount}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">净金额</p>
              <p className="text-sm">¥{providerOrderData.netAmount}</p>
            </div>
          </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 主要内容标签页 */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">商品清单</TabsTrigger>
          <TabsTrigger value="rounds">配送状态</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {convertedData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>商品清单</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {editableOrderItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 bg-card">
                        {/* 商品基本信息 */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-foreground">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>SKU: {item.productId}</span>
                              <span>分类: {item.category}</span>
                              <span>规格: {item.unit}</span>
                            </div>
                          </div>
                        </div>

                        {/* 数量信息 - 使用表格样式布局 */}
                        <div className="border-t pt-3">
                          <div className="grid grid-cols-3 gap-4 items-center">
                            {/* 需求量 */}
                            <div className="text-center">
                              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">需求量</div>
                              <div className="text-medium font-bold font-mono text-foreground bg-muted/50 rounded-md px-3 py-2 border">
                                {item.orderedQty} {item.unit}
                              </div>
                            </div>

                            {/* 分隔符 */}
                            <div className="flex justify-center">
                              <div className="w-px h-8 bg-border"></div>
                            </div>

                            {/* 发货量 */}
                            <div className="text-center">
                              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                                {isEditing ? '发货量' : '已发货'}
                              </div>
                              <div className="flex justify-center">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <Input
                                      type="number"
                                      value={(item as any).deliveredQuantity || ""}
                                      onChange={(event) => handleActualQuantityChange(item.id, item.round || 1, event.target.value)}
                                      className={`w-24 text-center font-mono font-semibold text-medium ${itemErrors[item.id] ? "border-red-500" : ""}`}
                                      step={true ? "0.01" : "1"}
                                      min="0"
                                      max="999999.99"
                                      onKeyDown={(event) => handleActualQuantityKeyDown?.(event, item.id)}
                                      placeholder="0.00"
                                    />
                                    {itemErrors[item.id] && (
                                      <p className="text-xs text-red-500 text-center">{itemErrors[item.id]}</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-lg font-bold text-foreground bg-muted/50 rounded-md px-3 py-2 border min-w-[80px]">
                                    {parseFloat((item as any).deliveredQuantity || '0') > 0
                                      ? `${parseFloat((item as any).deliveredQuantity || '0').toFixed(2)} ${item.unit}`
                                      : "-"
                                    }
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="rounds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>配送状态详情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      当前配送状态
                    </h3>
                    <div className="flex gap-2">
                      <Badge variant={providerOrderData.current.deliveryType === 'NORMAL' ? 'default' : 'secondary'}>
                        {providerOrderData.current.deliveryType === 'NORMAL' ? '正常配送' : '换货配送'}
                      </Badge>
                      <Badge variant="outline">
                        {providerOrderData.current.deliveryStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">商品数量</p>
                      <p className="text-lg font-semibold">{providerOrderData.current.items.length} 件</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">总需配送</p>
                      <p className="text-lg font-semibold">
                        {providerOrderData.current.items.reduce((sum, item) => sum + parseFloat(item.needToDeliverQty), 0)} 件
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium mb-2">商品列表：</h4>
                    <div className="space-y-2">
                      {providerOrderData.current.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.categoryName} · {item.productCode} · {item.needToDeliverQty}{item.unit}
                            </div>
                          </div>
                          <div className="text-sm text-blue-600 font-medium">
                            {item.actualQty ? `${item.actualQty} ${item.unit}` : '待配送'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 策略对话框 */}
      <AlertDialog open={dialogState.open} onOpenChange={(open) =>
        setDialogState({ ...dialogState, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogState.action?.dialog.title}</AlertDialogTitle>
            {dialogState.action?.dialog.description && (
              <AlertDialogDescription>
                {dialogState.action.dialog.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {dialogState.action?.dialog.body && (
            <div className="py-4">
              {dialogState.action.dialog.body}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>
              {dialogState.action?.dialog.cancelLabel || "取消"}
            </AlertDialogCancel>
            <AlertDialogAction
              className={dialogState.action?.dialog.confirmClassName}
              onClick={() => {
                if (dialogState.action?.onConfirm) {
                  dialogState.action.onConfirm();
                }
                setDialogState({ open: false });
              }}
            >
              {dialogState.action?.dialog.confirmLabel || "确认"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 配送人员选择对话框 */}
      <Dialog open={showDeliveryStaffDialog} onOpenChange={setShowDeliveryStaffDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>选择配送人员</DialogTitle>
            <DialogDescription>
              请选择负责配送该订单的配送人员。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="delivery-staff" className="text-right">
                配送人员
              </label>
              <Select
                value={selectedDeliveryStaff?.idCard || ""}
                onValueChange={(value) => {
                  const staff = deliveryStaffs.find(s => s.idCard === value);
                  setSelectedDeliveryStaff(staff || null);
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="请选择配送人员" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryStaffs.map((staff) => (
                    <SelectItem key={staff.idCard} value={staff.idCard}>
                      {staff.name} ({staff.idCard})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeliveryStaffDialog(false);
                setSelectedDeliveryStaff(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                if (selectedDeliveryStaff) {
                  submitStartProcessing();
                }
              }}
              disabled={!selectedDeliveryStaff || processing}
            >
              {processing ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 无配送人员提示对话框 */}
      <AlertDialog open={showNoStaffAlert} onOpenChange={setShowNoStaffAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>无可用配送人员</AlertDialogTitle>
            <AlertDialogDescription>
              当前没有启用的配送人员，无法开始备货。请先添加并启用至少一名配送人员。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowNoStaffAlert(false);
                // 跳转到配送人员管理页面
                router.push(`/workspace/providers/${orgId}/delivery_staffs`);
              }}
            >
              前往添加配送人员
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 完成备货确认对话框 */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认完成备货</AlertDialogTitle>
            <AlertDialogDescription>
              确认后将提交所有商品的实际发货数量，订单状态将更新。提交后无法修改发货数量。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCompleteDialog(false);
                handleSaveActualQuantities();
              }}
            >
              确认完成备货
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

