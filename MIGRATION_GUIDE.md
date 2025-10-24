# 项目目录重构迁移指南

## 概述

本指南详细说明了项目目录重构的变化以及如何更新代码以适应新的结构。

## 重构变化

### 1. 目录结构变化

#### 旧结构
```
├── components/          # 根目录组件
│   ├── ui/             # UI 组件
│   └── homepage/       # 页面组件
├── lib/                # 工具函数
│   ├── components/     # 通用组件
│   ├── hooks/          # 自定义 hooks
│   └── utils/          # 工具函数
└── app/types/          # 类型定义
```

#### 新结构
```
├── src/
│   ├── components/     # 组件目录
│   │   ├── ui/         # 基础 UI 组件
│   │   ├── shared/     # 共享组件
│   │   └── features/   # 功能组件
│   │       ├── auth/   # 认证相关
│   │       ├── dashboard/ # 仪表板组件
│   │       ├── orders/ # 订单相关
│   │       └── products/ # 产品相关
│   ├── lib/            # 核心库
│   │   ├── api/        # API 相关
│   │   ├── components/ # 通用业务组件
│   │   ├── hooks/      # 自定义 hooks
│   │   ├── providers/  # Context Providers
│   │   ├── utils/      # 工具函数
│   │   └── stores/     # 状态管理
│   └── types/          # 类型定义
```

### 2. 文件移动清单

#### 组件文件
- `components/ui/*` → `src/components/ui/*`
- `components/LoadingOverlay.tsx` → `src/components/shared/LoadingOverlay.tsx`
- `components/homepage/*` → `src/components/features/dashboard/*`
- `lib/components/*` → `src/lib/components/*`

#### 工具函数
- `lib/utils/*` → `src/lib/utils/*`
- `lib/utils.ts` → `src/lib/utils/utils.ts`
- `lib/iconMap.ts` → `src/lib/utils/iconMap.ts`

#### Hooks
- `hooks/*` → `src/lib/hooks/*`
- `lib/hooks/*` → `src/lib/hooks/*`

#### 类型定义
- `app/types/*` → `src/types/*`
- `app/models.ts` → `src/types/models.ts`

#### API 相关
- `lib/api-client.ts` → `src/lib/api/client.ts`
- `lib/api-utils.ts` → `src/lib/api/utils.ts`
- `lib/api-helper.ts` → `src/lib/api/helpers.ts`

#### Context Providers
- `lib/WorkspaceContext.tsx` → `src/lib/providers/WorkspaceContext.tsx`
- `lib/UserMenuContext.tsx` → `src/lib/providers/UserMenuContext.tsx`

## 导入路径更新

### 1. 组件导入

#### 更新前
```typescript
// UI 组件
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 自定义组件
import { StatsCards } from '@/components/homepage/StatsCards'
import { LoadingOverlay } from '@/components/LoadingOverlay'

// 通用组件
import { DatePicker } from '@/lib/components/DatePicker'
```

#### 更新后
```typescript
// UI 组件 (保持不变)
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 自定义组件 - 使用统一导入
import { StatsCards, LoadingOverlay } from '@/components'

// 或使用具体路径
import { StatsCards } from '@/components/features/dashboard/StatsCards'
import { LoadingOverlay } from '@/components/shared/LoadingOverlay'

// 通用组件
import { DatePicker } from '@/lib/components/DatePicker'
```

### 2. 工具函数导入

#### 更新前
```typescript
import { formatDate } from '@/lib/utils'
import { getIcon } from '@/lib/iconMap'
import { useCategoryFilter } from '@/lib/hooks/useCategoryFilter'
```

#### 更新后
```typescript
import { formatDate } from '@/utils'
import { getIcon } from '@/utils/iconMap'
import { useCategoryFilter } from '@/hooks/useCategoryFilter'
```

### 3. 类型定义导入

#### 更新前
```typescript
import { ProductStats } from '@/app/types/menuTypes'
import { ApiResponse } from '@/app/types/roleTypes'
```

#### 更新后
```typescript
import { ProductStats } from '@/types'
import { ApiResponse } from '@/types/api'
```

### 4. API 相关导入

#### 更新前
```typescript
import { fetchRemoteData } from '@/lib/api-utils'
import { apiClient } from '@/lib/api-client'
```

#### 更新后
```typescript
import { fetchRemoteData } from '@/api/utils'
import { apiClient } from '@/api/client'
```

