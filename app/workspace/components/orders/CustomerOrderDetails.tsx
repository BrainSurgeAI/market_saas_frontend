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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { translateOrderStatus, getStatusVariant } from "@/lib/utils";

// Import Customer types
import {
  CustomerOrderData,
  CustomerOrderItem,
  CustomerOrderDetail,
} from "@/lib/types/customerOrder";

interface CustomerOrderDetailsProps {
  orderCode: string;
  orgId: string;
}

// 临时定义操作类型
type OperationType = "SIGN" | "RETURN" | "EXCHANGE";

export default function CustomerOrderDetails({
  orderCode,
  orgId,
}: CustomerOrderDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Data State
  const [customerOrderData, setCustomerOrderData] = useState<CustomerOrderData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [isOrderInfoCollapsed, setIsOrderInfoCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState("products");

  // Operation Dialog State
  const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false);
  // Note: We operate on CustomerOrderItem, which is derived from round items or details depending on status
  // But currently operations are only allowed in INSPECTING status, which uses rounds
  const [currentOperatingItem, setCurrentOperatingItem] =
    useState<CustomerOrderItem | null>(null);
  const [operationType, setOperationType] = useState<OperationType>("SIGN");
  const [operationQuantity, setOperationQuantity] = useState("");
  const [operationReason, setOperationReason] = useState("");
  const [isSubmittingOperation, setIsSubmittingOperation] = useState(false);

  // Confirmation Dialog State
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);
  
  // Complete Order Dialog State (for RETURN_REQUESTED)
  const [isCompleteOrderDialogOpen, setIsCompleteOrderDialogOpen] = useState(false);

  // Inspection Status State
  const [inspectionResult, setInspectionResult] = useState<string>("PENDING");

  // Fetch Data
  const fetchCustomerOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderCode}`);
      if (!response.ok) {
        throw new Error(`获取订单详情失败: ${response.status}`);
      }

      const result = await response.json();
      const data = result.data || result;
      
      console.log("Fetched customer order data:", data);

      // Data validation loose check
      if (!data.details && !data.rounds) {
         console.warn("数据格式可能不符合Customer用户要求:", data);
      }

      setCustomerOrderData(data as CustomerOrderData);
    } catch (err) {
      console.error("Error fetching customer order details:", err);
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
    fetchCustomerOrderDetails();
  }, [orderCode]);

  // State for begin inspecting
  const [isStartingInspection, setIsStartingInspection] = useState(false);
  const [isStartInspectDialogOpen, setIsStartInspectDialogOpen] = useState(false);

  // Helper: Find the active round (usually the latest one)
  const activeRound = useMemo(() => {
    if (!customerOrderData?.rounds || customerOrderData.rounds.length === 0)
      return null;
    return customerOrderData.rounds[customerOrderData.rounds.length - 1];
  }, [customerOrderData]);

  // Helper: Calculate totals
  const stats = useMemo(() => {
    if (!activeRound) return { total: 0, pending: 0, inspected: 0 };
    const total = activeRound.items.length;
    const pending = activeRound.items.filter(
      (i) => i.inspectionStatus === "PENDING"
    ).length;
    const inspected = total - pending;
    return { total, pending, inspected };
  }, [activeRound]);

  // Handlers
  const handleOpenOperationDialog = (
    item: CustomerOrderItem,
    type: OperationType = "SIGN"
  ) => {
    setCurrentOperatingItem(item);
    setOperationType(type);
    setOperationQuantity(item.needToInspectQty);
    setOperationReason("");
    setIsOperationDialogOpen(true);
  };

  const handleSubmitOperation = async () => {
    if (!currentOperatingItem || !customerOrderData) return;

    try {
      setIsSubmittingOperation(true);

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

      if (operationType !== "SIGN" && !operationReason.trim()) {
        toast({
          title: "输入错误",
          description: "退换货必须填写原因",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        operateBy: "CUSTOMER_USER", 
        receipt: {
          id: currentOperatingItem.orderDetailId,
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
          body: JSON.stringify(payload),
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

      // Update local state without full refresh
      if (customerOrderData && customerOrderData.rounds) {
        const newRounds = [...customerOrderData.rounds];
        const lastRoundIndex = newRounds.length - 1;
        if (lastRoundIndex >= 0) {
          const lastRound = { ...newRounds[lastRoundIndex] };
          const newItems = lastRound.items.map(item => {
             if (item.orderDetailId === currentOperatingItem.orderDetailId) {
                return {
                    ...item,
                    inspectionStatus: operationType,
                    acceptedQty: operationType === "SIGN" ? operationQuantity : item.acceptedQty,
                };
             }
             return item;
          });
          lastRound.items = newItems;
          
          if (inspectionResult && inspectionResult !== "PENDING") {
             setInspectionResult(inspectionResult);
          }
          newRounds[lastRoundIndex] = lastRound;
          
          setCustomerOrderData({
              ...customerOrderData,
              rounds: newRounds
          });
        }
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
      
      const hasExchange = activeRound?.items.some(i => i.inspectionStatus === "EXCHANGE");
      
      const apiUrl = hasExchange 
        ? `/api/orders/${orderCode}/exchange-request` 
        : `/api/orders/${orderCode}/complete-inspection`;
      
      const status = hasExchange 
        ? "EXCHANGE_REQUESTED" 
        : "COMPLETED";

      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            operateBy: "CUSTOMER_USER",
            status: status
        })
      });

      if (!response.ok) {
        throw new Error("提交失败");
      }

      toast({
        title: "提交成功",
        description: hasExchange ? "换货申请已提交" : "订单已完成",
        variant: "default",
      });
      
      setIsConfirmDialogOpen(false);
      fetchCustomerOrderDetails();

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

  const handleCompleteOrder = async () => {
     try {
        setIsCompletingOrder(true);
        const response = await fetch(`/api/orders/${orderCode}/accept`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                operateBy: "CUSTOMER_USER",
                status: "COMPLETED"
            })
        });

        if (!response.ok) {
            throw new Error("提交失败");
        }

        toast({
            title: "提交成功",
            description: "订单已完成",
            variant: "default",
        });

        setIsCompleteOrderDialogOpen(false);
        fetchCustomerOrderDetails();
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

  const handleBeginInspect = async () => {
    try {
      setIsStartingInspection(true);
      
      const response = await fetch(`/api/orders/${orderCode}/begin-inspect-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            operateBy: "CUSTOMER_USER"
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

      setIsStartInspectDialogOpen(false);
      fetchCustomerOrderDetails();
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

  if (error || !customerOrderData) {
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              CUSTOMER 订单详情
            </h1>
          </div>
          <div className="flex items-center gap-2 ml-11">
            <span className="text-sm text-muted-foreground">
              {customerOrderData.orderCode}
            </span>
            <Badge variant={getStatusVariant(customerOrderData.orderStatus)}>
              {translateOrderStatus(customerOrderData.orderStatus)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
           {/* 开始验收按钮 (MARKET_DELIVERING) */}
           {customerOrderData.orderStatus === "MARKET_DELIVERING" && (
               <Button 
                onClick={() => setIsStartInspectDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-500"
               >
                   开始验收
               </Button>
           )}

           {/* 完成验收按钮 (CUSTOMER_INSPECTING) */}
           {customerOrderData.orderStatus === "CUSTOMER_INSPECTING" && (
               <Button 
                onClick={() => setIsConfirmDialogOpen(true)}
                disabled={stats.pending > 0 && inspectionResult === "PENDING"}
               >
                   {activeRound?.items.some(i => i.inspectionStatus === "EXCHANGE") ? "确认换货申请" : "完成订单"}
               </Button>
           )}

            {/* 完成订单按钮 (RETURN_REQUESTED) */}
            {customerOrderData.orderStatus === "RETURN_REQUESTED" && (
               <Button 
                onClick={() => setIsCompleteOrderDialogOpen(true)}
                className="bg-green-700 hover:bg-green-600"
               >
                   完成订单
               </Button>
           )}

           <Button variant="outline" size="icon">
             <Download className="h-4 w-4" />
           </Button>
        </div>
      </div>

      {/* Order Info Card */}
      <Card>
        <Collapsible
          open={!isOrderInfoCollapsed}
          onOpenChange={(open) => setIsOrderInfoCollapsed(!open)}
        >
          <CardHeader className="py-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <CardTitle className="text-base font-medium">订单信息</CardTitle>
              {isOrderInfoCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pb-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">创建时间</p>
                  <p className="text-sm font-medium">
                    {new Date(customerOrderData.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">配送日期</p>
                  <p className="text-sm font-medium">
                    {new Date(customerOrderData.deliveryDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">客户名称</p>
                  <p className="text-sm font-medium">
                    {customerOrderData.customerName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">配送员</p>
                  <p className="text-sm font-medium">
                    {customerOrderData.shipperName || "-"} ({customerOrderData.shipperPhone || "-"})
                  </p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs text-muted-foreground">配送地址</p>
                  <p className="text-sm font-medium">
                    {customerOrderData.deliveryAddress}
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="products">商品清单</TabsTrigger>
          <TabsTrigger value="rounds">验收单</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
            {/* If we are in INSPECTING state, show inspection view (from activeRound) */}
            {/* Otherwise, show details list (from details) */}
            {/* However, user requested 'Product List' tab to use 'details' data specifically */}
            {/* And 'Delivery Rounds' tab (renamed to Inspection Sheet) to use 'rounds' */}
            {/* But if we are inspecting, we need to operate on items. Where should we do that? */}
            {/* Usually operations happen on the 'Product List' or 'Inspection' tab. */}
            {/* If 'details' is just a list of what was ordered, maybe operations should happen in 'rounds' tab? */}
            {/* Or maybe 'details' should be used for display when NOT inspecting, and rounds for inspecting? */}
            {/* User said: "商品清单tab的表格用details中的数据" - this implies simple list display */}
            {/* And "配送轮次tab改名叫验收单，用rounds里的数据" - this implies where inspection happens or history is shown */}
            
            {/* Let's implement details view for products tab */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">商品清单</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品名称</TableHead>
                    <TableHead>单价/单位</TableHead>
                    <TableHead className="text-center">下单量</TableHead>
                    <TableHead className="text-center">金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerOrderData.details?.map((item, index) => (
                    <TableRow key={`o_${item.id}_${index}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.productId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        ¥{item.unitPrice} / {item.unit}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {item.orderedQty}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                         ¥{item.orderedAmount}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!customerOrderData.details || customerOrderData.details.length === 0) && (
                      <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              暂无商品明细
                          </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rounds" className="mt-4">
             {/* This is now 'Inspection Sheet' / 'Delivery Rounds' */}
             {/* If we are inspecting, we should show the active round here and allow operations */}
             
             {activeRound ? (
                 <Card>
                    <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                                {customerOrderData.orderStatus.includes("EXCHANGE") ? "换货验收" : "验收单"} 
                                (第 {activeRound?.round} 轮)
                            </CardTitle>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>总计: {stats.total}</span>
                                <span className="text-green-600">已验: {stats.inspected}</span>
                                <span className="text-orange-600">待验: {stats.pending}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>商品名称</TableHead>
                                    <TableHead>单价/单位</TableHead>
                                    <TableHead className="text-center">待验量</TableHead>
                                    <TableHead className="text-center">实收量</TableHead>
                                    <TableHead className="text-center">验收状态</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeRound?.items.map((item, index) => (
                                    <TableRow key={`i_${activeRound.round}_${item.orderDetailId}_${index}`}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{item.productName}</p>
                                                <p className="text-xs text-muted-foreground">{item.productCode}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            ¥{item.unitPrice} / {item.unit}
                                        </TableCell>
                                        <TableCell className="text-center font-mono font-medium">
                                            {item.needToInspectQty}
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-green-600">
                                            {item.acceptedQty || "-"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {renderStatusBadge(item.inspectionStatus)}
                                            {item.inspectionStatus !== "PENDING" && item.inspectionStatus !== "SIGN" && item.remark && (
                                                <div className="text-xs text-red-500 mt-1 max-w-[150px] mx-auto truncate" title={item.remark.reason}>
                                                    {item.remark.reason}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.inspectionStatus === "PENDING" && 
                                             (customerOrderData.orderStatus === "CUSTOMER_INSPECTING") && (
                                              <div className="flex justify-end gap-2">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                  onClick={() => handleOpenOperationDialog(item, "SIGN")}
                                                  title="签收"
                                                >
                                                  <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                  onClick={() => handleOpenOperationDialog(item, "EXCHANGE")}
                                                  title="换货"
                                                >
                                                  <RefreshCw className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                  onClick={() => handleOpenOperationDialog(item, "RETURN")}
                                                  title="退货"
                                                >
                                                  <RotateCcw className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            )}
                                            {item.inspectionStatus !== "PENDING" && 
                                             (customerOrderData.orderStatus === "CUSTOMER_INSPECTING") && (
                                                 <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-xs h-8"
                                                    onClick={() => {
                                                        handleOpenOperationDialog(item, item.inspectionStatus as OperationType);
                                                    }}
                                                 >
                                                     修改
                                                 </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
             ) : (
                 <div className="text-center py-8 text-muted-foreground">
                     暂无验收单数据
                 </div>
             )}
             
             {/* History rounds */}
             {customerOrderData.rounds && customerOrderData.rounds.length > 1 && (
                 <div className="mt-8 space-y-4">
                     <h3 className="text-lg font-semibold">历史验收记录</h3>
                     {customerOrderData.rounds.slice(0, -1).reverse().map((round) => (
                         <Card key={round.round}>
                             <CardHeader className="py-4 bg-muted/50">
                                 <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                         <Badge variant="outline" className="bg-background">第 {round.round} 轮</Badge>
                                         <Badge variant={round.deliveryType === "NORMAL" ? "default" : "secondary"}>
                                             {round.deliveryType === "NORMAL" ? "正常配送" : "换货配送"}
                                         </Badge>
                                     </div>
                                     <div className="text-sm text-muted-foreground">
                                         {round.deliveredAt ? new Date(round.deliveredAt).toLocaleString() : "未送达"}
                                     </div>
                                 </div>
                             </CardHeader>
                             <CardContent className="py-0">
                                 <Table>
                                     <TableBody>
                                         {round.items.map((item) => (
                                             <TableRow key={`${round.round}-${item.orderDetailId}`}>
                                                 <TableCell className="w-[40%]">
                                                     <span className="font-medium">{item.productName}</span>
                                                 </TableCell>
                                                 <TableCell className="text-center">配送: {item.needToInspectQty}</TableCell>
                                                 <TableCell className="text-center">{item.acceptedQty ? `实收: ${item.acceptedQty}` : '-'}</TableCell>
                                                 <TableCell className="text-right">{renderStatusBadge(item.inspectionStatus)}</TableCell>
                                             </TableRow>
                                         ))}
                                     </TableBody>
                                 </Table>
                             </CardContent>
                         </Card>
                     ))}
                 </div>
             )}
        </TabsContent>
      </Tabs>

      {/* Operation Dialog */}
      <Dialog open={isOperationDialogOpen} onOpenChange={setIsOperationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
                {operationType === "SIGN" && "确认签收"}
                {operationType === "RETURN" && "申请退货"}
                {operationType === "EXCHANGE" && "申请换货"}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {currentOperatingItem?.productName}
                </span>
            </DialogTitle>
            <DialogDescription>
                待验收数量: {currentOperatingItem?.needToInspectQty} {currentOperatingItem?.unit}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label>数量</Label>
                <Input 
                    type="number" 
                    value={operationQuantity} 
                    onChange={(e) => setOperationQuantity(e.target.value)}
                    min="0"
                    max={currentOperatingItem?.needToInspectQty}
                />
            </div>
            
            {operationType !== "SIGN" && (
                <div className="grid gap-2">
                    <Label>原因说明</Label>
                    <Textarea 
                        value={operationReason}
                        onChange={(e) => setOperationReason(e.target.value)}
                        placeholder="请输入退换货原因（必填）"
                    />
                </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOperationDialogOpen(false)}>
                取消
            </Button>
            <Button onClick={handleSubmitOperation} disabled={isSubmittingOperation}>
                {isSubmittingOperation ? "提交中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Inspect Confirmation Dialog */}
      <AlertDialog open={isStartInspectDialogOpen} onOpenChange={setIsStartInspectDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>确认开始验收?</AlertDialogTitle>
                  <AlertDialogDescription>
                      确认后，订单状态更新为"客户验收中"，表示您已开始验收该订单的商品。
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBeginInspect} disabled={isStartingInspection}>
                      {isStartingInspection ? "处理中..." : "确认"}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

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
      
      {/* Complete Order Confirmation Dialog */}
      <AlertDialog open={isCompleteOrderDialogOpen} onOpenChange={setIsCompleteOrderDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>确认完成订单?</AlertDialogTitle>
                  <AlertDialogDescription>
                      确认后，订单状态将更新为"已完成"，此操作不可撤销。
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCompleteOrder} disabled={isCompletingOrder}>
                      {isCompletingOrder ? "处理中..." : "确认完成"}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
