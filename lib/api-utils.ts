'use server'

import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";
import { Category, PriceAnnouncement } from "@/app/workspace/types";
import { revalidateTag } from 'next/cache';
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { TokenPayload } from "@/app/models";

/**
 * 通用API请求处理函数
 * @param request 请求对象
 * @param endpoint 后端API端点
 * @param method HTTP方法
 * @param errorMessage 错误消息
 * @param successMessage 成功消息
 * @returns NextResponse对象
 */
export async function handleApiRequest<T>(
	request: NextRequest,
	endpoint: string,
	method: string = 'GET',
	errorMessage: string = '请求失败',
	successMessage: string = '请求成功'
): Promise<NextResponse<T>> {
	try {
		// 获取认证令牌
		const token = request.cookies.get("auth-token")?.value;

		if (!token) {
			logger.error('未授权访问API');
			return NextResponse.json(
				{ error: "未授权，请先登录" },
				{ status: 401 }
			) as NextResponse<T>;
		}

		// 准备请求选项
		const options: RequestInit = {
			method,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			// 对于通过认证的API请求，通常不应该缓存
			cache: 'no-store'
		};

		// 如果是POST、PUT或PATCH请求，添加请求体
		if (['POST', 'PUT', 'PATCH'].includes(method)) {
			const body = await request.json();
			options.body = JSON.stringify(body);
		}

		const response = await fetch(endpoint, options);

		// 处理响应
		if (!response.ok) {
			const errorText = await response.text();
			logger.error(`${errorMessage}: ${response.status} - ${errorText}`);
			return NextResponse.json(
				{ error: `${errorMessage}: ${response.statusText}` },
				{ status: response.status }
			) as NextResponse<T>;
		}

		// 返回成功响应
		const data = await response.json();
		return NextResponse.json(data.data || data) as NextResponse<T>;
	} catch (error) {
		logger.error(`处理API请求时出错: ${error}`);
		return NextResponse.json(
			{ error: "服务器错误，请稍后再试" },
			{ status: 500 }
		) as NextResponse<T>;
	}
}

/**
 * 构建后端API URL
 * @param path API路径
 * @returns 完整的API URL
 */
function buildApiUrl(path: string): string {
	return `${process.env.BACKEND_API_URL}/api/v1${path}`;
}

// 缓存时间配置
const CACHE_CONFIG = {
	NO_CACHE: 0,
	ONE_HOUR: process.env.NODE_ENV === 'development' ? 0 : 60 * 60,
	FIFTEEN_MINUTS: process.env.NODE_ENV === 'development' ? 0 : 60 * 15,
};

/**
 * 手动重新验证特定数据缓存
 * @param tag 缓存标签名称
 */
export async function revalidateCache(tag: string): Promise<void> {
	try {
		revalidateTag(tag);
		logger.info(`成功重新验证缓存: ${tag}`);
	} catch (error) {
		logger.error(`重新验证缓存失败 ${tag}: ${error}`);
	}
}

/**
 * 获取分类列表
 * @returns 分类列表
 */
export async function getCategories(): Promise<Category[]> {
	try {
		const res = await fetch(`${buildApiUrl('/categories')}`, {
			next: {
				revalidate: CACHE_CONFIG.ONE_HOUR,
				tags: ['categories']
			},
			method: 'GET',
			headers: {
				'Accept': 'application/json'
			}
		});

		if (!res.ok) {
			logger.error(`API error: ${res.status} ${res.statusText}`);
			return [];
		}

		const categories = await res.json();
		return categories.data;
	} catch (error) {
		logger.error(`Fetch categories error: ${error}`);
		return [];
	}
}

/**
 * 获取价格公告数据
 * @param category 可选的分类筛选
 * @param date 可选的日期筛选
 * @returns 价格公告列表
 */
export async function getAnnouncementPrices(category?: number, date?: string): Promise<PriceAnnouncement[]> {
	let endpoint = `/price_announcements`;
	let searchParams = new URLSearchParams();

	if (category) {
		searchParams.append('category1', category.toString());
	}
	if (date) {
		searchParams.append('date', date);
	}

	if (searchParams.toString()) {
		endpoint += `?${searchParams.toString()}`;
	}

	try {
		const response = await fetchRemoteData({
			endpoint: endpoint,
			method: 'GET',
			tags: [`${endpoint}`],
			needToken: false
		});


		if (!response.success) {
			throw new Error("Failed to fetch price announcements");
		}
		const data = response.data;
		return data.data;
	} catch (error) {
		logger.error(`Fetch price announcements error: ${error instanceof Error ? error.message : 'Internal error'}`);
		return [];
	}
}

