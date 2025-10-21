import { fetchRemoteData } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ org_name: string }> }
) {
	const org_name = (await params).org_name;
	const response = await fetchRemoteData({
		endpoint: `/tenants/${org_name}/orders/after_sale`,
		method: 'GET',
		needToken: true,
		revalidate: 0
	});

	if (!response.success) {
		logger.error(`获取售后订单失败: ${response.error}`);
		return NextResponse.json({ message: '获取售后订单失败' }, { status: response.status });
	}

	return NextResponse.json(response.data.data ? response.data.data : []);
}