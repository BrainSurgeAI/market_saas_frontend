import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { fetchRemoteData } from '@/lib/api-utils';

// PATCH 用于更新用户信息
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ market_id: string; tenant_hash: string; username: string }> }
) {
  try {
    const { username } = await params;
    const data = await request.json();
    
    const endpoint = `/users/${username}`;
    const response = await fetchRemoteData({ endpoint, method: 'PATCH', body: data, revalidate: 0 });
    
    if (!response.success) {
        return NextResponse.json(
          { error: response.error },
          { status: response.status }
        );
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error(`更新用户时出错: ${error}`);
    return NextResponse.json(
        { error: '服务器错误，请稍后再试' },
        { status: 500 }
      );
  }
}

// DELETE 用于删除或恢复用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ market_id: string; tenant_hash: string; username: string }> }
) {
  try {
    const { tenant_hash, username } = await params;
    
    // 检查是恢复还是删除操作
    const { restore } = await request.json().catch(() => ({ restore: false }));
    logger.info(`restore: ${restore}`);

    // 根据操作类型构建不同的端点和方法
    let endpoint = `/tenants/${tenant_hash}/users/${username}/${restore ? 'enable' : 'disable'}`;
    
    if (restore) {
      
      // 调用API恢复用户
      const response = await fetchRemoteData({ 
        endpoint, 
        method: 'PATCH', 
        body: { deletedAt: null },  // 将deletedAt设为null表示恢复用户
        revalidate: 0 
      });
      
      if (!response.success) {
        return NextResponse.json(
          { error: response.error || '恢复用户失败' },
          { status: response.status || 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: '用户已成功恢复'
      });
    } else {
      // 删除用户操作
      const response = await fetchRemoteData({ endpoint, method: 'DELETE', revalidate: 0 });
      
      if (!response.success) {
        return NextResponse.json(
          { error: response.error || '用户禁用失败' },
          { status: response.status || 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: '用户已成功禁用'
      });
    }
  } catch (error) {
    logger.error(`处理用户时出错: ${error}`);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
} 