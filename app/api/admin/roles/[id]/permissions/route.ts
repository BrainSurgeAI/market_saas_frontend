import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';

// 获取角色权限
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const id = (await params).id;
		const endpoint = `/roles/${id}/permissions`;
		const response = await fetchRemoteData({
			endpoint,
			method: 'GET',
			tags: [`role_${id}_permissions`],
			revalidate: 0
		});

		if (!response.success) {
			return NextResponse.json({
				message: response.error,
				status: response.status
			});
		}

		return NextResponse.json(response.data);
	} catch (error) {
		return NextResponse.json({
			message: '服务器内部错误',
			status: 500
		});
	}
}

// 更新角色权限
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const id = (await params).id;
		const body = await request.json();
		const endpoint = `/roles/${id}/permissions`;

		const response = await fetchRemoteData({
			endpoint,
			method: 'POST',
			body,
			tags: [`role_${id}_permissions`],
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
		return NextResponse.json(
			{ message: '服务器内部错误' },
			{ status: 500 }
		);
	}
} 