'use server'

import { ApiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';

type RegisterData = {
    tenantName: string;
    username: string;
    tenantType: "MARKET" | "PROVIDER" | "CUSTOMER";
    password: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
};

export async function register(data: RegisterData) {
    try {
        // 创建一个新的 ApiClient 实例
        const apiClient = new ApiClient();
        
        // 使用现有的 register 方法
        const response = await apiClient.register({
            tenantName: data.tenantName,
            username: data.username,
            tenantType: data.tenantType,
            password: data.password
        });
        
        if (response.code === 200 && response.data) {
            logger.info(`register success, token: ${response.data}`);
            
            const cookiesInstance = await cookies();
            cookiesInstance.set('token', response.data, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
            });
            
            return {
                success: true,
                data: response.data
            };
        }
        
        return {
            status: response.code,
            success: false,
            error: response.message || '注册失败'
        };
    } catch (error: any) {
        console.error('Register error:', error);
        return {
            status: error.status || 500,
            success: false,
            error: error.message || '服务器错误，请稍后重试'
        };
    }
}