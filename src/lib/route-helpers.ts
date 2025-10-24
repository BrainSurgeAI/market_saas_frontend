import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

// 通用响应类型定义
export interface ErrorResponse {
  error: string;
  code?: string;
  timestamp: string;
}

export interface SuccessResponse<T = any> {
  message?: string;
  data?: T;
  timestamp: string;
}

// 验证结果类型
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}

/**
 * 创建标准化的错误响应
 */
export function createErrorResponse(
  error: string,
  code?: string,
  status: number = 500
): NextResponse<ErrorResponse> {
  const errorResponse: ErrorResponse = {
    error,
    code,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(errorResponse, { status });
}

/**
 * 创建标准化的成功响应
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  const successResponse: SuccessResponse<T> = {
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(successResponse, { status });
}

/**
 * 验证请求的Content-Type是否为application/json
 */
export function validateContentType(request: NextRequest): ValidationResult {
  const contentType = request.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    return {
      success: false,
      error: {
        error: "Content-Type must be application/json",
        code: "INVALID_CONTENT_TYPE",
        timestamp: new Date().toISOString()
      }
    };
  }
  
  return { success: true };
}

/**
 * 安全地解析请求体为JSON
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    return { success: true, data: body };
  } catch {
    return {
      success: false,
      error: {
        error: "Invalid JSON format",
        code: "INVALID_JSON",
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * 验证请求体不为空
 */
export function validateRequestBody<T>(body: T): ValidationResult<T> {
  if (!body || typeof body !== 'object') {
    return {
      success: false,
      error: {
        error: "Request body is required",
        code: "MISSING_BODY",
        timestamp: new Date().toISOString()
      }
    };
  }
  
  return { success: true, data: body };
}

/**
 * 验证字符串字段（必填且非空）
 */
export function validateStringField(
  value: any,
  fieldName: string,
  options: { allowEmpty?: boolean } = {}
): ValidationResult<string> {
  const { allowEmpty = false } = options;
  
  if (!value || typeof value !== 'string') {
    return {
      success: false,
      error: {
        error: `${fieldName} is required and must be a string`,
        code: `INVALID_${fieldName.toUpperCase()}`,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  if (!allowEmpty && value.trim().length === 0) {
    return {
      success: false,
      error: {
        error: `${fieldName} cannot be empty`,
        code: `EMPTY_${fieldName.toUpperCase()}`,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  return { success: true, data: value };
}

/**
 * 验证数字字段
 */
export function validateNumberField(
  value: any,
  fieldName: string,
  options: { min?: number; max?: number; integer?: boolean } = {}
): ValidationResult<number> {
  const { min, max, integer = false } = options;
  
  if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
    return {
      success: false,
      error: {
        error: `${fieldName} is required and must be a valid number`,
        code: `INVALID_${fieldName.toUpperCase()}`,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  if (integer && !Number.isInteger(value)) {
    return {
      success: false,
      error: {
        error: `${fieldName} must be an integer`,
        code: `INVALID_${fieldName.toUpperCase()}_FORMAT`,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  if (min !== undefined && value < min) {
    return {
      success: false,
      error: {
        error: `${fieldName} must be at least ${min}`,
        code: `${fieldName.toUpperCase()}_TOO_SMALL`,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  if (max !== undefined && value > max) {
    return {
      success: false,
      error: {
        error: `${fieldName} must be at most ${max}`,
        code: `${fieldName.toUpperCase()}_TOO_LARGE`,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  return { success: true, data: value };
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: any): ValidationResult<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const stringValidation = validateStringField(email, "email");
  if (!stringValidation.success) {
    return stringValidation;
  }
  
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: {
        error: "Invalid email format",
        code: "INVALID_EMAIL_FORMAT",
        timestamp: new Date().toISOString()
      }
    };
  }
  
  return { success: true, data: email };
}

/**
 * 包装路由处理器，自动处理常见错误
 */
export function withErrorHandling<T = any>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | ErrorResponse>> => {
    try {
      return await handler(request);
    } catch (error) {
      logger.error(`Unexpected error in API route: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      return createErrorResponse(
        "Internal server error",
        "INTERNAL_ERROR",
        500
      ) as NextResponse<ErrorResponse>;
    }
  };
}

/**
 * 组合多个验证函数
 */
export async function validateRequest<T>(
  request: NextRequest,
  validators: Array<(req: NextRequest) => ValidationResult | Promise<ValidationResult>>
): Promise<ValidationResult<T>> {
  for (const validator of validators) {
    const result = await validator(request);
    if (!result.success) {
      return result;
    }
  }
  
  return { success: true };
}

/**
 * 通用的API响应包装器，处理fetchRemoteData的响应
 */
export function handleRemoteApiResponse(
  response: any,
  successMessage?: string
): NextResponse<SuccessResponse | ErrorResponse> {
  if (!response.success) {
    return createErrorResponse(
      response.error || "Remote API error",
      "REMOTE_API_ERROR",
      response.status || 500
    );
  }
  
  return createSuccessResponse(
    response.data,
    successMessage,
    200
  );
}

/**
 * 安全日志记录（避免记录敏感数据）
 */
export function logApiOperation(
  operation: string,
  endpoint: string,
  method: string,
  success: boolean = true
): void {
  if (success) {
    logger.info(`API operation completed: ${operation}`);
  } else {
    logger.error(`API operation failed: ${operation}`);
  }
} 