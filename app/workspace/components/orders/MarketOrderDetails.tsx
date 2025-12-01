"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  Truck,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { translateOrderStatus, getStatusVariant } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import new types
import {
  MarketOrderData,
  MarketOrderRound,
  MarketOrderItem,
} from "@/lib/types/marketOrder";

// Provider interface extracted from page
export interface Provider {
  id: string;
  name: string;
  businessScope?: string;
}

interface MarketOrderDetailsProps {
  orderCode: string;
  orgId: string;
  userType?: "CUSTOMER" | "MARKET";
}

// 临时定义操作类型
type OperationType = "SIGN" | "RETURN" | "EXCHANGE";

export default function MarketOrderDetails({
  orderCode,
  orgId,
  userType = "MARKET",
}: MarketOrderDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Data State
  const [marketOrderData, setMarketOrderData] = useState<MarketOrderData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [isOrderInfoCollapsed, setIsOrderInfoCollapsed] = useState(true);

  // Deliver to Customer State
  const [isDeliverToCustomerDialogOpen, setIsDeliverToCustomerDialogOpen] = useState(false);
  const [isDeliveringToCustomer, setIsDeliveringToCustomer] = useState(false);

  // Inspection State
  const [isStartingInspection, setIsStartingInspection] = useState(false);

  // Provider Assignment State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState(false);

  // Fetch Data
  const fetchMarketOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderCode}`);
      if (!response.ok) {
        throw new Error(`获取订单详情失败: ${response.status}`);
      }

      const result = await response.json();

      // Handle API response format - support both new and old formats
      let data;
      if (result.code !== undefined && result.message !== undefined && result.data !== undefined) {
        // New API response format with code/message/data structure
        if (result.code !== 200) {
          throw new Error(`获取订单详情失败: ${result.message || '服务器返回错误'}`);
        }
        data = result.data;
      } else {
        // Old format - direct data response
        data = result.data || result;
      }

      // Log received data for debugging
      console.log("Fetched market order data:", data);

      // Basic validation to ensure required fields exist
      if (!data.details) {
        console.warn("数据格式可能不符合预期:", data);
      }

      setMarketOrderData(data as MarketOrderData);
    } catch (err) {
      console.error("Error fetching market order details:", err);
      setError(err instanceof Error ? err.message : "获取订单详情失败");
      toast({
        title: "获取失败",
        description: err instanceof Error ? err.message : "无法加载订单详情",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketOrderDetails();
  }, [orderCode]);

  // Fetch Providers Logic
  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await fetch(`/api/markets/${orgId}/providers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const responseData = await response.json();

      if (Array.isArray(responseData)) {
        setProviders(responseData);
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setProviders(responseData.data);
      } else {
        setProviders([]);
      }
    } catch (err) {
      toast({
        title: "获取供应商失败",
        description: err instanceof Error ? err.message : "获取供应商列表时出错",
        variant: "destructive",
      });
    } finally {
      setLoadingProviders(false);
    }
  };

  // Open Assign Dialog
  const handleOpenAssignDialog = () => {
    fetchProviders();
    setSelectedProvider("");
    setShowProviderDialog(true);
  };

  // Handle Assign Order
  const handleAssignOrder = async () => {
    if (!selectedProvider || assigningOrder) return;

    try {
      setAssigningOrder(true);

      const response = await fetch(`/api/markets/${orgId}/orders/${orderCode}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId: parseInt(selectedProvider),
          confirmedBy: "MARKET_USER" // Should come from real user
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`指派订单失败: ${response.status}, ${errorText}`);
      }

      toast({
        title: "指派成功",
        description: `订单 ${orderCode} 已成功指派`,
        variant: "default", // success variant not standard in shadcn usually, use default
      });

      setShowProviderDialog(false);
      fetchMarketOrderDetails(); // Refresh order details

    } catch (err) {
      toast({
        title: "指派失败",
        description: err instanceof Error ? err.message : "指派订单时出错",
        variant: "destructive",
      });
    } finally {
      setAssigningOrder(false);
    }
  };

  // Get selected provider business scope
  const getSelectedProviderBusinessScope = () => {
    if (!selectedProvider) return [];

    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider || !provider.businessScope) return [];

    return provider.businessScope.split(',');
  };



  // Handlers

  const handleDeliverToCustomer = async () => {
    try {
      setIsDeliveringToCustomer(true);

      const response = await fetch(`/api/orders/${orderCode}/deliver-to-customer`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operateBy: "MARKET_USER", // Should be real user
        }),
      });

      if (!response.ok) {
        throw new Error("提交失败");
      }

      const responseData = await response.json();
      // Assuming the API returns the new status or we can infer it

      toast({
        title: "操作成功",
        description: "订单已开始配送至客户",
        variant: "default",
      });

      setIsDeliverToCustomerDialogOpen(false);
      fetchMarketOrderDetails();
    } catch (err) {
      toast({
        title: "操作失败",
        description: err instanceof Error ? err.message : "操作失败",
        variant: "destructive",
      });
    } finally {
      setIsDeliveringToCustomer(false);
    }
  };

  const handleBeginInspect = async () => {
    try {
      setIsStartingInspection(true);

      const response = await fetch(`/api/orders/${orderCode}/begin-inspect-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operateBy: "MARKET_USER" // Should be real user name
        })
      });

      if (!response.ok) {
        throw new Error("开始验收失败");
      }

      toast({
        title: "操作成功",
        description: "已开始验收，请对商品进行签收、退货或换货操作",
        variant: "default",
      });

      // 成功后跳转到验收页面
      router.push(`/workspace/markets/${orgId}/orders/${orderCode}/inspection`);
    } catch (err) {
      toast({
        title: "操作失败",
        description: err instanceof Error ? err.message : "操作失败",
        variant: "destructive",
      });
    } finally {
      setIsStartingInspection(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !marketOrderData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-lg font-medium text-gray-900">加载订单失败</p>
        <p className="text-sm text-gray-500">{error}</p>
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
            <h1 className="text-lg font-bold tracking-tight">
              订单详情
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(marketOrderData.deliveryDate).toLocaleDateString()}
            </span>
            <Badge variant={getStatusVariant(marketOrderData.orderStatus)}>
              {translateOrderStatus(marketOrderData.orderStatus)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Action Buttons */}
          {/* 指派按钮 (PENDING) */}
          {marketOrderData.orderStatus === "PENDING" && (
            <Button
              onClick={handleOpenAssignDialog} size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              指派订单
            </Button>
          )}


          {/* 确认发货按钮 (MARKET_ACCEPTED) */}
          {marketOrderData.orderStatus === "MARKET_ACCEPTED" && (
            <Button
              onClick={() => setIsDeliverToCustomerDialogOpen(true)} size="sm"
              className="bg-blue-600 hover:bg-blue-500"
            >
              确认发货
            </Button>
          )}

        </div>
      </div>

        {/* Compact Inspection Prompt - Only show for specific statuses */}
        {((userType === "CUSTOMER" && (marketOrderData.orderStatus === "MARKET_DELIVERING" || marketOrderData.orderStatus === "EXCHANGE_NEW_DELIVERING")) ||
          (userType === "MARKET" && (marketOrderData.orderStatus === "SUPPLIER_DELIVERING" || marketOrderData.orderStatus === "EXCHANGE_DELIVERING"))) && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">
                    商品已送达，等待验收
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    供应商已完成配送，您可以开始验收商品
                  </p>
                </div>
              </div>
              <Button
                onClick={handleBeginInspect}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-4 text-xs font-medium"
                disabled={isStartingInspection}
              >
                {isStartingInspection ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    验收中...
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    开始验收
                    <ArrowLeft className="w-3 h-3 rotate-180" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Order Info Card */}
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
        <Collapsible
          open={!isOrderInfoCollapsed}
          onOpenChange={(open) => setIsOrderInfoCollapsed(!open)}
        >
          <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setIsOrderInfoCollapsed(!isOrderInfoCollapsed)}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">基本信息</h2>
                <p className="text-xs text-gray-500">
                  {marketOrderData.orderCode}
                </p>
              </div>
            </div>
            {isOrderInfoCollapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <CollapsibleContent>
            <div className="px-6 pb-8 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-12">
                <div className="flex gap-4">
                  <div className="mt-1">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="space-y-3 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5 font-medium">创建时间</p>
                        <p className="text-sm text-gray-500">
                          {new Date(marketOrderData.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1">
                    <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                      <User className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-violet-600/80 uppercase tracking-wide">客户信息</p>
                    <div className="space-y-3 mt-2">
                      <div>
                        <p className="text-sm text-gray-500">
                          {marketOrderData.customerName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                      <Truck className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-amber-600/80 uppercase tracking-wide">配送信息</p>
                    <div className="space-y-3 mt-2">
                      <div>
                        <p className="text-sm text-gray-500">
                          {marketOrderData.shipperName ? (
                            <span className="flex items-center gap-2">
                              {marketOrderData.shipperName}
                              <span className="text-muted-foreground text-xs font-normal bg-gray-100 px-1.5 py-0.5 rounded-md">
                                {marketOrderData.shipperPhone}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-sm">未分配</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <MapPin className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wide">配送地址</p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {marketOrderData.deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Main Content */}
      <div className="w-full">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-4">
              <CardTitle className="text-lg font-semibold"></CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {/* Desktop View */}
              <div className="hidden md:block rounded-xl border bg-white overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="w-[40%] pl-6">商品信息</TableHead>
                      <TableHead className="w-[20%]">单价/单位</TableHead>
                      <TableHead className="w-[20%] text-center">订购量</TableHead>
                      <TableHead className="w-[20%] text-right pr-6">订购金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketOrderData.details?.map((item, index) => (
                      <TableRow key={`o_${item.id}_${index}`} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border border-gray-100 shadow-md rounded-lg">
                              <AvatarImage src={item.imageUrl || ""} alt={item.name} className="object-cover" />
                              <AvatarFallback className="bg-primary/5 text-primary text-xs rounded-lg font-medium shadow-inner">
                                {item.name ? item.name.slice(0, 2) : "无"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1">
                              <p className="font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-mono">
                                  SKU: {item.productId}
                                </span>
                                {item.category && (
                                  <span className="text-xs text-gray-500">{item.category}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium font-mono text-gray-900">¥{item.unitPrice}</span>
                            <span className="text-xs text-gray-500">/ {item.unit}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono font-medium bg-blue-50 text-blue-700 hover:bg-blue-50">
                            x {item.orderedQty}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <span className="font-bold font-mono text-gray-900">¥{item.orderedAmount}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!marketOrderData.details || marketOrderData.details.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-gray-500 bg-gray-50/30">
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-2xl">📦</span>
                            </div>
                            <p>暂无商品明细</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {marketOrderData.details?.map((item, index) => (
                  <div key={`m_${item.id}_${index}`} className="bg-white rounded-xl p-4 border shadow-sm space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-16 w-16 border border-gray-100 shadow-md rounded-lg shrink-0">
                        <AvatarImage src={item.imageUrl || ""} alt={item.name} className="object-cover" />
                        <AvatarFallback className="bg-primary/5 text-primary text-sm rounded-lg font-medium shadow-inner">
                          {item.name ? item.name.slice(0, 2) : "无"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">{item.name}</h3>
                          <span className="font-bold text-gray-900 font-mono shrink-0">¥{item.orderedAmount}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 items-center">
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-mono">
                            {item.productId}
                          </span>
                          {item.category && (
                            <span className="text-xs text-gray-500 border-l pl-2">{item.category}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">单价</span>
                        <span className="text-sm font-medium">¥{item.unitPrice} <span className="text-gray-400 text-xs font-normal">/ {item.unit}</span></span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">数量</span>
                        <Badge variant="secondary" className="font-mono font-medium bg-blue-50 text-blue-700 hover:bg-blue-50 mt-0.5">
                          x {item.orderedQty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {(!marketOrderData.details || marketOrderData.details.length === 0) && (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                      <p className="text-sm">暂无商品明细</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
                  </div>

        {/* Inspection Prompt */}

      {/* Deliver to Customer Dialog */}
      <AlertDialog open={isDeliverToCustomerDialogOpen} onOpenChange={setIsDeliverToCustomerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认发货?</AlertDialogTitle>
            <AlertDialogDescription>
              确认后，订单状态将更新为"配送中"，表示您已开始向客户配送商品。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeliverToCustomer} disabled={isDeliveringToCustomer}>
              {isDeliveringToCustomer ? "处理中..." : "确认发货"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Provider Assign Dialog */}
      <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">指派订单</DialogTitle>
            <DialogDescription className="text-xs">
              选择一个供应商来处理此订单，未指派供应商的订单将无法进行备货
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            {loadingProviders ? (
              <div className="flex justify-center py-2">
                <p className="text-sm text-gray-500">正在加载供应商数据...</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="flex justify-center py-2">
                <p className="text-sm text-gray-500">暂无可用供应商</p>
              </div>
            ) : (
              <>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id} className="cursor-pointer text-xs">
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 显示所选供应商的业务范围 */}
                {selectedProvider && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">供应商业务范围:</p>
                    <div className="flex flex-wrap gap-2">
                      {getSelectedProviderBusinessScope().length > 0 ? (
                        getSelectedProviderBusinessScope().map((scope, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {scope.trim()}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">该供应商未设置业务范围</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowProviderDialog(false)}>
              取消
            </Button>
            <Button size="sm" onClick={handleAssignOrder} disabled={!selectedProvider || assigningOrder}>
              {assigningOrder ? "指派中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
