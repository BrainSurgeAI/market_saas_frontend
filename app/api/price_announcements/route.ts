import { fetchRemoteData, handleApiRequest } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

/**
 * 处理GET请求，获取产品数据
 * 支持以下查询参数：
 * - term: 搜索关键词
 * - category: 分类ID
 * - date: 日期，格式为YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
    try {
        // 获取查询参数
        const searchParams = request.nextUrl.searchParams;
        const term = searchParams.get('term');
        const category = searchParams.get('category');
        const date = searchParams.get('date');

        // 构建API URL
        let endpoint = `/price_announcements`;

        // 添加查询参数
        const queryParams = new URLSearchParams();
        if (term) queryParams.append('name', term);
        if (category) queryParams.append('category1', category);
        if (date) queryParams.append('date', date);


        // 如果有查询参数，添加到URL
        if (queryParams.toString()) {
            endpoint += `?${queryParams.toString()}`;
        }

        const response = await fetchRemoteData({
            endpoint: endpoint,
            method: 'GET',
            tags: [`${endpoint}`],
            needToken: false,
        });

        const data = response.data;
        if (!response.success) {
            logger.error(`获取产品价格公示请求时出错: ${response.error}`);
            return NextResponse.json({
                status: response.status,
                message: response.error,
                data: []
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({
            status: 500,
            message: error,
            data: []
        });
    }
}
