import { AdminLoginForm } from '@/app/admin/login/admin-login-form';

export const metadata = {
  title: '超级管理员登录 | 您的应用名称',
  description: '超级管理员安全登录入口',
}

export default function AdminLoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <AdminLoginForm />
      </div>
    </div>
  )
}