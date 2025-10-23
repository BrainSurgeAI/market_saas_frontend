import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: permissionId } = await params;
    const body = await request.json();

    logger.info(`更新权限请求 - ID: ${permissionId}, 数据: ${JSON.stringify(body)}`);

    const response = await fetchRemoteData({
      endpoint: `/permissions/${permissionId}`,
      method: 'PUT',
      body: body,
      revalidate: 0,
    });

    logger.info(`API响应 - 成功: ${response.success}, 状态: ${response.status}, 数据: ${JSON.stringify(response.data)}`);

    if (!response.success) {
      logger.error(`API请求失败 - 错误: ${response.error}, 状态: ${response.status}`);
      return NextResponse.json(
        {
          code: response.status === 404 ? 404 : 500,
          message: response.error || '更新权限失败',
          details: response.data
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      code: 200,
      message: '权限更新成功',
      data: response.data
    });
  } catch (error) {
    logger.error('更新权限出错:', error);
    return NextResponse.json(
      {
        code: 500,
        message: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: permissionId } = await params;

    const response = await fetchRemoteData({
      endpoint: `/permissions/${permissionId}`,
      method: 'DELETE',
    });

    if (!response.success) {
      return NextResponse.json(
        { message: response.error },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    logger.error('删除权限出错:', error);
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    );
  }
}