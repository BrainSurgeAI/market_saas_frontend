import { jwtDecode } from 'jwt-decode';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface TokenPayload {
  exp: number;
  permissions: string[];
  roles: string[];
  username: string;
  tenant_name: string;
  is_super_admin: boolean;
  role: string;
}

// 定义需要权限的路由规则
const protectedRoutes = [
  {
    path: '/workspace/organizations/[org_name]/product_prices',
    roles: ['PRICER', 'AUDITOR']
  },
  {
    path: '/workspace/invoiceSettlements',
    roles: ['MARKET_ADMIN']
  }
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是受保护的路由
  const isProtectedRoute = protectedRoutes.some(route => {
    // 将路由模式转换为正则表达式
    const pattern = new RegExp(
      '^' + route.path.replace(/\[.*?\]/g, '[^/]+') + '($|/.*$)'
    );
    return pattern.test(pathname);
  });

  if (isProtectedRoute) {
    // 获取令牌
    const token = request.cookies.get('auth-token')?.value;

    // 如果没有令牌，重定向到登录页面
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // 解码令牌
      const decoded = jwtDecode<TokenPayload>(token);
      
      // 检查令牌是否过期
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        // 令牌已过期，重定向到登录页面
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // 查找匹配的路由规则
      const matchedRoute = protectedRoutes.find(route => {
        const pattern = new RegExp(
          '^' + route.path.replace(/\[.*?\]/g, '[^/]+') + '($|/.*$)'
        );
        return pattern.test(pathname);
      });

      // 检查用户角色是否有权限访问
      if (matchedRoute) {
        // 将用户角色转换为大写和小写形式进行比较
        const hasPermission = decoded.roles.some(role => 
          matchedRoute.roles.includes(role) || 
          matchedRoute.roles.includes(role.toUpperCase()) || 
          matchedRoute.roles.includes(role.toLowerCase())
        );
        
        if (!hasPermission) {
          // 用户没有权限，返回403页面
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }

      // 将用户角色添加到请求头中，以便在服务器组件中使用
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-role', decoded.role);

      // 继续处理请求
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      // 令牌无效，重定向到登录页面
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 对于非受保护的路由，继续处理请求
  return NextResponse.next();
}

// 配置中间件匹配的路由
export const config = {
  matcher: [
    // 匹配所有工作区路由
    '/workspace/:path*',
    // 排除静态文件和API路由
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};