"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  Truck,
  Package,
  Minus,
  Plus,
  AlertTriangle,
  Info,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { translateOrderStatus, getStatusVariant } from "@/lib/utils";
import { MarketInspectionData, MarketInspectionItem, MarketInspectionResponse } from "@/lib/types/marketOrder";
import { OrderStatus } from "@/lib/types/orderStatus";

// Helper function to format quantity display with proper decimal places
const formatQuantity = (value: any, unit?: string): string => {
  if (value === null || value === undefined || value === "") return "-";

  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) return String(value);

  // For kg/g units, show up to 2 decimal places
  if (unit && (unit.toLowerCase() === 'kg' || unit.toLowerCase() === 'g')) {
    return num.toFixed(2);
  }

  // For other units, show as integer if whole number, otherwise 2 decimals
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
};

// Common reasons for exchange/return in fresh food business
const EXCHANGE_RETURN_REASONS = [
  { value: "quality_issue", label: "质量问题 - 商品变质、腐烂" },
  { value: "wrong_spec", label: "规格不符 - 与描述不一致" },
  { value: "packaging_damage", label: "包装损坏 - 影响商品质量" },
  { value: "wrong_quantity", label: "数量错误 - 实际数量与订单不符" },
  { value: "expired", label: "临近过期 - 保存期不足要求" },
  { value: "foreign_matter", label: "异物混入 - 发现杂质或异物" },
  { value: "temperature_issue", label: "温度异常 - 冷链断裂导致变质" },
  { value: "wrong_item", label: "商品错发 - 收到错误商品" },
  { value: "size_issue", label: "大小不均 - 个头差异过大" },
  { value: "other", label: "其他原因" },
];

// 临时定义操作类型
type OperationType = "SIGN" | "RETURN" | "EXCHANGE";

