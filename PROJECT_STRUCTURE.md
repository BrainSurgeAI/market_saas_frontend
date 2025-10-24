# 项目目录组织规范

## 目录结构设计原则

1. **单一职责**: 每个目录有明确的职责
2. **层次清晰**: 目录层级不宜过深
3. **命名一致**: 使用统一的命名规范
4. **易于维护**: 便于添加新功能和查找文件

## 推荐的目录结构

```
market-saas-frontend/
├── src/                          # 源代码目录 (可选，但推荐)
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # 路由组 - 认证相关
│   │   ├── (dashboard)/         # 路由组 - 仪表板相关
│   │   ├── admin/               # 管理员页面
│   │   ├── workspace/           # 工作区页面
│   │   ├── api/                 # API 路由
│   │   ├── globals.css          # 全局样式
│   │   ├── layout.tsx           # 根布局
│   │   ├── page.tsx             # 首页
│   │   └── loading.tsx          # 全局加载
│   ├── components/              # 可复用组件
│   │   ├── ui/                  # 基础 UI 组件 (shadcn/ui)
│   │   ├── features/            # 功能组件
│   │   │   ├── auth/            # 认证相关组件
│   │   │   ├── dashboard/       # 仪表板组件
│   │   │   ├── orders/          # 订单相关组件
│   │   │   ├── products/        # 产品相关组件
│   │   │   └── users/           # 用户相关组件
│   │   ├── layout/              # 布局组件
│   │   └── shared/              # 共享组件
│   ├── lib/                     # 核心库和工具
│   │   ├── api/                 # API 相关
│   │   │   ├── client.ts        # API 客户端
│   │   │   ├── utils.ts         # API 工具函数
│   │   │   └── types.ts         # API 类型定义
│   │   ├── components/          # 通用业务组件
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── providers/           # Context Providers
│   │   ├── utils/               # 工具函数
│   │   │   ├── formatting.ts    # 格式化工具
│   │   │   ├── validation.ts    # 验证工具
│   │   │   └── helpers.ts       # 辅助函数
│   │   ├── stores/              # 状态管理
│   │   └── constants/           # 常量定义
│   ├── types/                   # TypeScript 类型定义
│   │   ├── api.ts               # API 相关类型
│   │   ├── auth.ts              # 认证相关类型
│   │   ├── common.ts            # 通用类型
│   │   └── index.ts             # 类型导出
│   ├── styles/                  # 样式文件
│   │   ├── globals.css          # 全局样式
│   │   └── components.css       # 组件样式
│   ├── assets/                  # 静态资源
│   │   ├── images/              # 图片
│   │   ├── icons/               # 图标
│   │   ├── fonts/               # 字体
│   │   └── lottie/              # 动画文件
│   └── tests/                   # 测试文件
│       ├── __mocks__/           # Mock 文件
│       ├── fixtures/            # 测试数据
│       └── utils/               # 测试工具
├── public/                      # 公共静态文件
├── docs/                        # 项目文档
├── .github/                     # GitHub 配置
│   └── workflows/               # CI/CD 工作流
└── 配置文件                     # 根目录配置文件
```

## 命名规范

### 1. 文件命名

#### TypeScript/JavaScript 文件
- **组件文件**: `PascalCase.tsx` (如 `UserProfile.tsx`)
- **Hook 文件**: `camelCase.ts` (如 `useUserProfile.ts`)
- **工具函数**: `kebab-case.ts` (如 `date-utils.ts`)
- **类型定义**: `PascalCase.ts` (如 `UserTypes.ts`)
- **常量文件**: `UPPER_SNAKE_CASE.ts` (如 `API_ENDPOINTS.ts`)

#### 目录命名
- **组件目录**: `kebab-case` (如 `user-profile/`)
- **功能目录**: `kebab-case` (如 `order-management/`)
- **工具目录**: `kebab-case` (如 `date-utils/`)

### 2. 变量命名

#### 组件
```typescript
// ✅ 好的命名
const UserProfile = () => {}
const OrderDetails = () => {}

// ❌ 避免的命名
const userprofile = () => {}
const order_details = () => {}
```

#### Hooks
```typescript
// ✅ 好的命名
const useUserProfile = () => {}
const useOrderData = () => {}

// ❌ 避免的命名
const userProfileHook = () => {}
const orderDataHook = () => {}
```

#### 工具函数
```typescript
// ✅ 好的命名
export const formatDate = () => {}
export const validateEmail = () => {}

// ❌ 避免的命名
export const date_formatter = () => {}
export const emailValidator = () => {}
```

### 3. 常量命名

