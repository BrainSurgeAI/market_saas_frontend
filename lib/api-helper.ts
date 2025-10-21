import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';
import type { NextRequest } from 'next/server';

export async function getAuthTokenOrRedirect(request: NextRequest): Promise<string> {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    logger.error('未找到认证令牌，重定向到登录页');
    redirect('/login');
  }
  return token;
}

export function buildBackendUrl(path: string): string {
  return `${process.env.BACKEND_API_URL}${path}`;
}

export async function safeFetch(
  url: string,
  options: RequestInit,
  fallbackMessage = '服务器请求出错'
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    logger.error(`${fallbackMessage}: ${error}`);
    throw new Error(fallbackMessage);
  }
}
