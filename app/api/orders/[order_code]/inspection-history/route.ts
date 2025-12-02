import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';

// 验收历史响应类型定义
interface InspectionHistoryItem {
  categoryName: string;
  inspectedQty: string;
  needToInspection: string;
  orderDetailId: number;
  productCode: string;
  productName: string;
  quantity: string;
  remark: string | null;
  result: "SIGN" | "EXCHANGE" | "RETURN" | "PASS";
}

interface InspectionHistoryRecord {
  inspectedAt: string;
  inspectedById: number;
  inspectedByType: string;
  inspectionId: number;
  inspectionRound: number;
  items: InspectionHistoryItem[];
  parent_id: number;
  result: "SIGN" | "EXCHANGE" | "RETURN" | "PASS";
}

interface InspectionHistoryResponse {
  code: number;
  message: string;
  data: InspectionHistoryRecord[];
  requestId: string;
  timestamp: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ order_code: string }> }
) {
  const { order_code } = await params;

  const response = await fetchRemoteData({
    endpoint: `/orders/${order_code}/inspection-history`,
    method: 'GET',
    needToken: true,
    revalidate: 0
  });
  
  if (!response.success) {
    return NextResponse.json({ message: '获取验收历史失败' }, { status: response.status });
  }

  // response.data 是后端返回的完整响应
  // 返回格式: { code, message, data: InspectionHistoryRecord[], requestId, timestamp }
  const backendResponse = response.data as InspectionHistoryResponse;

  // 检查数据格式并返回 data 数组
  if (backendResponse?.data && Array.isArray(backendResponse.data)) {
    return NextResponse.json(backendResponse.data);
  }

  return NextResponse.json({ message: '数据格式错误' }, { status: 500 });
}