export default function OrderInspectionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderCode = params.order_code as string;
  const marketId = params.market_id as string;

  // Data State
  const [inspectionData, setInspectionData] = useState<MarketInspectionData | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);

  // Add a ref to track the latest data
  const latestDataRef = useRef<MarketInspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState("inspection");

  // Operation Dialog State
  const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false);
  const [currentOperatingItem, setCurrentOperatingItem] = useState<MarketInspectionItem | null>(null);
  const [operationType, setOperationType] = useState<OperationType>("SIGN");
  const [operationQuantity, setOperationQuantity] = useState("");
  const [operationReason, setOperationReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmittingOperation, setIsSubmittingOperation] = useState(false);

  // Confirmation Dialog State
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);

  // Fetch Inspection Data
  const fetchInspectionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderCode}/inspection-data`);
      if (!response.ok) {
        throw new Error(`获取验收数据失败: ${response.status}`);
      }

      const result = await response.json();

      // API route returns wrapped response, so result.data is the backend response
      // We need result.data.data for the actual inspection data
      const backendData = result.data; // This is the backend JSON

      // Ensure data has required structure with defaults
      const inspectionDataFromBackend = backendData?.data;
      const processedData = {
        round: inspectionDataFromBackend?.round || 1,
        deliveryType: inspectionDataFromBackend?.deliveryType || 'NORMAL',
        deliveredAt: inspectionDataFromBackend?.deliveredAt || '',
        inspectionResult: inspectionDataFromBackend?.inspectionResult || 'PENDING',
        inspectionAt: inspectionDataFromBackend?.inspectionAt || null,
        items: Array.isArray(inspectionDataFromBackend?.items) ? inspectionDataFromBackend.items : []
      };

      // Update both state and ref
      setInspectionData(processedData as MarketInspectionData);
      latestDataRef.current = processedData as MarketInspectionData;
    } catch (err) {
      console.error("Error fetching inspection data:", err);
      setError(err instanceof Error ? err.message : "获取验收数据失败");
      toast({
        title: "获取失败",
        description: err instanceof Error ? err.message : "无法加载验收数据",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Order Status
  const fetchOrderStatus = async () => {
    try {
      const response = await fetch(`/api/orders/${orderCode}`);
      if (!response.ok) {
        throw new Error(`获取订单详情失败: ${response.status}`);
      }
      const orderData = await response.json();
      // 订单详情 API 返回格式: { order: { orderStatus: "..." } }
      if (orderData?.order?.orderStatus) {
        setOrderStatus(orderData.order.orderStatus as OrderStatus);
      } else if (orderData?.orderStatus) {
        // 兼容直接返回 orderStatus 的情况
        setOrderStatus(orderData.orderStatus as OrderStatus);
      }
    } catch (err) {
      console.error("Error fetching order status:", err);
      // 如果获取订单状态失败，不影响页面显示
    }
  };

  useEffect(() => {
    fetchInspectionData();
    fetchOrderStatus();
  }, [orderCode]);


  // Calculate stats
  const stats = useMemo(() => {
    const data = inspectionData || latestDataRef.current;
    if (!data?.items || !Array.isArray(data.items)) return { total: 0, pending: 0, inspected: 0 };
    const total = data.items.length;
    const pending = data.items.filter(
      (i) => i.inspectionStatus === "PENDING"
    ).length;
    const inspected = total - pending;
    return { total, pending, inspected };
  }, [inspectionData]);

  // Handlers
  const handleOpenOperationDialog = (
    item: MarketInspectionItem,
    type: OperationType = "SIGN"
  ) => {
    setCurrentOperatingItem(item);
    setOperationType(type);
    setOperationQuantity(item.needToInspectQty);
    setOperationReason("");
    setIsOperationDialogOpen(true);
  };

  const handleSubmitOperation = async () => {
    if (!currentOperatingItem || !currentData) return;

    try {
      setIsSubmittingOperation(true);

      // Validate input
      const qty = parseFloat(operationQuantity);
      if (isNaN(qty) || qty < 0) {
        toast({
          title: "输入错误",
          description: "请输入有效的数量",
          variant: "destructive",
        });
        return;
      }

      if (qty > parseFloat(currentOperatingItem.needToInspectQty)) {
        toast({
          title: "输入错误",
          description: "操作数量不能大于待验收数量",
          variant: "destructive",
        });
        return;
      }

      if (operationType !== "SIGN" && !operationReason) {
        toast({
          title: "输入错误",
          description: "退换货必须选择原因",
          variant: "destructive",
        });
        return;
      }

      if (operationType !== "SIGN" && operationReason === "other" && !customReason.trim()) {
        toast({
          title: "输入错误",
          description: "请选择或填写具体原因",
          variant: "destructive",
        });
        return;
      }

      // Call API
      const payload = {
        operateBy: "MARKET_USER",
        receipt: {
          id: currentOperatingItem.inspectionItemId,
          orderId: orderCode,
          productId: currentOperatingItem.productCode,
          productName: currentOperatingItem.productName,
          operationType: operationType,
          quantity: qty,
          reason: operationReason,
          unit: currentOperatingItem.unit,
        },
      };

      const response = await fetch(
        `/api/orders/${orderCode}/inspect-sub-orders`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...payload,
            receipt: {
              ...payload.receipt,
              reason: operationType === "SIGN"
                ? "商品完好，确认签收"
                : operationReason === "other"
                  ? customReason
                  : EXCHANGE_RETURN_REASONS.find(r => r.value === operationReason)?.label || operationReason
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error("提交操作失败");
      }

      const responseData = await response.json();
      const inspectionResult = responseData.data;

      toast({
        title: "操作成功",
        description: "商品状态已更新",
        variant: "default",
      });

      // Update local state
      if (currentData && currentData.items && Array.isArray(currentData.items)) {
        const newItems = currentData.items.map(item => {
          if (item.inspectionItemId === currentOperatingItem.inspectionItemId) {
            return {
              ...item,
              inspectionStatus: operationType,
              acceptedQty: operationType === "SIGN" ? operationQuantity : item.acceptedQty,
            };
          }
          return item;
        });
        setInspectionData({
          ...currentData,
          items: newItems
        });
        latestDataRef.current = {
          ...currentData,
          items: newItems
        };
      }

      setIsOperationDialogOpen(false);
    } catch (err) {
      toast({
        title: "操作失败",
        description: err instanceof Error ? err.message : "提交失败",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingOperation(false);
    }
  };

  const handleCompleteAcceptance = async () => {
    try {
      setIsCompletingOrder(true);

      const hasExchange = inspectionData?.items.some(i => i.inspectionStatus === "EXCHANGE");

      const apiUrl = hasExchange
        ? `/api/orders/${orderCode}/exchange-request`
        : `/api/orders/${orderCode}/complete-inspection`;

      const status = hasExchange
        ? "EXCHANGE_REQUESTED"
        : "MARKET_ACCEPTED";

      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operateBy: "MARKET_USER",
          status: status
        })
      });

      if (!response.ok) {
        throw new Error("提交失败");
      }

      toast({
        title: "提交成功",
        description: hasExchange ? "换货申请已提交" : "验收完成",
        variant: "default",
      });

      setIsConfirmDialogOpen(false);
      router.push(`/workspace/markets/${marketId}/orders/${orderCode}`);
    } catch (err) {
      toast({
        title: "提交失败",
        description: err instanceof Error ? err.message : "操作失败",
        variant: "destructive",
      });
    } finally {
      setIsCompletingOrder(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "SIGN":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="w-3 h-3 mr-1" /> 已签收
          </Badge>
        );
      case "RETURN":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> 已退货
          </Badge>
        );
      case "EXCHANGE":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            <RefreshCw className="w-3 h-3 mr-1" /> 已换货
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-500">
            待验收
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-lg font-medium text-gray-900">加载验收数据失败</p>
        <p className="text-sm text-gray-500">{error}</p>
        <Button onClick={() => router.back()}>返回</Button>
      </div>
    );
  }

  // Use data from state or ref
  const currentData = inspectionData || latestDataRef.current;

  // Additional safety check - items should be an array
  if (!currentData || !Array.isArray(currentData.items)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-lg font-medium text-gray-900">验收数据格式错误</p>
        <p className="text-sm text-gray-500">items字段不是数组类型</p>
        <Button onClick={() => router.back()}>返回</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <h1 className="text-lg font-bold tracking-tight">
              商品验收
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              验收单 {orderCode}
            </span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              第 {inspectionData.round} 轮
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsConfirmDialogOpen(true)}
            size="sm"
            disabled={stats.pending > 0}
          >
            {orderStatus === OrderStatus.EXCHANGE_INSPECTING
              ? "确认换货验收"
              : orderStatus === OrderStatus.MARKET_INSPECTING || orderStatus === OrderStatus.CUSTOMER_INSPECTING
              ? "确认验收"
              : currentData.inspectionResult === "PENDING"
              ? "确认换货验收"
              : "完成验收"}
          </Button>
        </div>
      </div>

      {/* Inspection Header with Stats */}
      <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {currentData.deliveryType === "EXCHANGE" ? "换货验收" : "验收单"}
                    <span className="text-sm font-normal text-slate-500 ml-2">
                      第 {currentData.round} 轮
                    </span>
                  </h2>
                <p className="text-sm text-slate-500">请仔细验收每一件商品，确保质量符合要求</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                <div className="text-xs text-slate-500">总计商品</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.inspected}</div>
                <div className="text-xs text-slate-500">已验收</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-xs text-slate-500">待验收</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.inspected / stats.total) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>验收进度</span>
            <span>{stats.inspected} / {stats.total} 件商品</span>
          </div>
        </CardContent>
      </Card>

      {/* Inspection Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {currentData.items.map((item, index) => (
          <Card key={`i_${currentData.round}_${item.inspectionItemId}_${index}`}
                className="border-slate-100 shadow-sm bg-white rounded-2xl hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-6">
              {/* Product Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                    {item.productName}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                      {item.productCode}
                    </Badge>
                    {item.processingRequirements && (
                      <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        {item.processingRequirements}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="ml-3">
                  {renderStatusBadge(item.inspectionStatus)}
                </div>
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">单价</div>
                  <div className="font-semibold text-slate-900">
                    ¥{item.unitPrice}
                    <span className="text-xs text-slate-500 ml-1">/ {item.unit}</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">订购量</div>
                  <div className="font-semibold text-slate-900 font-mono">{item.orderedQty}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 mb-1">待验收</div>
                  <div className="font-semibold text-blue-700 font-mono">{item.needToInspectQty}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-600 mb-1">实收量</div>
                  <div className="font-semibold text-green-700 font-mono">
                    {formatQuantity(item.acceptedQty, item.unit)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {item.inspectionStatus === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                      onClick={() => handleOpenOperationDialog(item, "SIGN")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      签收
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-3 text-orange-600 border-orange-200 hover:bg-orange-50"
                        onClick={() => handleOpenOperationDialog(item, "EXCHANGE")}
                        title="换货"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-3 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleOpenOperationDialog(item, "RETURN")}
                        title="退货"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
                {item.inspectionStatus !== "PENDING" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-slate-600 border-slate-200 hover:bg-slate-50"
                    onClick={() => {
                      handleOpenOperationDialog(item, item.inspectionStatus as OperationType);
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    修改验收结果
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operation Dialog */}
      <Dialog open={isOperationDialogOpen} onOpenChange={setIsOperationDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 border-0 shadow-2xl">
          <div className="relative">
            {/* Header with gradient background */}
            <div className={`relative px-6 py-4 rounded-t-2xl ${
              operationType === "SIGN"
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : operationType === "EXCHANGE"
                ? "bg-gradient-to-r from-orange-500 to-amber-600"
                : "bg-gradient-to-r from-red-500 to-rose-600"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {operationType === "SIGN" && <CheckCircle className="w-5 h-5 text-white" />}
                  {operationType === "EXCHANGE" && <RefreshCw className="w-5 h-5 text-white" />}
                  {operationType === "RETURN" && <RotateCcw className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <DialogTitle className="text-white text-lg font-semibold">
                    {operationType === "SIGN" && "确认签收商品"}
                    {operationType === "RETURN" && "申请退货"}
                    {operationType === "EXCHANGE" && "申请换货"}
                  </DialogTitle>
                  <p className="text-white/80 text-sm mt-0.5">
                    {currentOperatingItem?.productName}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Product Info Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">
                      {currentOperatingItem?.productName}
                    </h4>
                    {currentOperatingItem?.processingRequirements && (
                      <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700">
                        {currentOperatingItem.processingRequirements}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">单价：</span>
                      <span className="font-medium text-slate-900">
                        ¥{currentOperatingItem?.unitPrice} / {currentOperatingItem?.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">SKU：</span>
                      <span className="font-medium text-slate-900">
                        {currentOperatingItem?.productCode}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Input Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700">
                    {operationType === "SIGN" ? "实收数量" : "操作数量"}
                  </Label>
                  <span className="text-xs text-slate-500">
                    待验收: {currentOperatingItem?.needToInspectQty} {currentOperatingItem?.unit}
                  </span>
                </div>

                {/* Quantity Input with +/- buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0 border-slate-300 hover:bg-slate-50"
                    onClick={() => {
                      const current = parseFloat(operationQuantity) || 0;
                      const unit = currentOperatingItem?.unit?.toLowerCase();
                      const step = (unit === 'kg' || unit === 'g') ? 0.1 : 1;
                      const newValue = Math.max(0, current - step);
                      const formattedValue = (unit === 'kg' || unit === 'g') ? newValue.toFixed(2) : newValue.toString();
                      setOperationQuantity(formattedValue);
                    }}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>

                  <div className="flex-1">
                    <Input
                      type="number"
                      value={operationQuantity}
                      onChange={(e) => setOperationQuantity(e.target.value)}
                      className="h-10 text-center font-mono text-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      min="0"
                      max={parseFloat(currentOperatingItem?.needToInspectQty || '0') || undefined}
                      step={(currentOperatingItem?.unit?.toLowerCase() === 'kg' ||
                             currentOperatingItem?.unit?.toLowerCase() === 'g') ? "0.01" : "1"}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0 border-slate-300 hover:bg-slate-50"
                    onClick={() => {
                      const current = parseFloat(operationQuantity) || 0;
                      const max = parseFloat(currentOperatingItem?.needToInspectQty || '0') || 0;
                      const unit = currentOperatingItem?.unit?.toLowerCase();
                      const step = (unit === 'kg' || unit === 'g') ? 0.1 : 1;
                      const newValue = Math.min(max, current + step);
                      const formattedValue = (unit === 'kg' || unit === 'g') ? newValue.toFixed(2) : newValue.toString();
                      setOperationQuantity(formattedValue);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Unit hint */}
                <div className="text-xs text-slate-500 text-center">
                  {(() => {
                    const unit = currentOperatingItem?.unit?.toLowerCase();
                    if (unit === 'kg' || unit === 'g') {
                      return '支持小数输入，每次增减 100g (0.1kg)';
                    }
                    return '只能输入整数，每次增减 1';
                  })()}
                </div>

                {/* Quantity validation feedback */}
                {(() => {
                  const qty = parseFloat(operationQuantity);
                  const maxQty = parseFloat(currentOperatingItem?.needToInspectQty || '0') || 0;
                  const unit = currentOperatingItem?.unit?.toLowerCase();

                  if (isNaN(qty) || qty < 0) {
                    return (
                      <div className="flex items-center gap-2 text-red-600 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        请输入有效的数量
                      </div>
                    );
                  }

                  if (qty > maxQty) {
                    return (
                      <div className="flex items-center gap-2 text-red-600 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        操作数量不能超过待验收数量
                      </div>
                    );
                  }

                  if ((unit === 'kg' || unit === 'g') && qty % 0.01 !== 0) {
                    const decimalPlaces = (qty.toString().split('.')[1] || '').length;
                    if (decimalPlaces > 2) {
                      return (
                        <div className="flex items-center gap-2 text-red-600 text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          小数点后最多保留2位
                        </div>
                      );
                    }
                  }

                  if (unit !== 'kg' && unit !== 'g' && qty % 1 !== 0) {
                    return (
                      <div className="flex items-center gap-2 text-red-600 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        此单位只能输入整数
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>

              {/* Reason Selection (for exchange and return) */}
              {operationType !== "SIGN" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <Label className="text-sm font-medium text-slate-700">
                      {operationType === "EXCHANGE" ? "换货原因" : "退货原因"}
                    </Label>
                  </div>

                  <Select
                    value={operationReason}
                    onValueChange={(value) => {
                      setOperationReason(value);
                      if (value !== "other") {
                        setCustomReason("");
                      }
                    }}
                  >
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder={`选择${operationType === "EXCHANGE" ? "换货" : "退货"}原因`} />
                    </SelectTrigger>
                    <SelectContent>
                      {EXCHANGE_RETURN_REASONS.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!operationReason && (
                    <div className="flex items-center gap-2 text-amber-600 text-xs">
                      <Info className="w-3 h-3" />
                      请选择{operationType === "EXCHANGE" ? "换货" : "退货"}原因
                    </div>
                  )}

                  {operationReason === "other" && (
                    <Textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="请详细说明其他原因..."
                      className="min-h-[60px] border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    />
                  )}

                  {operationReason === "other" && !customReason.trim() && (
                    <div className="flex items-center gap-2 text-amber-600 text-xs">
                      <Info className="w-3 h-3" />
                      请填写具体原因
                    </div>
                  )}
                </div>
              )}

              {/* Operation Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">操作确认</p>
                    <p className="text-blue-700">
                      {operationType === "SIGN" && `确认签收 ${formatQuantity(operationQuantity, currentOperatingItem?.unit)} ${currentOperatingItem?.unit} 商品`}
                      {operationType === "EXCHANGE" && `申请更换 ${formatQuantity(operationQuantity, currentOperatingItem?.unit)} ${currentOperatingItem?.unit} 商品`}
                      {operationType === "RETURN" && `申请退货 ${formatQuantity(operationQuantity, currentOperatingItem?.unit)} ${currentOperatingItem?.unit} 商品`}
                    </p>
                    {operationType !== "SIGN" && operationReason && (
                      <p className="text-blue-700 text-xs mt-1">
                        原因: {operationReason === "other"
                          ? (customReason || "其他原因")
                          : EXCHANGE_RETURN_REASONS.find(r => r.value === operationReason)?.label}
                      </p>
                    )}
                    <p className="text-blue-600 text-xs mt-1">
                      提交后将通知供应商处理{operationType === "SIGN" ? "" : "，请耐心等待"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setIsOperationDialogOpen(false)}
                className="border-slate-300 hover:bg-slate-100"
              >
                取消
              </Button>
              <Button
                onClick={handleSubmitOperation}
                disabled={isSubmittingOperation || (() => {
                  const qty = parseFloat(operationQuantity);
                  const maxQty = parseFloat(currentOperatingItem?.needToInspectQty || '0') || 0;
                  return isNaN(qty) || qty < 0 || qty > maxQty ||
                         (operationType !== "SIGN" && (!operationReason || (operationReason === "other" && !customReason.trim())));
                })()}
                className={`min-w-[100px] ${
                  operationType === "SIGN"
                    ? "bg-green-600 hover:bg-green-700"
                    : operationType === "EXCHANGE"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isSubmittingOperation ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    处理中...
                  </div>
                ) : (
                  <>
                    {operationType === "SIGN" && <CheckCircle className="w-4 h-4 mr-2" />}
                    {operationType === "EXCHANGE" && <RefreshCw className="w-4 h-4 mr-2" />}
                    {operationType === "RETURN" && <RotateCcw className="w-4 h-4 mr-2" />}
                    确认{operationType === "SIGN" ? "签收" : operationType === "EXCHANGE" ? "换货" : "退货"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认完成验收?</AlertDialogTitle>
            <AlertDialogDescription>
              确定所有商品都已验收无误吗？提交后将无法更改验收结果。
              如有退换货申请，将一并提交给供应商处理。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteAcceptance} disabled={isCompletingOrder}>
              {isCompletingOrder ? "处理中..." : "确认提交"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
