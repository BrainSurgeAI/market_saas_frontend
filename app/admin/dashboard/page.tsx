import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { TokenPayload } from "@/app/models";
import AdminDashboardClient from "./client";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) {
    redirect('/admin/login');
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    
    if (!decoded.is_super_admin) {
      redirect('/login');
    }
    
    return <AdminDashboardClient token={token} />;
  } catch (error) {
    redirect('/admin/login');
  }
} 