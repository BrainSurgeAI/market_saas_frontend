'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Organization } from '@/app/models';
import { MenuItem } from '@/lib/menu';
import { getNavData, getUserMenuConfig } from '@/lib/menu';
import { useWorkspace } from '@/lib/WorkspaceContext';

interface UserMenuContextType {
    navData: {
        teams: any[];
        navMain: MenuItem[];
        projects: any[];
    } | null;
    isLoading: boolean;
    error: string | null;
    refreshMenu: () => void;
    userRoles: string[];
    primaryRole: string;
}

const UserMenuContext = createContext<UserMenuContextType | undefined>(undefined);

export function UserMenuProvider({ children }: { children: React.ReactNode }) {
    const { user, organization: workspaceOrg } = useWorkspace(); // 获取 workspace 中的用户和组织信息
    const [navData, setNavData] = useState<UserMenuContextType['navData']>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [primaryRole, setPrimaryRole] = useState<string>('');
    const [organization, setOrganization] = useState<Organization | null>(null);
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    console.log('🏢 UserMenuProvider 初始化:', { user, workspaceOrg });

    // 防抖的菜单刷新函数
    const refreshMenu = useCallback(async () => {
        if (!organization) return;

        // 清除之前的定时器
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = null;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 从localStorage获取用户角色
            const storedRoles = localStorage.getItem('user-roles');
            const roles = storedRoles ? JSON.parse(storedRoles) : [];

            if (roles.length === 0) {
                setError('用户角色信息不存在');
                setIsLoading(false);
                return;
            }

            // 只有当角色真正发生变化时才更新state
            const currentRolesStr = JSON.stringify(userRoles.sort());
            const newRolesStr = JSON.stringify(roles.sort());

            if (currentRolesStr !== newRolesStr) {
                setUserRoles(roles);
            }

            const data = await getNavData(organization, roles);
            setNavData(data);

            // 获取并设置主角色
            try {
                const userMenuConfig = await getUserMenuConfig();
                if (userMenuConfig?.primaryRole) {
                    setPrimaryRole(userMenuConfig.primaryRole);
                } else if (roles.length > 0) {
                    // 如果没有从API获取到主角色，使用第一个角色作为主角色
                    setPrimaryRole(roles[0]);
                }
            } catch (error) {
                console.error('获取主角色失败:', error);
                // 设置默认主角色
                if (roles.length > 0) {
                    setPrimaryRole(roles[0]);
                }
            }

            setIsLoading(false);
        } catch (err) {
            console.error('刷新菜单失败:', err);
            setError('刷新菜单失败');
            setIsLoading(false);
        }
    }, [organization, userRoles]); // 依赖项

    // 注册全局刷新函数（用于调试）
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.refreshUserMenu = () => {
                console.log('通过全局函数刷新菜单');
                refreshMenu();
            };
        }

        return () => {
            if (typeof window !== 'undefined') {
                delete window.refreshUserMenu;
            }
        };
    }, [refreshMenu]);

    useEffect(() => {
        // 监听组织信息变化
        const handleOrganizationChange = () => {
            let org = null;

            // 优先使用 workspace 中的组织信息
            if (workspaceOrg) {
                org = workspaceOrg;
                console.log('🏢 使用 workspace 中的组织信息:', org);
            } else {
                // 回退到 localStorage
                const storedOrg = localStorage.getItem('current-organization');
                if (storedOrg) {
                    try {
                        org = JSON.parse(storedOrg);
                        console.log('💾 使用 localStorage 中的组织信息:', org);
                    } catch (error) {
                        console.error('解析组织信息失败:', error);
                    }
                }
            }

            setOrganization(org);
        };

        // 监听用户角色变化
        const handleRolesChange = () => {
            let roles = [];

            // 优先使用 workspace 中的用户角色信息
            if (user && user.role) {
                roles = [user.role];
                console.log('👤 使用 workspace 中的用户角色:', roles);
                // 同时更新 localStorage
                localStorage.setItem('user-roles', JSON.stringify(roles));
            } else {
                // 回退到 localStorage
                const storedRoles = localStorage.getItem('user-roles');
                if (storedRoles) {
                    try {
                        roles = JSON.parse(storedRoles);
                        console.log('💾 使用 localStorage 中的用户角色:', roles);
                    } catch (error) {
                        console.error('解析用户角色失败:', error);
                    }
                }
            }

            setUserRoles(roles);
        };

        // 初始化
        handleOrganizationChange();
        handleRolesChange();

        // 监听storage事件
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'current-organization') {
                handleOrganizationChange();
            } else if (e.key === 'user-roles') {
                handleRolesChange();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [user, workspaceOrg]); // 依赖用户和workspace组织信息

    useEffect(() => {
        if (organization && userRoles.length > 0) {
            refreshMenu();
        }
    }, [organization, userRoles]); // organization和userRoles变化时都触发

    const value: UserMenuContextType = {
        navData,
        isLoading,
        error,
        refreshMenu,
        userRoles,
        primaryRole,
    };

    return (
        <UserMenuContext.Provider value={value}>
            {children}
        </UserMenuContext.Provider>
    );
}

export function useUserMenu() {
    const context = useContext(UserMenuContext);
    if (context === undefined) {
        throw new Error('useUserMenu must be used within a UserMenuProvider');
    }
    return context;
}