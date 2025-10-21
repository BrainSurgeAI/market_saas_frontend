'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'

// 定义权限类型 - 添加大写版本
export type UserRole = 'PRICER' | 'AUDITOR' | 'ADMIN' | 'GUEST';

// 定义权限上下文接口
interface PermissionContextType {
  userRole: UserRole
  setUserRole: (role: UserRole) => void
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean
}

// 创建权限上下文
const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// 权限提供者组件
export function PermissionProvider({ 
  children,
  initialRole = 'GUEST'
}: { 
  children: ReactNode
  initialRole?: UserRole
}) {
  // 规范化初始角色
  const normalizedInitialRole = initialRole;
  const [userRole, setUserRole] = useState<UserRole>(normalizedInitialRole);
  
  // 添加调试日志
  useEffect(() => {
    console.log(`[PermissionContext] Initial role: ${initialRole}, Normalized: ${normalizedInitialRole}`);
  }, [initialRole, normalizedInitialRole]);

  // 检查用户是否有特定权限
  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    
    if (Array.isArray(requiredRole)) {
      // 规范化所有需要的角色
      const normalizedRequiredRoles = requiredRole.map(userRole => userRole.toUpperCase());
      const hasRole = normalizedRequiredRoles.includes(userRole);
      console.log(`[PermissionContext] Checking if ${userRole} is in [${normalizedRequiredRoles.join(', ')}]: ${hasRole}`);
      return hasRole;
    }
    
    // 规范化单个需要的角色
    const hasRole = userRole === requiredRole.toUpperCase();
    console.log(`[PermissionContext] Checking if ${userRole} === ${requiredRole}: ${hasRole}`);
    return hasRole;
  }

  return (
    <PermissionContext.Provider value={{ 
      userRole, 
      setUserRole: (role) => {
        setUserRole(role);
      }, 
      hasPermission 
    }}>
      {children}
    </PermissionContext.Provider>
  )
}

// 使用权限的钩子
export function usePermission() {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionProvider')
  }
  return context
}

// 权限保护组件
export function PermissionGate({ 
  children, 
  requiredRole 
}: { 
  children: ReactNode
  requiredRole: UserRole | UserRole[]
}) {
  const { hasPermission, userRole } = usePermission();
  console.log(`[PermissionGate] Current role: ${userRole}, Required role: ${JSON.stringify(requiredRole)}`);
  
  if (!hasPermission(requiredRole)) {
    console.warn(`[PermissionGate] Access denied: ${userRole} does not have permission for ${JSON.stringify(requiredRole)}`);
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">权限不足</h3>
          <p className="text-sm text-gray-600">您没有访问此内容的权限</p>
          <p className="text-xs text-gray-500 mt-1">当前角色: {userRole}, 需要角色: {Array.isArray(requiredRole) ? requiredRole.join(' 或 ') : requiredRole}</p>
        </div>
      </div>
    )
  }
  
  console.log(`[PermissionGate] Access granted: ${userRole} has permission for ${JSON.stringify(requiredRole)}`);
  return <>{children}</>
} 