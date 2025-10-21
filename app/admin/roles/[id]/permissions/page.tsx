import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { TokenPayload } from "@/app/models";
import { fetchRemoteData } from "@/lib/api-utils";
import RolePermissionsClient from "@/app/admin/roles/[id]/permissions/client";

export default async function RolePermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      redirect('/admin/login');
    }

    const decoded = jwtDecode<TokenPayload>(token);

    if (!decoded.is_super_admin) {
      redirect('/login');
    }

    const id = (await params).id;
    const roleResponse = await fetchRemoteData({
      endpoint: `/roles/${id}`,
      method: 'GET'
    });

    if (!roleResponse.success) {
      throw new Error('Failed to fetch role info');
    }

    const role = roleResponse.data.data;

    return <RolePermissionsClient token={token} role={role} roleId={id} />;
  } catch (error) {
    console.error('Authentication error:', error);
    redirect('/admin/login');
  }
} 