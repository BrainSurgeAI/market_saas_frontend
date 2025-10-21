"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Organization } from "@/app/models";
import {
  ArrowLeft,
  Building,
  MapPin,
  Phone,
  Calendar,
  ClipboardCheck,
  CreditCard,
  User,
  BarChart,
  Clock,
  Wallet,
  BarChart3,
  BadgeDollarSign,
  PercentSquare,
  Plus,
  Pencil
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateUserDialog } from "./CreateUserDialog";
import { UsersList } from "./UsersList";
import { fetchRemoteData } from "@/lib/api-utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { EditDiscountDialog } from "./EditDiscountDialog";
import { AddDiscountDialog } from "./AddDiscountDialog";


interface TenantFinancial {
  id: number;
  tenantId: number;
  creditScore: string;
  creditLimit: string;
  depositAmount: string;
  paymentPeriodDays: number;
  createdAt: string;
  updatedAt: string;
}

// 添加折扣信息接口
interface TenantDiscount {
  discountId: number;
  categoryId: number;
  categoryName: string;
  discountRate: string;
  startDate: string;
  endDate: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

interface TenantWithFinancial extends Organization {
  financial?: TenantFinancial;
}

// 租户状态标签对应的样式
const getStatusBadgeVariant = (status: string): "default" | "outline" | "secondary" | "destructive" => {
  switch (status) {
    case 'ACTIVE':
      return "default";
    case 'PENDING':
      return "secondary";
    case 'REJECTED':
      return "destructive";
    case 'SUBMITTED':
      return "outline";
    default:
      return "outline";
  }
};

// 格式化时间戳为日期字符串
const formatDate = (timestamp: number | string) => {
  if (!timestamp) return "未设置";
  
  const date = typeof timestamp === 'string' 
    ? new Date(timestamp) 
    : new Date(timestamp);
    
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化金额，添加千位分隔符和保留两位小数
const formatCurrency = (amount: string | number | undefined) => {
  if (!amount) return "0.00";
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};


const getTenantTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    'CUSTOMER': '客户',
    'PROVIDER': '供应商',
    'MARKET': '市场',
  };
  return typeMap[type] || type;
};

interface TenantDetailsProps {
  tenant: TenantWithFinancial;
  market_id: string;
}

// 格式化折扣率为百分比
const formatDiscountRate = (rate: string): string => {
  const rateNum = parseFloat(rate);
  return `${(rateNum * 100).toFixed(0)}%`;
};

// 获取折扣状态文本
const getDiscountStatusText = (status: number): string => {
  switch (status) {
    case 1:
      return "生效中";
    case 0:
      return "已停用";
    default:
      return "未知状态";
  }
};

// 获取折扣状态Badge变体
const getDiscountStatusVariant = (status: number): "default" | "outline" | "secondary" | "destructive" => {
  switch (status) {
    case 1:
      return "default";
    case 0:
      return "destructive";
    default:
      return "outline";
  }
};

