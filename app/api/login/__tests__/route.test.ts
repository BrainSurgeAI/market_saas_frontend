import { describe, expect, test, vi, beforeEach, Mock } from 'vitest';
import { POST } from '../route';
import { fetchRemoteData } from '@/lib/api-utils';
import { jwtDecode } from 'jwt-decode';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// 模拟依赖
vi.mock('@/lib/api-utils', () => ({
  fetchRemoteData: vi.fn()
}));

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn()
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('POST /api/login', () => {
  // 每次测试前重置模拟
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('应该在凭据有效时设置cookie并返回数据', async () => {
    // 模拟请求
    const request = {
      json: vi.fn().mockResolvedValue({ username: 'test', password: 'password' })
    } as unknown as NextRequest;

    // 模拟API响应
    const mockToken = 'valid.jwt.token';
    const mockResponse = {
      success: true,
      status: 200,
      data: { data: mockToken },
      error: null
    };
    (fetchRemoteData as unknown as Mock).mockResolvedValue(mockResponse);
    
    // 模拟JWT解码
    const futureTime = Math.floor(Date.now() / 1000) + 3600;
    (jwtDecode as unknown as Mock).mockReturnValue({ exp: futureTime });
    
    // 模拟cookie存储
    const mockCookieStore = {
      set: vi.fn(),
      get: vi.fn(),
      getAll: vi.fn(),
      has: vi.fn(),
      size: 0,
      [Symbol.iterator]: function* () { yield* []; }
    };
    (cookies as unknown as Mock).mockResolvedValue(mockCookieStore);
    
    // 模拟NextResponse
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    
    // 执行测试
    await POST(request);
    
    // 验证结果
    expect(fetchRemoteData).toHaveBeenCalledWith({
      endpoint: '/login',
      method: 'POST',
      body: { username: 'test', password: 'password' },
      needToken: false,
      revalidate: 0
    });
    
    expect(jwtDecode).toHaveBeenCalledWith(mockToken);
    expect(cookies).toHaveBeenCalled();
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'auth-token', 
      mockToken,
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: expect.any(Number)
      })
    );
    expect(jsonSpy).toHaveBeenCalledWith(mockResponse.data);
  });

  test('应该在凭据格式错误时返回400错误，并提示用户名或密码错误', async () => {
    // 模拟请求
    const request = {
      json: vi.fn().mockResolvedValue({ username: 'test', password: 'wrong' })
    } as unknown as NextRequest;

    // 模拟API响应
    (fetchRemoteData as unknown as Mock).mockResolvedValue({
      success: false,
      status: 400,
      data: null,
      error: '用户名或密码错误'
    });
    
    // 模拟NextResponse
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    
    // 执行测试
    await POST(request);
    
    // 验证结果
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: '用户名或密码错误' },
      { status: 400 }
    );
  });

  test('应该在凭据无效时返回401错误', async () => {
    // 模拟请求
    const request = {
      json: vi.fn().mockResolvedValue({ username: 'test', password: 'wrong' })
    } as unknown as NextRequest;

    // 模拟API响应
    (fetchRemoteData as unknown as Mock).mockResolvedValue({
      success: false,
      status: 401,
      data: null,
      error: '用户名或密码错误'
    });
    
    // 模拟NextResponse
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    
    // 执行测试
    await POST(request);
    
    // 验证结果
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: '用户名或密码错误' },
      { status: 401 }
    );
  });

  test('应该在其他错误情况下返回相应的错误状态', async () => {
    // 模拟请求
    const request = {
      json: vi.fn().mockResolvedValue({ username: 'test', password: 'password' })
    } as unknown as NextRequest;

    // 模拟API响应
    (fetchRemoteData as unknown as Mock).mockResolvedValue({
      success: false,
      status: 500,
      data: null,
      error: '服务器内部错误'
    });
    
    // 模拟NextResponse
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    
    // 执行测试
    await POST(request);
    
    // 验证结果
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  });

  test('应该在令牌过期时重定向到登录页面', async () => {
    // 模拟请求
    const request = {
      json: vi.fn().mockResolvedValue({ username: 'test', password: 'password' })
    } as unknown as NextRequest;

    // 模拟API响应
    const mockToken = 'expired.jwt.token';
    const mockResponse = {
      success: true,
      status: 200,
      data: { data: mockToken },
      error: null
    };
    (fetchRemoteData as unknown as Mock).mockResolvedValue(mockResponse);
    
    // 模拟JWT解码 - 过期的令牌
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // 一小时前
    (jwtDecode as unknown as Mock).mockReturnValue({ exp: pastTime });
    
    // 执行测试
    await POST(request);
    
    // 验证结果
    expect(logger.warn).toHaveBeenCalledWith('Token already expired, redirect to login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  test('应该处理JWT解码错误', async () => {
    // 模拟请求
    const request = {
      json: vi.fn().mockResolvedValue({ username: 'test', password: 'password' })
    } as unknown as NextRequest;

    // 模拟API响应
    const mockToken = 'invalid.jwt.token';
    const mockResponse = {
      success: true,
      status: 200,
      data: { data: mockToken },
      error: null
    };
    (fetchRemoteData as unknown as Mock).mockResolvedValue(mockResponse);
    
    // 模拟JWT解码抛出错误
    const mockError = new Error('Invalid token');
    (jwtDecode as unknown as Mock).mockImplementation(() => {
      throw mockError;
    });
    
    // 模拟NextResponse
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    
    // 执行测试
    await POST(request);
    
    // 验证结果
    expect(logger.error).toHaveBeenCalledWith('Token decode error:', mockError);
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: 'Token decode error' },
      { status: 500 }
    );
  });
}); 