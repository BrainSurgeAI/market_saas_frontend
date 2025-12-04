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
      endpoint: `/orders/preparation-summary`,
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
      <div className="container mx-auto py-4 md:py-6 px-4 md:px-6">
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">出错了</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:py-6 px-4 md:px-6">
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">今日订单汇总</h1>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            </p>
          </div>
          <ExportButton data={aggregatedData} />
        </div>

        {/* 数据卡片 */}
        {aggregatedData.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium mb-1">暂无订单数据</p>
              <p className="text-sm text-gray-500">该汇总只统计今日未备货订单</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {aggregatedData.map((product) => (
              <div
                key={product.productId}
                className="bg-white rounded-lg border border-gray-200/60 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 overflow-hidden"
              >
                {/* 卡片头部 */}
                <div className="px-6 py-4 bg-gradient-to-br from-gray-50 via-gray-50/80 to-white border-b border-gray-100">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">
                      {product.productName}
                    </h3>
                    <div className="flex items-baseline gap-1.5 flex-shrink-0">
                      <span className="text-xl font-bold text-gray-900 font-mono tabular-nums">
                        {product.totalQuantity}
                      </span>
                      <span className="text-xs text-gray-500 font-normal">{product.unit}</span>
                    </div>
                  </div>
                </div>

                {/* 卡片内容 */}
                <div className="px-6 py-5">
                  <div className="space-y-5">
                    {product.customers.map((customer, cIndex) => (
                      <div
                        key={cIndex}
                        className={cIndex < product.customers.length - 1 ? "pb-5 border-b border-gray-100" : ""}
                      >
                        {/* 客户名称 */}
                        <div className="flex items-center mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2.5 flex-shrink-0"></div>
                          <span className="font-medium text-sm text-gray-900">{customer.customerName}</span>
                        </div>

                        {/* 处理要求列表 */}
                        <div className="ml-4 space-y-2.5">
                          {customer.processingRequirements.map((req, rIndex) => (
                            <div
                              key={rIndex}
                              className="flex items-start justify-between gap-4"
                            >
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <span className="text-gray-300 mt-0.5 text-xs">•</span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-gray-700 leading-relaxed">
                                    {req.requirement || '无特殊要求'}
                                  </span>
                                  {req.remark && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100/60">
                                      {req.remark}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-gray-600 font-mono tabular-nums whitespace-nowrap flex-shrink-0">
                                {req.quantity} {product.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 