/**
 * 强制获取实时价格（绕过缓存）
 * 用于需要最新数据的场景
 */
export async function getRealtimePrices(category?: string): Promise<PriceAnnouncement[]> {
	let url = buildApiUrl('/price_announcements');

	if (category) {
		url += `?category1=${encodeURIComponent(category)}`;
	}

	try {
		const res = await fetch(url, {
			cache: 'no-store',
			method: 'GET',
			headers: {
				'Accept': 'application/json'
			},
		});

		if (!res.ok) {
			logger.error(`API error: ${res.status} ${res.statusText}`);
			return [];
		}

		const response = await res.json();
		return response.data;
	} catch (error) {
		logger.error('Failed to fetch realtime prices:', error);
		return [];
	}
}

interface FetchRemoteDataOptions<T> {
	endpoint: string;
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body?: T;
	tags?: string[];
	revalidate?: number;
	needToken?: boolean;
	clientIp?: string;
	skipAutoIp?: boolean;
}

/**
 * Common remote data fetching function
 * 
 * @description
 * 1. Get token from cookie if needToken is true
 * 2. Get client IP
 * 3. Build request headers
 * 4. Fetch remote data
 * 5. Return standardized response object
 * 
 * @param endpoint request URL
 * @param method request method
 * @param body request body if method is POST, PUT, PATCH
 * @param tags cache tags
 * @param revalidate revalidate time
 * @param needToken whether to need authentication
 * 
 * @example
 * ```ts
 * const response = await fetchRemoteData({
 *   endpoint: '/categories',
 *   method: 'GET',
 * });
 * ```
 * 
 * @returns standardized response object with data, status, success, error
 * 
 */
export async function fetchRemoteData<T>({
	endpoint,
	method = 'GET',
	body,
	tags = [],
	revalidate = CACHE_CONFIG.FIFTEEN_MINUTS,
	needToken = true
}: FetchRemoteDataOptions<T>) {
	const url = buildApiUrl(endpoint);
	try {
		const token = needToken ? await getToken() : null;
		const ip = await getClientIp();
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			'Accept': 'gzip'
		};

		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		if (ip) {
			headers['X-Forwarded-For'] = ip;
			headers['X-Real-IP'] = ip;
			headers['CF-Connecting-IP'] = ip;
		}

		const options: RequestInit = {
			method,
			headers,
			next: {
				revalidate: revalidate,
				tags: tags
			}
		};

		if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
			options.body = JSON.stringify(body);
		}

		logger.info(`Making ${method} request to: ${url} with body: ${body ? JSON.stringify(body) : 'no body'}`);
		const response = await fetch(url, options);
		if (!response.ok) {
			let errorText = 'Unknown error';
			try {
				errorText = await response.text();
			} catch (e) {
				// 如果无法读取错误响应，使用状态文本
				errorText = response.statusText;
			}
			logger.error(`Request failed: ${method} ${url} - Status: ${response.status} - Error: ${errorText}`);
			return {
				success: false,
				status: response.status,
				data: null,
				error: `${response.statusText}: ${errorText}`
			};
		}

		const result = await response.json();
		logger.debug(`Request ${url} - response ${JSON.stringify(result)}`);
		return {
			success: true,
			status: response.status,
			data: result,
			error: null
		};
	} catch (error) {
		logger.error('Failed to fetch remote data:', error);
		return {
			success: false,
			status: 500,
			data: null,
			error: `Failed to fetch remote data: ${error instanceof Error ? error.message : 'Unknown error'}`
		};
	}
}

/**
 * Try to get client IP address
 * @returns client IP address or undefined
 */
async function getClientIp(): Promise<string | undefined> {
	try {
		const headersList = await headers();
		if (!headersList) {
			return undefined;
		}

		const ip =
			headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
			headersList.get('x-real-ip') ||
			headersList.get('cf-connecting-ip');

		return ip || undefined;
	} catch (error) {
		logger.warn('Failed to get client IP: ' + (error instanceof Error ? error.message : 'Unknown error'));
		return undefined;
	}
}

/**
 * Get token from cookie
 * @returns token or undefined
 */
export async function getToken() {
	const cookieStore = await cookies();
	const token = cookieStore.get('auth-token')?.value;

	if (!token) {
		logger.warn('request token is undefined, redirect to login');
		redirect('/login');
	}

	return token;
}

/**
 * Get user roles from token
 * @returns user roles
 */
export async function getUserRoles() {
	const token = await getToken();
	return jwtDecode<TokenPayload>(token);
}