```typescript
// ✅ 好的命名
const API_ENDPOINTS = {
  USER_LOGIN: '/api/auth/login',
  USER_LOGOUT: '/api/auth/logout'
} as const

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// ❌ 避免的命名
const apiEndpoints = {}
const max_file_size = 1024
```

## 组件组织规范

### 1. 组件文件结构

每个组件应该包含：
```
ComponentName/
├── index.ts              # 导出文件
├── ComponentName.tsx     # 主组件文件
├── ComponentName.test.tsx # 测试文件
├── ComponentName.stories.tsx # Storybook 故事 (可选)
├── components/           # 子组件 (如果有)
│   ├── SubComponent1.tsx
│   └── SubComponent2.tsx
├── hooks/                # 组件专用 hooks (如果有)
│   └── useComponentLogic.ts
├── types.ts              # 组件专用类型 (如果有)
└── utils.ts              # 组件专用工具 (如果有)
```

### 2. 组件导出

```typescript
// index.ts
export { UserProfile } from './UserProfile'
export type { UserProfileProps } from './UserProfile'

// 支持命名导出和默认导出
export { default as UserProfile } from './UserProfile'
```

## API 组织规范

### 1. API 路由结构

```
app/api/
├── auth/                  # 认证相关 API
│   ├── login/
│   │   └── route.ts
│   └── logout/
│       └── route.ts
├── users/                 # 用户相关 API
│   ├── [username]/
│   │   ├── profile/
│   │   │   └── route.ts
│   │   └── settings/
│   │       └── route.ts
│   └── route.ts
├── orders/                # 订单相关 API
│   ├── [order_id]/
│   │   ├── items/
│   │   │   └── route.ts
│   │   └── route.ts
│   └── route.ts
└── admin/                 # 管理员 API
    ├── users/
    │   └── route.ts
    └── roles/
        └── route.ts
```

### 2. API 文件命名

- **路由文件**: `route.ts`
- **类型文件**: `types.ts`
- **工具文件**: `utils.ts`
- **测试文件**: `route.test.ts`

## 类型定义规范

### 1. 类型文件组织

```
types/
├── api.ts                  # API 相关类型
├── auth.ts                 # 认证相关类型
├── common.ts               # 通用类型
├── components.ts           # 组件相关类型
├── forms.ts                # 表单相关类型
├── navigation.ts           # 导航相关类型
└── index.ts                # 统一导出
```

### 2. 类型命名规范

```typescript
// ✅ 好的命名
interface UserProfile {
  id: string
  name: string
  email: string
}

type UserRole = 'admin' | 'user' | 'guest'

interface ApiResponse<T> {
  data: T
  message: string
  code: number
}

// ❌ 避免的命名
interface user_profile {}
type userRole = 'admin' | 'user'
```

## 测试文件规范

### 1. 测试文件命名

- **单元测试**: `ComponentName.test.tsx`
- **集成测试**: `ComponentName.integration.test.tsx`
- **E2E 测试**: `ComponentName.e2e.test.tsx`
- **Mock 文件**: `mocks.ts`
- **测试工具**: `test-utils.tsx`

### 2. 测试文件组织

```
tests/
├── __mocks__/               # Mock 文件
│   ├── api.ts
│   └── auth.ts
├── fixtures/                # 测试数据
│   ├── users.json
│   └── orders.json
├── utils/                   # 测试工具
│   ├── test-utils.tsx
│   └── render.tsx
└── setup.ts                 # 测试设置
```

## 迁移指南

### 阶段 1: 创建新目录结构
1. 创建 `src/` 目录
2. 按照规范创建子目录
3. 移动配置文件到根目录

### 阶段 2: 迁移组件
1. 将 `components/` 移动到 `src/components/`
2. 按功能重新组织组件
3. 更新导入路径

### 阶段 3: 迁移工具和类型
1. 将 `lib/` 移动到 `src/lib/`
2. 重新组织工具函数
3. 统一类型定义

### 阶段 4: 更新导入路径
1. 更新所有文件的导入路径
2. 配置路径别名
3. 运行测试确保无问题

## ESLint 配置建议

```javascript
module.exports = {
  rules: {
    // 强制文件命名规范
    'filename-rules/match': [
      'error',
      {
        '**/*.tsx': 'PascalCase',
        '**/*.ts': 'camelCase',
        '**/*.test.*': 'camelCase',
        '**/*.stories.*': 'PascalCase'
      }
    ]
  }
}
```

## 总结

这个目录组织规范旨在：
1. **提高可维护性**: 清晰的目录结构便于维护
2. **提升开发效率**: 统一的命名规范便于快速查找
3. **支持团队协作**: 明确的规范便于团队协作
4. **便于扩展**: 合理的分层便于功能扩展

采用这个规范将使项目更加专业、可维护和可扩展。