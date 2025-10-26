/**
 * 菜单缓存调试工具
 * 用于开发和调试菜单缓存功能
 */

import { getCacheStats, getCachedRoles, clearAllMenuCache } from './menuCache';

/**
 * 在浏览器控制台中显示菜单缓存调试信息
 * 可以在开发时使用：menuCacheDebug()
 */
export function menuCacheDebug() {
    console.group('🍔 菜单缓存调试信息');

    try {
        const stats = getCacheStats();
        const cachedRoles = getCachedRoles();

        console.log('📊 缓存统计:', stats);
        console.log('👥 已缓存角色:', cachedRoles);

        // 显示每个角色的缓存详情
        cachedRoles.forEach(role => {
            const cacheKey = `user-menu-cache-${role}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                console.log(`📋 角色 "${role}" 缓存详情:`, {
                    用户角色: data.userRoles,
                    主角色: data.primaryRole,
                    缓存时间: new Date(data.timestamp).toLocaleString(),
                    过期时间: new Date(data.expiresAt).toLocaleString(),
                    是否过期: Date.now() > data.expiresAt,
                    菜单项数量: data.menuConfig?.navMain?.length || 0,
                    数据大小: `${(cached.length / 1024).toFixed(2)} KB`
                });
            }
        });

        // 检查用户角色存储
        const userRoles = localStorage.getItem('user-roles');
        if (userRoles) {
            const roles = JSON.parse(userRoles);
            console.log('🔐 当前用户角色:', roles);
        } else {
            console.warn('⚠️ 未找到用户角色信息');
        }

        // 检查组织信息存储
        const orgInfo = localStorage.getItem('current-organization');
        if (orgInfo) {
            const org = JSON.parse(orgInfo);
            console.log('🏢 当前组织信息:', {
                名称: org.name,
                哈希: org.nameHash,
                存储时间: new Date().toLocaleString()
            });
        }

        console.log('🛠️ 调试命令:');
        console.log('  - 清除所有缓存: clearMenuCache()');
        console.log('  - 显示缓存统计: showCacheStats()');
        console.log('  - 刷新菜单: refreshMenu()');

    } catch (error) {
        console.error('❌ 调试过程中出错:', error);
    }

    console.groupEnd();
}

/**
 * 清除所有菜单缓存的快捷函数
 */
export function clearMenuCache() {
    clearAllMenuCache();
    console.log('✅ 已清除所有菜单缓存');
}

/**
 * 显示缓存统计的快捷函数
 */
export function showCacheStats() {
    const stats = getCacheStats();
    console.log('📊 菜单缓存统计:', stats);
    return stats;
}

/**
 * 刷新当前用户菜单
 * 这个函数会在 UserMenuContext 中定义
 */
declare global {
    interface Window {
        refreshUserMenu?: () => void;
    }
}

export function refreshMenu() {
    if (window.refreshUserMenu) {
        window.refreshUserMenu();
        console.log('🔄 已刷新用户菜单');
    } else {
        console.warn('⚠️ 菜单刷新功能不可用，请确保在 UserMenuProvider 中注册');
    }
}

/**
 * 在开发环境中自动注册调试函数到全局
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.menuCacheDebug = menuCacheDebug;
    window.clearMenuCache = clearMenuCache;
    window.showCacheStats = showCacheStats;
    window.refreshMenu = refreshMenu;

    console.log('🔧 菜单缓存调试工具已加载到全局');
    console.log('使用方法:');
    console.log('  menuCacheDebug() - 显示完整调试信息');
    console.log('  clearMenuCache() - 清除所有缓存');
    console.log('  showCacheStats() - 显示缓存统计');
    console.log('  refreshMenu() - 刷新菜单');
}

// 类型声明，避免 TypeScript 错误
declare global {
    interface Window {
        menuCacheDebug?: typeof menuCacheDebug;
        clearMenuCache?: typeof clearMenuCache;
        showCacheStats?: typeof showCacheStats;
        refreshMenu?: typeof refreshMenu;
    }
}