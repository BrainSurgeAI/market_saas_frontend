import { fetchRemoteData } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
  const response = await fetchRemoteData({
    endpoint: '/categories',
    method: 'GET',
    needToken: false,
    tags: ['categories'],
  });

  if (!response.success) {
    logger.error(`Failed to get categories: ${response.error}`);
    return NextResponse.json(
      { error: response.error },
      { status: response.status }
    );
  }

  return NextResponse.json(response.data.data || response.data);
}