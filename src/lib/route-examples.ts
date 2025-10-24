/**
 * 路由助手函数使用示例
 * 展示如何在不同类型的API路由中使用公共函数
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchRemoteData } from "@/src/lib/api/utils";
import {
  validateContentType,
  parseRequestBody,
  validateRequestBody,
  validateStringField,
  validateNumberField,
  validateEmail,
  createErrorResponse,
  handleRemoteApiResponse,
  logApiOperation,
  withErrorHandling,
  ErrorResponse,
  SuccessResponse
} from "@/lib/route-helpers";

// ============== 示例1: 创建用户 ==============
interface CreateUserRequest {
  username: string;
  email: string;
  age: number;
  role?: string;
}

async function createUserHandler(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // 1. 验证Content-Type
  const contentTypeValidation = validateContentType(request);
  if (!contentTypeValidation.success) {
    return createErrorResponse(
      contentTypeValidation.error!.error,
      contentTypeValidation.error!.code,
      415
    );
  }

  // 2. 解析和验证请求体
  const parseResult = await parseRequestBody<CreateUserRequest>(request);
  if (!parseResult.success) {
    return createErrorResponse(
      parseResult.error!.error,
      parseResult.error!.code,
      400
    );
  }

  const bodyValidation = validateRequestBody(parseResult.data);
  if (!bodyValidation.success) {
    return createErrorResponse(
      bodyValidation.error!.error,
      bodyValidation.error!.code,
      400
    );
  }

  const body = bodyValidation.data!;

  // 3. 验证各个字段
  const usernameValidation = validateStringField(body.username, "username");
  if (!usernameValidation.success) {
    return createErrorResponse(
      usernameValidation.error!.error,
      usernameValidation.error!.code,
      400
    );
  }

  const emailValidation = validateEmail(body.email);
  if (!emailValidation.success) {
    return createErrorResponse(
      emailValidation.error!.error,
      emailValidation.error!.code,
      400
    );
  }

  const ageValidation = validateNumberField(body.age, "age", { 
    min: 18, 
    max: 120, 
    integer: true 
  });
  if (!ageValidation.success) {
    return createErrorResponse(
      ageValidation.error!.error,
      ageValidation.error!.code,
      400
    );
  }

  // 4. 调用远程API
  const response = await fetchRemoteData({
    endpoint: "/users",
    method: "POST",
    body,
    needToken: true,
  });

  // 5. 记录日志并返回响应
  logApiOperation(
    "Create user",
    "/api/users",
    "POST",
    response.success
  );

  return handleRemoteApiResponse(response, "User created successfully");
}

export const POST_CreateUser = withErrorHandling(createUserHandler);

// ============== 示例2: 更新产品价格 ==============
interface UpdatePriceRequest {
  productId: string;
  price: number;
  currency?: string;
}

async function updatePriceHandler(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  const contentTypeValidation = validateContentType(request);
  if (!contentTypeValidation.success) {
    return createErrorResponse(
      contentTypeValidation.error!.error,
      contentTypeValidation.error!.code,
      415
    );
  }

  const parseResult = await parseRequestBody<UpdatePriceRequest>(request);
  if (!parseResult.success) {
    return createErrorResponse(
      parseResult.error!.error,
      parseResult.error!.code,
      400
    );
  }

  const bodyValidation = validateRequestBody(parseResult.data);
  if (!bodyValidation.success) {
    return createErrorResponse(
      bodyValidation.error!.error,
      bodyValidation.error!.code,
      400
    );
  }

  const body = bodyValidation.data!;

  // 验证产品ID
  const productIdValidation = validateStringField(body.productId, "productId");
  if (!productIdValidation.success) {
    return createErrorResponse(
      productIdValidation.error!.error,
      productIdValidation.error!.code,
      400
    );
  }

  // 验证价格（最小值0.01）
  const priceValidation = validateNumberField(body.price, "price", { 
    min: 0.01 
  });
  if (!priceValidation.success) {
    return createErrorResponse(
      priceValidation.error!.error,
      priceValidation.error!.code,
      400
    );
  }

  const response = await fetchRemoteData({
    endpoint: `/products/${body.productId}/price`,
    method: "PATCH",
    body: { price: body.price, currency: body.currency || "CNY" },
    needToken: true,
  });

  logApiOperation(
    "Update product price",
    "/api/products/price",
    "PATCH",
    response.success
  );

  return handleRemoteApiResponse(response, "Price updated successfully");
}

export const PATCH_UpdatePrice = withErrorHandling(updatePriceHandler);

// ============== 示例3: 简单的GET请求（无需验证请求体）==============
async function getUserListHandler(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // GET请求通常不需要验证请求体，但可能需要验证查询参数
  const url = new URL(request.url);
  const page = url.searchParams.get('page');
  const limit = url.searchParams.get('limit');

  // 验证分页参数（如果提供）
  if (page) {
    const pageValidation = validateNumberField(
      parseInt(page), 
      "page", 
      { min: 1, integer: true }
    );
    if (!pageValidation.success) {
      return createErrorResponse(
        pageValidation.error!.error,
        pageValidation.error!.code,
        400
      );
    }
  }

  if (limit) {
    const limitValidation = validateNumberField(
      parseInt(limit), 
      "limit", 
      { min: 1, max: 100, integer: true }
    );
    if (!limitValidation.success) {
      return createErrorResponse(
        limitValidation.error!.error,
        limitValidation.error!.code,
        400
      );
    }
  }

  const response = await fetchRemoteData({
    endpoint: `/users?page=${page || 1}&limit=${limit || 10}`,
    method: "GET",
    needToken: true,
  });

  logApiOperation(
    "Get user list",
    "/api/users",
    "GET",
    response.success
  );

  return handleRemoteApiResponse(response);
}

export const GET_UserList = withErrorHandling(getUserListHandler);

// ============== 示例4: 删除操作（从URL路径获取ID）==============
async function deleteUserHandler(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // 从URL中提取用户ID
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const userId = pathSegments[pathSegments.length - 1];

  // 验证路径参数
  const idValidation = validateStringField(userId, "user ID");
  if (!idValidation.success) {
    return createErrorResponse(
      idValidation.error!.error,
      idValidation.error!.code,
      400
    );
  }

  const response = await fetchRemoteData({
    endpoint: `/users/${userId}`,
    method: "DELETE",
    needToken: true,
  });

  logApiOperation(
    "Delete user",
    `/api/users/${userId}`,
    "DELETE",
    response.success
  );

  return handleRemoteApiResponse(response, "User deleted successfully");
}

export const DELETE_User = withErrorHandling(deleteUserHandler);

// ============== 使用指南 ==============
/**
 * 在实际的 route.ts 文件中使用：
 * 
 * 1. 导入需要的函数：
 * import { 
 *   validateContentType, 
 *   parseRequestBody, 
 *   validateStringField,
 *   withErrorHandling,
 *   handleRemoteApiResponse 
 * } from "@/lib/route-helpers";
 * 
 * 2. 创建处理函数：
 * async function myHandler(request: NextRequest) {
 *   // 使用helper函数进行验证
 *   // 返回响应
 * }
 * 
 * 3. 导出包装的处理器：
 * export const POST = withErrorHandling(myHandler);
 * 
 * 这样可以：
 * - 大幅减少重复代码
 * - 统一错误处理和响应格式
 * - 提高代码可维护性
 * - 确保类型安全
 */ 