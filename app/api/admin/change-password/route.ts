import { fetchRemoteData } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";
import {
  validateContentType,
  parseRequestBody,
  validateRequestBody,
  validateStringField,
  createErrorResponse,
  createSuccessResponse,
  handleRemoteApiResponse,
  logApiOperation,
  withErrorHandling,
  ErrorResponse,
  SuccessResponse
} from "@/lib/route-helpers";

/**
 * TODO List - Code Issues to Address:
 * 
 * 🔴 High Priority:
 * - TODO: 添加错误处理 - ✅ DONE: Using withErrorHandling wrapper
 * - TODO: 强化类型安全 - ✅ DONE: Using strict interfaces from route-helpers
 * - TODO: 添加请求体验证 - ✅ DONE: Using validateContentType, parseRequestBody, validateRequestBody
 * - TODO: 改进错误响应格式 - ✅ DONE: Using standardized createErrorResponse
 * 
 * 🟡 Medium Priority:
 * - TODO: 添加Content-Type检查 - ✅ DONE: Using validateContentType
 * - TODO: 增强安全性 - Consider requiring current password verification
 * - TODO: 优化日志记录 - ✅ DONE: Using logApiOperation for secure logging
 * - TODO: 明确响应状态码 - ✅ DONE: Using explicit status codes in helpers
 * 
 * 🟢 Low Priority:
 * - TODO: 优化缓存策略 - Consider appropriate cache strategy instead of revalidate: 0
 * - TODO: 添加操作审计 - Add audit logging for password changes
 * - TODO: 改进函数文档 - ✅ DONE: Enhanced JSDoc with parameter types and return values
 * 
 * 🔧 Code Quality:
 * - TODO: 统一代码风格 - ✅ DONE: Using consistent helper functions
 * - TODO: 添加响应类型定义 - ✅ DONE: Using types from route-helpers
 */

// 请求体类型定义
interface ChangePasswordRequest {
  password: string;
  confirmPassword?: string;
}

/**
 * Change super admin password
 * @param request NextRequest containing the new password in JSON body
 * @returns NextResponse with success message or error details
 * @throws 400 for validation errors, 415 for content-type errors, 500 for server errors
 */
async function changePasswordHandler(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // 验证Content-Type
  const contentTypeValidation = validateContentType(request);
  if (!contentTypeValidation.success) {
    return createErrorResponse(
      contentTypeValidation.error!.error,
      contentTypeValidation.error!.code,
      415
    );
  }

  // 解析请求体
  const parseResult = await parseRequestBody<ChangePasswordRequest>(request);
  if (!parseResult.success) {
    return createErrorResponse(
      parseResult.error!.error,
      parseResult.error!.code,
      400
    );
  }

  // 验证请求体不为空
  const bodyValidation = validateRequestBody(parseResult.data);
  if (!bodyValidation.success) {
    return createErrorResponse(
      bodyValidation.error!.error,
      bodyValidation.error!.code,
      400
    );
  }

  const body = bodyValidation.data!;

  // 验证密码字段
  const passwordValidation = validateStringField(body.password, "password");
  if (!passwordValidation.success) {
    return createErrorResponse(
      passwordValidation.error!.error,
      passwordValidation.error!.code,
      400
    );
  }

  // 调用远程API
  const response = await fetchRemoteData({
    endpoint: "/superadmin/password",
    method: "PATCH",
    body,
    needToken: true,
    revalidate: 0,
  });

  // 记录操作日志
  logApiOperation(
    "Change super admin password",
    "/api/admin/change-password",
    "PATCH",
    response.success
  );

  // 处理远程API响应
  return handleRemoteApiResponse(response, "Password changed successfully");
}

// 导出包装了错误处理的处理器
export const PATCH = withErrorHandling(changePasswordHandler); 