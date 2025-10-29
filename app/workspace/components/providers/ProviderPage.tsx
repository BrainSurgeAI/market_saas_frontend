"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package, Users, FileText } from "lucide-react";
import { Organization, User } from "@/app/models";

interface ProviderPageProps {
  user: User;
  organization: Organization;
  userRole: string[];
}

export default function ProviderPage({ user, organization, userRole }: ProviderPageProps) {
  const router = useRouter();

  // 调试日志
  console.log('ProviderPage props:', {
    user: user?.name,
    organization: organization?.name,
    organizationId: organization?.nameHash,
    userRole: userRole
  });

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">供应商工作台</h1>
          <p className="text-muted-foreground">欢迎，{organization?.name || "供应商"}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <h3 className="font-semibold">订单管理</h3>
            </div>
            <p className="text-sm text-muted-foreground">查看和处理订单</p>
            <Button
              onClick={() => router.push(`/workspace/providers/${organization?.nameHash}/orders`)}
              className="w-full"
            >
              进入订单管理
            </Button>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <h3 className="font-semibold">配送员工</h3>
            </div>
            <p className="text-sm text-muted-foreground">管理配送员工信息</p>
            <Button
              onClick={() => router.push(`/workspace/providers/${organization?.nameHash}/delivery_staffs`)}
              className="w-full"
            >
              管理配送员工
            </Button>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <h3 className="font-semibold">发票结算</h3>
            </div>
            <p className="text-sm text-muted-foreground">查看发票和结算信息</p>
            <Button
              onClick={() => router.push(`/workspace/providers/${organization?.nameHash}/invoiceSettlements`)}
              className="w-full"
            >
              查看结算
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}