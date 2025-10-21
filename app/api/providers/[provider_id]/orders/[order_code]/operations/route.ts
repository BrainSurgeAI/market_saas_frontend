import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchRemoteData } from "@/lib/api-utils";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ provider_id: string; order_code: string }> }
) {
	const { provider_id, order_code } = await params;

	try {
		const operationData = await request.json();

		logger.info(`提交订单操作记录: ${provider_id}, ${order_code}, ${operationData.operateType}`);

		const cookieStore = await cookies();
		const token = cookieStore.get('auth-token')?.value;
		if (!token) {
			logger.warn('No token found');
			redirect('/login');
		}

		logger.debug(`提交订单操作记录: ${JSON.stringify(operationData)}`);
		const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/providers/${provider_id}/orders/${order_code}/operations`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify(operationData),
		});

		if (!response.ok) {
			logger.error(`提交订单操作记录失败: ${response.status} ${response.statusText}`);
			return NextResponse.json(
				{ message: `提交订单操作记录失败: ${response.statusText}` },
				{ status: response.status }
			);
		}

		const data = await response.json();

		logger.info(`订单操作记录提交成功: ${order_code}`);
		return NextResponse.json(data);
	} catch (error) {
		logger.error(`提交订单操作记录时出错: ${error}`);
		return NextResponse.json(
			{ message: '提交订单操作记录时出错' },
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ provider_id: string; order_code: string }> }
) {
	const { provider_id, order_code } = await params;
	const operationData = await request.json();

	const response = await fetchRemoteData({
		endpoint: `/tenants/${provider_id}/orders/${order_code}/operations`,
		method: 'PATCH',
		body: operationData,
		needToken: true,
		revalidate: 0
	});

	if (!response.success) {
		return NextResponse.json(
			{ message: `提交订单操作记录失败: ${response.error}` },
			{ status: response.status }
		);
	}

	return NextResponse.json(response.data);
}