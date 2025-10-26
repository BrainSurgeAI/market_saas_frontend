/**
 * 菜单缓存管理工具
 * 用于缓存和获取用户菜单数据，避免每次页面刷新都重新请求
 */

interface CachedMenuData {
  primaryRole: string;
  userRoles: string[];
  menuConfig: {
    teams: any[];
    navMain: any[];
    projects: any[];
  };
  timestamp: number;
  expiresAt: number;
}

interface CacheStorageOptions {
  /**
   * 缓存过期时间（毫秒），默认 24 小时
   */
  expiresIn?: number;
  /**
   * 是否启用缓存，默认 true
   */
  enabled?: boolean;
}

const CACHE_KEY_PREFIX = 'user-menu-cache';
const DEFAULT_EXPIRES_IN = 24 * 60 * 60 * 1000; // 24小时

/**
 * 生成缓存键
 */
function getCacheKey(primaryRole: string): string {
  return `${CACHE_KEY_PREFIX}-${primaryRole}`;
}

/**
 * 检查缓存是否过期
 */
function isCacheExpired(cachedData: CachedMenuData): boolean {
  return Date.now() > cachedData.expiresAt;
}

/**
 * 存储菜单到本地缓存
 */
export function setMenuCache(
  primaryRole: string,
  menuData: Omit<CachedMenuData, 'timestamp' | 'expiresAt'>,
  options: CacheStorageOptions = {}
): void {
  const { enabled = true, expiresIn = DEFAULT_EXPIRES_IN } = options;

  if (!enabled) {
    console.log('菜单缓存已禁用，跳过存储');
    return;
  }

  try {
    const cacheData: CachedMenuData = {
      ...menuData,
      timestamp: Date.now(),
      expiresAt: Date.now() + expiresIn,
    };

    const cacheKey = getCacheKey(primaryRole);
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));

    console.log(`菜单已缓存 - 角色: ${primaryRole}, 过期时间: ${new Date(cacheData.expiresAt).toLocaleString()}`);
  } catch (error) {
    console.error('存储菜单缓存失败:', error);
  }
}

/**
 * 从本地缓存获取菜单
 */
export function getMenuCache(primaryRole: string): CachedMenuData | null {
  try {
    const cacheKey = getCacheKey(primaryRole);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      console.log(`未找到角色 ${primaryRole} 的菜单缓存`);
      return null;
    }

    const cachedData: CachedMenuData = JSON.parse(cached);

    // 检查缓存是否过期
    if (isCacheExpired(cachedData)) {
      console.log(`角色 ${primaryRole} 的菜单缓存已过期`);
      removeMenuCache(primaryRole);
      return null;
    }

    console.log(`使用角色 ${primaryRole} 的菜单缓存 - 缓存时间: ${new Date(cachedData.timestamp).toLocaleString()}`);
    return cachedData;
  } catch (error) {
    console.error('读取菜单缓存失败:', error);
    return null;
  }
}

/**
 * 移除指定角色的菜单缓存
 */
export function removeMenuCache(primaryRole: string): void {
  try {
    const cacheKey = getCacheKey(primaryRole);
    localStorage.removeItem(cacheKey);
    console.log(`已移除角色 ${primaryRole} 的菜单缓存`);
  } catch (error) {
    console.error('移除菜单缓存失败:', error);
  }
}

/**
 * 清除所有菜单缓存
 */
export function clearAllMenuCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('已清除所有菜单缓存');
  } catch (error) {
    console.error('清除菜单缓存失败:', error);
  }
}

/**
 * 获取所有已缓存的角色
 */
export function getCachedRoles(): string[] {
  try {
    const keys = Object.keys(localStorage);
    const roles: string[] = [];

    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        const role = key.replace(`${CACHE_KEY_PREFIX}-`, '');
        roles.push(role);
      }
    });

    return roles;
  } catch (error) {
    console.error('获取已缓存角色失败:', error);
    return [];
  }
}

/**
 * 检查是否有指定角色的缓存
 */
export function hasMenuCache(primaryRole: string): boolean {
  const cachedData = getMenuCache(primaryRole);
  return cachedData !== null;
}

/**
 * 在用户登录成功后调用此函数来存储菜单
 * 建议在登录组件或登录成功后的回调中调用
 */
export async function cacheMenuAfterLogin(
  primaryRole: string,
  userRoles: string[],
  fetchMenuFn: () => Promise<any>,
  options?: CacheStorageOptions
): Promise<boolean> {
  try {
    console.log('登录成功，开始缓存菜单数据...');

    // 获取菜单数据
    const menuData = await fetchMenuFn();

    if (menuData) {
      setMenuCache(primaryRole, {
        primaryRole,
        userRoles,
        menuConfig: menuData.menuConfig || {
          teams: [],
          navMain: [],
          projects: []
        }
      }, options);

      console.log('菜单数据缓存成功');
      return true;
    } else {
      console.warn('获取菜单数据为空，跳过缓存');
      return false;
    }
  } catch (error) {
    console.error('登录后缓存菜单失败:', error);
    return false;
  }
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): {
  totalCached: number;
  cachedRoles: string[];
  totalSize: number;
} {
  try {
    const cachedRoles = getCachedRoles();
    let totalSize = 0;

    cachedRoles.forEach(role => {
      const cacheKey = getCacheKey(role);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        totalSize += cached.length;
      }
    });

    return {
      totalCached: cachedRoles.length,
      cachedRoles,
      totalSize
    };
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    return {
      totalCached: 0,
      cachedRoles: [],
      totalSize: 0
    };
  }
}