### 5. Context Provider 导入

#### 更新前
```typescript
import { UserMenuProvider } from '@/lib/UserMenuContext'
import { WorkspaceProvider } from '@/lib/WorkspaceContext'
```

#### 更新后
```typescript
import { UserMenuProvider } from '@/providers/UserMenuContext'
import { WorkspaceProvider } from '@/providers/WorkspaceContext'
```

## 批量更新脚本

### 1. 使用 VS Code 查找替换

可以使用 VS Code 的全局查找替换功能来批量更新导入路径：

#### 查找和替换模式

**替换组件导入:**
```
查找: from '@/components/homepage/
替换为: from '@/components/features/dashboard/
```

**替换工具函数导入:**
```
查找: from '@/lib/utils/
替换为: from '@/utils/'
```

**替换 Hooks 导入:**
```
查找: from '@/lib/hooks/
替换为: from '@/hooks/'
```

**替换类型导入:**
```
查找: from '@/app/types/
替换为: from '@/types/'
```

### 2. 使用命令行工具

```bash
# 更新组件导入
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "@/components/homepage/|from "@/components/features/dashboard/|g'

# 更新工具函数导入
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "@/lib/utils/|from "@/utils/|g'

# 更新类型导入
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "@/app/types/|from "@/types/|g'
```

## 特殊情况处理

### 1. Next.js 页面组件

页面组件仍然在 `app/` 目录下，但需要更新导入路径：

```typescript
// app/dashboard/page.tsx
import { StatsCards } from '@/components/features/dashboard/StatsCards'
import { ProductStats } from '@/types'
```

### 2. 路由处理器

API 路由处理器需要更新导入路径：

```typescript
// app/api/users/route.ts
import { ApiResponse } from '@/types/api'
import { validateUser } from '@/utils/validation'
```

### 3. 配置文件

配置文件可能需要更新路径：

```typescript
// next.config.ts
// 如果引用了任何工具函数，需要更新路径
```

## 验证步骤

### 1. 编译检查

```bash
npm run build
# 或
npm run type-check
```

### 2. 开发服务器测试

```bash
npm run dev
```

### 3. 单元测试

```bash
npm run test
```

## 注意事项

### 1. 路径别名

确保 `tsconfig.json` 中的路径别名配置正确：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/lib/utils/*"],
      "@/hooks/*": ["./src/lib/hooks/*"],
      "@/api/*": ["./src/lib/api/*"],
      "@/providers/*": ["./src/lib/providers/*"]
    }
  }
}
```

### 2. ESLint 配置

如果使用了 ESLint，确保路径解析配置正确：

```javascript
// eslint.config.mjs
import { FlatCompat } from '@eslint/eslinjs-preset'

export default [
  {
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
]
```

### 3. 测试配置

更新测试配置以支持新的路径别名：

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/lib/utils'),
      '@/hooks': path.resolve(__dirname, './src/lib/hooks'),
      '@/api': path.resolve(__dirname, './src/lib/api'),
      '@/providers': path.resolve(__dirname, './src/lib/providers'),
    },
  },
})
```

## 回滚计划

如果在迁移过程中遇到问题，可以按以下步骤回滚：

1. **暂存当前更改**
```bash
git add .
git commit -m "feat: restructure project directories"
```

2. **如果遇到问题，回滚到之前状态**
```bash
git reset --hard HEAD~1
```

3. **重新应用更改**
```bash
git cherry-pick HEAD
```

## 常见问题

### Q: 找不到模块错误
**A**: 检查 `tsconfig.json` 中的路径别名配置，确保所有路径都正确映射。

### Q: 构建失败
**A**: 运行 `npm run build` 查看具体的错误信息，通常是某些导入路径没有正确更新。

### Q: 测试失败
**A**: 检查测试文件中的导入路径，确保它们使用了新的路径别名。

### Q: 开发服务器无法启动
**A**: 清除 `.next` 缓存文件夹：
```bash
rm -rf .next
npm run dev
```

## 总结

这次重构的主要目标是：

1. **提高组织性**: 按功能职责组织文件和目录
2. **简化导入**: 使用清晰的路径别名
3. **提高可维护性**: 统一的命名和结构规范
4. **增强可扩展性**: 便于添加新功能

按照本指南逐步更新导入路径，确保项目在新结构下正常运行。