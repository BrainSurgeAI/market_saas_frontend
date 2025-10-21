# 路由助手函数使用指南

## 概述

`route-helpers.ts` 提供了一套标准化的函数，用于简化 Next.js API 路由的开发，减少重复代码，提高代码质量和一致性。

## 主要功能

### 🔐 验证函数
- `validateContentType()` - 验证Content-Type
- `parseRequestBody()` - 安全解析JSON请求体
- `validateRequestBody()` - 验证请求体不为空
- `validateStringField()` - 验证字符串字段
- `validateNumberField()` - 验证数字字段
- `validateEmail()` - 验证邮箱格式

### 📝 响应函数
- `createErrorResponse()` - 创建标准化错误响应
- `createSuccessResponse()` - 创建标准化成功响应
- `handleRemoteApiResponse()` - 处理远程API响应

### 🛠️ 工具函数
- `withErrorHandling()` - 错误处理包装器
- `logApiOperation()` - 安全日志记录

## 使用模式

### 基础用法

```typescript
import { NextRequest } from "next/server";
import {
  validateContentType,
  parseRequestBody,
  validateStringField,
  withErrorHandling,
  handleRemoteApiResponse
} from "@/lib/route-helpers";
import { fetchRemoteData } from "@/lib/api-utils";

// 1. 定义请求体类型
interface MyRequest {
  name: string;
  age: number;
}

// 2. 创建处理函数
async function myHandler(request: NextRequest) {
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
  const parseResult = await parseRequestBody<MyRequest>(request);
  if (!parseResult.success) {
    return createErrorResponse(
      parseResult.error!.error,
      parseResult.error!.code,
      400
    );
  }

  // 验证字段
  const nameValidation = validateStringField(parseResult.data.name, "name");
  if (!nameValidation.success) {
    return createErrorResponse(
      nameValidation.error!.error,
      nameValidation.error!.code,
      400
    );
  }

  // 调用远程API
  const response = await fetchRemoteData({
    endpoint: "/my-endpoint",
    method: "POST",
    body: parseResult.data,
    needToken: true,
  });

  return handleRemoteApiResponse(response, "Operation completed successfully");
}

// 3. 导出包装的处理器
export const POST = withErrorHandling(myHandler);
```

## 验证函数详解

### validateStringField()

```typescript
// 基础验证
const result = validateStringField(value, "username");

// 允许空字符串
const result = validateStringField(value, "description", { allowEmpty: true });
```

### validateNumberField()

```typescript
// 基础数字验证
const result = validateNumberField(value, "age");

// 带范围限制的整数验证
const result = validateNumberField(value, "score", {
  min: 0,
  max: 100,
  integer: true
});
```

### validateEmail()

```typescript
const result = validateEmail(emailValue);
// 自动验证字符串格式和邮箱格式
```

## 响应格式标准化

### 错误响应格式
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 成功响应格式
```json
{
  "message": "Success message",
  "data": { /* response data */ },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 最佳实践

### 1. 验证顺序
```typescript
// 推荐的验证顺序：
// 1. Content-Type验证
// 2. JSON解析
// 3. 请求体基础验证
// 4. 各字段详细验证
// 5. 业务逻辑处理
// 6. 响应返回
```

### 2. 错误处理
```typescript
// 总是使用withErrorHandling包装
export const POST = withErrorHandling(myHandler);

// 而不是手动try-catch
export async function POST(request: NextRequest) {
  try {
    // ...
  } catch (error) {
    // 手动错误处理容易遗漏或不一致
  }
}
```

### 3. 类型安全
```typescript
// 总是定义清晰的接口
interface CreateUserRequest {
  username: string;
  email: string;
  age: number;
}

// 使用泛型确保类型安全
const parseResult = await parseRequestBody<CreateUserRequest>(request);
```

## 对比：重构前后

### 重构前（原始代码）
```typescript
export async function PATCH(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
        }

        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        if (!body || !body.password || typeof body.password !== 'string') {
            return NextResponse.json({ error: "Invalid password" }, { status: 400 });
        }

        // ... 更多重复的验证代码
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
```

### 重构后（使用helper函数）
```typescript
async function changePasswordHandler(request: NextRequest) {
  const contentTypeValidation = validateContentType(request);
  if (!contentTypeValidation.success) {
    return createErrorResponse(
      contentTypeValidation.error!.error,
      contentTypeValidation.error!.code,
      415
    );
  }

  const parseResult = await parseRequestBody<ChangePasswordRequest>(request);
  if (!parseResult.success) {
    return createErrorResponse(
      parseResult.error!.error,
      parseResult.error!.code,
      400
    );
  }

  const passwordValidation = validateStringField(parseResult.data.password, "password");
  if (!passwordValidation.success) {
    return createErrorResponse(
      passwordValidation.error!.error,
      passwordValidation.error!.code,
      400
    );
  }

  // 业务逻辑...
  return handleRemoteApiResponse(response, "Password changed successfully");
}

export const PATCH = withErrorHandling(changePasswordHandler);
```

## 优势总结

✅ **减少重复代码** - 将常见验证逻辑提取为可复用函数  
✅ **统一错误格式** - 所有API返回一致的错误响应格式  
✅ **类型安全** - 全程使用TypeScript严格类型  
✅ **易于维护** - 修改验证逻辑只需更新helper函数  
✅ **更好的测试** - 可以单独测试验证函数  
✅ **标准化日志** - 统一的日志格式和安全记录  

## 扩展指南

如需添加新的验证函数，请遵循以下模式：

```typescript
export function validateCustomField(
  value: any,
  fieldName: string,
  options: CustomOptions = {}
): ValidationResult<CustomType> {
  // 验证逻辑
  if (/* validation fails */) {
    return {
      success: false,
      error: {
        error: `${fieldName} validation failed`,
        code: `INVALID_${fieldName.toUpperCase()}`,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  return { success: true, data: validatedValue };
}
``` 