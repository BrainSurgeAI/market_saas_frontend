import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: number }> }
) {
	try {
		const { id } = await params;
		const endpoint = `/roles/${id}`;
		const response = await fetchRemoteData({
			endpoint,
			method: 'GET',
			tags: ['role_permissions'],
			revalidate: 0
		});

		if (!response.success) {
			return NextResponse.json(
				{ message: response.error },
				{ status: response.status }
			);
		}

		return NextResponse.json(response.data);
	} catch (error) {
		logger.error('获取角色数据出错:', error);
		return NextResponse.json(
			{ message: '服务器内部错误' },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: number }> }
) {
	try {
		const body = await request.json();
		const { id } = await params;
		const endpoint = `/roles/${id}`;

		const response = await fetchRemoteData({
			endpoint,
			method: 'PUT',
			body,
			tags: ['role_permissions'],
			revalidate: 0
		});

		if (!response.success) {
			return NextResponse.json(
				{ message: response.error },
				{ status: response.status }
			);
		}

		return NextResponse.json(response.data);
	} catch (error) {
		logger.error('更新角色数据出错:', error);
		return NextResponse.json(
			{ message: '服务器内部错误' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: number }> }
) {
	try {
		const { id } = await params;
		const endpoint = `/roles/${id}`;

		const response = await fetchRemoteData({
			endpoint,
			method: 'DELETE',
			tags: ['role_permissions'],
			revalidate: 0
		});

		if (!response.success) {
			return NextResponse.json(
				{ message: response.error },
				{ status: response.status }
			);
		}

		return NextResponse.json(response.data);
	} catch (error) {
		logger.error('删除角色出错:', error);
		return NextResponse.json(
			{ message: '服务器内部错误' },
			{ status: 500 }
		);
	}
} 