/**
 * 认证相关类型定义
 */

import type { Organization } from './'

// 用户角色枚举
export type UserRole =
  | 'super_admin'
  | 'market_admin'
  | 'pricer'
  | 'auditor'
  | 'order_creator'
  | 'order_publisher'
  | 'provider_admin'
  | 'provider'
  | 'guest'

// 认证状态枚举
export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error'

// 用户基本信息
export interface User {
  id: string
  username: string
  email?: string
  firstName?: string
  lastName?: string
  avatar?: string
  phone?: string
  roles: UserRole[]
  profile?: UserProfile
  preferences?: UserPreferences
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

// 用户详细信息
export interface UserProfile {
  id: string
  userId: string
  organizationId?: string
  department?: string
  position?: string
  bio?: string
  location?: string
  website?: string
  socialLinks?: SocialLinks
  settings?: UserSettings
}

// 社交链接
export interface SocialLinks {
  linkedin?: string
  github?: string
  twitter?: string
  facebook?: string
}

// 用户偏好设置
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  currency: string
  notifications: NotificationPreferences
  privacy: PrivacyPreferences
}

// 通知偏好
export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  desktop: boolean
  orderUpdates: boolean
  priceChanges: boolean
  systemUpdates: boolean
  marketingEmails: boolean
}

// 隐私偏好
export interface PrivacyPreferences {
  profileVisibility: 'public' | 'organization' | 'private'
  showEmail: boolean
  showPhone: boolean
  showLocation: boolean
  allowDirectMessages: boolean
}

// 用户设置
export interface UserSettings {
  enableTwoFactor: boolean
  sessionTimeout: number
  autoLogout: boolean
  passwordChangeRequired: boolean
  lastPasswordChange?: string
}

// 登录凭据
export interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
  captchaToken?: string
}

// 注册信息
export interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
  firstName?: string
  lastName?: string
  phone?: string
  organization?: string
  acceptTerms: boolean
  subscribeNewsletter?: boolean
  captchaToken?: string
}

// 认证令牌
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
  scope?: string[]
}

// 登录响应
export interface LoginResponse {
  user: User
  tokens: AuthTokens
  permissions: string[]
  organizations?: Organization[]
}

// 注册响应
export interface RegisterResponse {
  user: User
  message: string
  requiresEmailVerification: boolean
  requiresPhoneVerification: boolean
}

// 密码重置请求
export interface PasswordResetRequest {
  email: string
  captchaToken?: string
}

// 密码重置确认
export interface PasswordResetConfirm {
  token: string
  newPassword: string
  confirmPassword: string
}

// 密码更改请求
export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// 用户更新请求
export interface UserUpdateRequest {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  bio?: string
  location?: string
  website?: string
  socialLinks?: SocialLinks
}

// 认证上下文状态
export interface AuthState {
  status: AuthStatus
  user: User | null
  tokens: AuthTokens | null
  permissions: string[]
  organizations: Organization[]
  currentOrganization: Organization | null
  error: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

// 认证上下文操作
export interface AuthActions {
  // 认证操作
  login: (credentials: LoginCredentials) => Promise<LoginResponse>
  register: (data: RegisterData) => Promise<RegisterResponse>
  logout: () => Promise<void>
  refreshToken: () => Promise<AuthTokens>

  // 用户操作
  updateProfile: (data: UserUpdateRequest) => Promise<User>
  changePassword: (data: PasswordChangeRequest) => Promise<void>

  // 组织操作
  switchOrganization: (organizationId: string) => Promise<void>

  // 状态操作
  clearError: () => void
  setLoading: (loading: boolean) => void
  checkAuth: () => Promise<boolean>
}

// 会话信息
export interface SessionInfo {
  id: string
  userId: string
  tokenType: string
  createdAt: string
  expiresAt: string
  ipAddress: string
  userAgent: string
  isActive: boolean
  lastActivity: string
}

// 权限检查类型
export type PermissionCheck = (permission: string) => boolean
export type RoleCheck = (role: UserRole) => boolean
export type AnyRoleCheck = (roles: UserRole[]) => boolean

// 安全相关类型
export interface SecuritySettings {
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSymbols: boolean
  sessionTimeoutMinutes: number
  maxLoginAttempts: number
  lockoutDurationMinutes: number
  enableTwoFactor: boolean
  requiredTwoFactorRoles: UserRole[]
}

// 登录历史
export interface LoginHistory {
  id: string
  userId: string
  loginTime: string
  logoutTime?: string
  ipAddress: string
  userAgent: string
  location?: {
    country?: string
    city?: string
  }
  status: 'success' | 'failed' | 'suspended'
  failureReason?: string
}

// 多因素认证
export interface TwoFactorSetup {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export interface TwoFactorVerify {
  code: string
  backupCode?: string
}

// API 权限
export interface ApiPermission {
  resource: string
  action: string
  conditions?: Record<string, any>
}

// 权限检查结果
export interface PermissionResult {
  granted: boolean
  reason?: string
  conditions?: Record<string, any>
}