export function TenantDetails({ tenant, market_id }: TenantDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [discounts, setDiscounts] = useState<TenantDiscount[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<TenantDiscount | null>(null);
  const [isEditDiscountDialogOpen, setIsEditDiscountDialogOpen] = useState(false);
  const [isAddDiscountDialogOpen, setIsAddDiscountDialogOpen] = useState(false);

  // 返回上一页
  const handleBack = () => {
    router.push(`/workspace/markets/${market_id}/tenants`);
  };

  // 获取租户状态文本
  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'ACTIVE': '已激活',
      'PENDING': '待完成',
      'REJECTED': '已拒绝',
      'SUBMITTED': '待审核'
    };
    return statusMap[status] || status;
  };

  // 检查是否有财务信息
  const hasFinancial = Boolean(tenant.financial);
  const isProvider = tenant.tenantType === "PROVIDER";
  const isCustomer = tenant.tenantType === "CUSTOMER";

  // 当切换到折扣管理标签时获取折扣数据
  useEffect(() => {
    if (activeTab === "discounts" && isCustomer) {
      fetchDiscountsData();
    }
  }, [activeTab, tenant.nameHash]);

  // 获取折扣数据
  const fetchDiscountsData = async () => {
    setIsLoadingDiscounts(true);
    try {
      const response = await fetchRemoteData({
        endpoint: `/tenants/${tenant.nameHash}/discounts`,
        method: 'GET',
        tags: [`tenant-${tenant.nameHash}-discounts`],
        revalidate: 0
      });

      if (response.success && response.data) {
        setDiscounts(response.data.data || []);
      } else {
        toast({
          title: "获取折扣信息失败",
          description: response.error || "服务器返回错误，请稍后重试",
          variant: "destructive",
        });
        setDiscounts([]);
      }
    } catch (error) {
      console.error("获取折扣信息出错:", error);
      toast({
        title: "获取折扣信息失败",
        description: "请求过程中发生错误，请稍后重试",
        variant: "destructive",
      });
      setDiscounts([]);
    } finally {
      setIsLoadingDiscounts(false);
    }
  };

  // 处理管理员状态变化
  const handleAdminStatusChange = (hasAdminUser: boolean) => {
    setHasAdmin(hasAdminUser);
  };

  // 打开创建用户对话框
  const openCreateUserDialog = () => {
    setIsCreateUserDialogOpen(true);
  };

  // 关闭创建用户对话框
  const closeCreateUserDialog = () => {
    setIsCreateUserDialogOpen(false);
  };

  // 打开编辑折扣对话框
  const openEditDiscountDialog = (discount: TenantDiscount) => {
    setSelectedDiscount(discount);
    setIsEditDiscountDialogOpen(true);
  };

  // 关闭编辑折扣对话框
  const closeEditDiscountDialog = () => {
    setIsEditDiscountDialogOpen(false);
  };

  // 折扣更新后刷新数据
  const handleDiscountUpdated = () => {
    fetchDiscountsData();
  };

  // 打开添加折扣对话框
  const openAddDiscountDialog = () => {
    setIsAddDiscountDialogOpen(true);
  };

  // 关闭添加折扣对话框
  const closeAddDiscountDialog = () => {
    setIsAddDiscountDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-bold">{tenant.name}</h3>
          <Badge variant={getStatusBadgeVariant(tenant.status)}>
            {getStatusText(tenant.status)}
          </Badge>
          {tenant.deletedAt && (
            <Badge variant="destructive">已禁用</Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            账户设置
          </Button>
          <Button size="sm">
            <UserCog className="h-4 w-4 mr-2" />
            用户管理
          </Button> */}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">基本信息</TabsTrigger>
          <TabsTrigger value="users">用户管理</TabsTrigger>
          {isProvider && (
            <TabsTrigger value="credits">信用管理</TabsTrigger>
          )}
          {isCustomer && (
            <TabsTrigger value="discounts">折扣管理</TabsTrigger>
          )}
          <TabsTrigger value="stats">数据统计</TabsTrigger>
        </TabsList>

        {/* 基本信息标签内容 */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>组织信息</CardTitle>
              <CardDescription>
            
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 基本信息卡片 */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">组织名称</p>
                      <p className="text-sm">{tenant.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">地址</p>
                      <p className="text-sm">{tenant.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">电话</p>
                      <p className="text-sm">{tenant.phone || "未设置"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <ClipboardCheck className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">组织类型</p>
                      <p className="text-sm">{getTenantTypeText(tenant.tenantType)}</p>
                    </div>
                  </div>
                </div>
                
                {/* 时间信息卡片 */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">创建时间</p>
                      <p className="text-sm">{formatDate(tenant.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">更新时间</p>
                      <p className="text-sm">{formatDate(tenant.updatedAt)}</p>
                    </div>
                  </div>
                  
                  {tenant.verifiedAt ? (
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">验证时间</p>
                        <p className="text-sm">{formatDate(tenant.verifiedAt)}</p>
                      </div>
                    </div>
                  ) : null}
                  
                  {tenant.businessScope && (
                    <div className="flex items-start space-x-3">
                      <ClipboardCheck className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">业务范围</p>
                        <p className="text-xs">{tenant.businessScope}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 供应商财务信息摘要 */}
              {isProvider && hasFinancial && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-base font-medium mb-4">财务信息概览</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-blue-50 border-blue-100">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-2">
                          <BadgeDollarSign className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-xs font-medium text-blue-700">信用额度</p>
                            <p className="text-lg font-bold text-blue-700">¥ {formatCurrency(tenant.financial?.creditLimit)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-green-50 border-green-100">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-2">
                          <Wallet className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-xs font-medium text-green-700">保证金</p>
                            <p className="text-lg font-bold text-green-700">¥ {formatCurrency(tenant.financial?.depositAmount)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-purple-50 border-purple-100">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-2">
                          <BarChart3 className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="text-xs font-medium text-purple-700">信用评分</p>
                            <p className="text-lg font-bold text-purple-700">{tenant.financial?.creditScore}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-amber-50 border-amber-100">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-2">
                          <Clock className="h-5 w-5 text-amber-500" />
                          <div>
                            <p className="text-xs font-medium text-amber-700">账期天数</p>
                            <p className="text-lg font-bold text-amber-700">{tenant.financial?.paymentPeriodDays} 天</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* 状态提示 - 仅对未激活的租户显示 */}
              {tenant.status === 'PENDING' && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <div className="text-yellow-600 bg-yellow-100 p-2 rounded-full">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">租户尚未完成激活</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        该租户需要创建默认用户才能完成激活流程。请在用户管理标签页中创建至少一个管理员用户。
                      </p>
                      <Button 
                        className="mt-2" 
                        size="sm" 
                        onClick={() => setActiveTab("users")}
                      >
                        前往创建用户
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 用户管理标签内容 */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>用户管理</CardTitle>
              <CardDescription>
                管理租户下的用户账号
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Button onClick={openCreateUserDialog}>
                  <User className="h-4 w-4 mr-2" />
                  创建用户
                </Button>
              </div>
              
              <UsersList 
                tenant_hash={tenant.nameHash} 
                marketId={market_id}
                tenantType={tenant.tenantType}
                onCreateUser={openCreateUserDialog}
                onAdminStatusChange={handleAdminStatusChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 信用管理标签内容 - 仅供应商显示 */}
        {isProvider && (
          <TabsContent value="credits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>信用管理</CardTitle>
                <CardDescription>
                  管理租户的信用额度和付款周期
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasFinancial ? (
                  <div className="space-y-6">
                    <div className="flex flex-col space-y-4">
                      <h3 className="text-base font-medium">财务信息详情</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <BadgeDollarSign className="h-5 w-5 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">信用额度</p>
                              <p className="text-lg font-semibold">¥ {formatCurrency(tenant.financial?.creditLimit)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <BarChart3 className="h-5 w-5 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">信用评分</p>
                              <p className="text-lg font-semibold">{tenant.financial?.creditScore}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <Wallet className="h-5 w-5 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">保证金</p>
                              <p className="text-lg font-semibold">¥ {formatCurrency(tenant.financial?.depositAmount)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">账期天数</p>
                              <p className="text-lg font-semibold">{tenant.financial?.paymentPeriodDays} 天</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">财务信息更新时间</p>
                            <p className="text-lg">{formatDate(tenant.financial?.updatedAt || '')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button variant="outline">
                        <CreditCard className="h-4 w-4 mr-2" />
                        更新信用信息
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 border rounded-md flex flex-col items-center justify-center text-center text-gray-500">
                    <CreditCard className="h-10 w-10 mb-2 text-gray-400" />
                    <p className="text-sm">该租户尚未设置财务信息</p>
                    <Button variant="outline" className="mt-4">
                      <CreditCard className="h-4 w-4 mr-2" />
                      添加财务信息
                    </Button>
                  </div>
                )}
              </CardContent>
              
              {hasFinancial && (
                <CardFooter className="bg-gray-50 p-4 border-t">
                  <div className="text-xs text-gray-500">
                    <p>注意：更新信用信息需要经过市场管理员审核，信用额度变更将会影响供应商的采购限额。</p>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        )}

        {/* 折扣管理标签内容 - 仅客户显示 */}
        {isCustomer && (
          <TabsContent value="discounts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>折扣管理</CardTitle>
                <CardDescription>
                  管理客户的折扣方案和优惠政策
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  
                  <Button onClick={openAddDiscountDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加类别折扣
                  </Button>
                </div>

                {isLoadingDiscounts ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : discounts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        
                        <TableHead>类别名称</TableHead>
                        <TableHead>折扣率</TableHead>
                        <TableHead>生效时间</TableHead>
                        <TableHead>截止时间</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discounts.map((discount) => (
                        <TableRow key={discount.discountId}>
                          
                          <TableCell>{discount.categoryName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50">
                              
                              {formatDiscountRate(discount.discountRate)}
                            </Badge>
                          </TableCell>
                          <TableCell>{discount.startDate}</TableCell>
                          <TableCell>{discount.endDate === "9999-12-31" ? "长期有效" : discount.endDate}</TableCell>
                          <TableCell>
                            <Badge variant={getDiscountStatusVariant(discount.status)}>
                              {getDiscountStatusText(discount.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditDiscountDialog(discount)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              编辑
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 border rounded-md flex flex-col items-center justify-center text-center text-gray-500">
                    <PercentSquare className="h-10 w-10 mb-2 text-gray-400" />
                    <p className="text-sm">该客户尚未设置折扣信息</p>
                    <Button variant="outline" className="mt-4" onClick={openAddDiscountDialog}>
                      <PercentSquare className="h-4 w-4 mr-2" />
                      添加折扣方案
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50 p-4 border-t">
                <div className="text-xs text-gray-500">
                  <p>注意：折扣方案将应用于此客户的所有订单，可以针对特定商品或类别设置不同折扣率。</p>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        )}

        {/* 数据统计标签内容 */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>数据统计</CardTitle>
              <CardDescription>
                查看租户的订单和交易数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-12 border rounded-md flex flex-col items-center justify-center text-center text-gray-500">
                <BarChart className="h-10 w-10 mb-2 text-gray-400" />
                <p className="text-sm">数据统计功能正在开发中</p>
                <p className="text-xs mt-1">此处将展示订单和交易数据统计</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 创建用户对话框 */}
      <CreateUserDialog
        isOpen={isCreateUserDialogOpen}
        onClose={closeCreateUserDialog}
        tenantId={tenant.nameHash}
        tenantType={tenant.tenantType}
        marketId={market_id}
        hasAdmin={hasAdmin}
      />

      {/* 编辑折扣对话框 */}
      <EditDiscountDialog 
        isOpen={isEditDiscountDialogOpen}
        onClose={closeEditDiscountDialog}
        discount={selectedDiscount}
        tenantId={tenant.nameHash}
        onDiscountUpdated={handleDiscountUpdated}
      />

      {/* 添加折扣对话框 */}
      <AddDiscountDialog
        isOpen={isAddDiscountDialogOpen}
        onClose={closeAddDiscountDialog}
        tenantId={tenant.nameHash}
        onDiscountAdded={handleDiscountUpdated}
        existingDiscounts={discounts}
      />
    </div>
  );
} 