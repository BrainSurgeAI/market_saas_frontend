import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider_id: string; order_code: string }> }
) {
  const { provider_id, order_code } = await params;
  
  try {
    const { operations } = await request.json();
    
    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json(
        { message: '没有提供有效的操作记录' },
        { status: 400 }
      );
    }
    
    logger.info(`批量提交订单操作记录: ${provider_id}, ${order_code}, 共${operations.length}条`);
    
    // 调用后端API
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/providers/${provider_id}/orders/${order_code}/operations/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operations }),
    });

    if (!response.ok) {
      logger.error(`批量提交订单操作记录失败: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { message: `批量提交订单操作记录失败: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    logger.info(`订单操作记录批量提交成功: ${order_code}, 共${operations.length}条`);
    return NextResponse.json(data);
  } catch (error) {
    logger.error(`批量提交订单操作记录时出错: ${error}`);
    return NextResponse.json(
      { message: '批量提交订单操作记录时出错' },
      { status: 500 }
    );
  }
} 