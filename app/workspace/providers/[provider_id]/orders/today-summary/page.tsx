import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { logger } from "@/lib/logger";
import { fetchRemoteData } from "@/lib/api-utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ExportButton } from "./export-button";

interface SummaryItem {
  productId: string;
  productName: string;
  totalQuantity: string;
  unit: string;
  processingRequirements?: string;
  remark?: string;
  customerName: string;
}

// 定义聚合后的数据结构
interface AggregatedItem {
  productName: string;
  productId: string;
  unit: string;
  totalQuantity: number;
  customers: {
    customerName: string;
    quantity: number;
    processingRequirements: {
      requirement: string;
      quantity: number;
      remark?: string;
    }[];
  }[];
}

// 修改为异步服务器组件函数
export default async function TodaySummaryPage({
  params
}: {
  params: Promise<{ provider_id: string }>
}) {
  const providerId = (await params).provider_id;
  
  // 直接在服务器端获取数据
  let summaryData: SummaryItem[] = [];
  let error: string | null = null;
  
  try {
    const response = await fetchRemoteData({
      endpoint: `/providers/${providerId}/orders/today-summary`,
      method: 'GET',
      tags: [`provider-${providerId}-today-summary`],
      revalidate: 0, // 不缓存，每次获取最新数据
      needToken: true
    });

    if (!response.success) {
      throw new Error('获取今日订单汇总数据失败');
    }

    const data = response.data;
    summaryData = data.data || [];
  } catch (err) {
    logger.error('获取今日订单汇总数据失败:', err);
    error = err instanceof Error ? err.message : '未知错误';
  }

  // 聚合数据处理
  const aggregatedData = (() => {
    // 按产品ID分组
    const productGroups: Record<string, AggregatedItem> = {};

    summaryData.forEach(item => {
      const productId = item.productId;
      const quantity = parseFloat(item.totalQuantity) || 0;
      const requirement = item.processingRequirements || '';
      const remark = item.remark;
      
      if (!productGroups[productId]) {
        productGroups[productId] = {
          productName: item.productName,
          productId: item.productId,
          unit: item.unit,
          totalQuantity: 0,
          customers: []
        };
      }
      
      // 增加总数量
      productGroups[productId].totalQuantity += quantity;
      
      // 查找客户
      let customer = productGroups[productId].customers.find(
        c => c.customerName === item.customerName
      );
      
      if (!customer) {
        customer = {
          customerName: item.customerName,
          quantity: 0,
          processingRequirements: []
        };
        productGroups[productId].customers.push(customer);
      }
      
      // 增加客户订购数量
      customer.quantity += quantity;
      
      // 查找处理要求
      let processingReq = customer.processingRequirements.find(
        p => p.requirement === requirement
      );
      
      if (!processingReq) {
        processingReq = {
          requirement: requirement,
          quantity: 0,
          remark: remark
        };
        customer.processingRequirements.push(processingReq);
      }
      
      // 增加处理要求数量
      processingReq.quantity += quantity;
    });
    
    // 转换为数组并排序
    return Object.values(productGroups).sort((a, b) => 
      a.productName.localeCompare(b.productName)
    );
  })();

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center min-h-[200px]">
              <p className="text-red-500">出错了: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>今日订单汇总</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            </p>
          </div>
          <ExportButton data={aggregatedData} />
        </CardHeader>
        <CardContent>
          {aggregatedData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              今日暂无订单数据，该汇总只统计今日未备货订单
            </div>
          ) : (
            <Table className="border">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[200px] font-semibold">产品名称</TableHead>
                  <TableHead className="text-right w-[100px] font-semibold">总数量</TableHead>
                  <TableHead className="text-right w-[60px] font-semibold">单位</TableHead>
                  <TableHead className="font-semibold">客户与处理要求</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregatedData.map((product, index) => (
                  <TableRow key={product.productId} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <TableCell className="font-medium">
                      {product.productName}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {product.totalQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.unit}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-3 text-sm">
                        {product.customers.map((customer, cIndex) => (
                          <div key={cIndex} className={`pb-3 ${cIndex < product.customers.length - 1 ? "border-b border-dashed border-gray-200" : ""}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{customer.customerName}</span>
                              
                            </div>
                            <div className="mt-2 pl-3 border-l-2 border-gray-100">
                              {customer.processingRequirements.map((req, rIndex) => (
                                <div key={rIndex} className="flex justify-between items-center text-gray-600 mt-1.5">
                                  <div className="flex items-center">
                                    {req.requirement ? <span className="text-xs">{req.requirement}</span> : <span className="text-xs">无特殊要求</span>}
                                    {req.remark && (
                                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">
                                        {req.remark}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {req.quantity} {product.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 