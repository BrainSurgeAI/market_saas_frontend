import { TenantCredit } from '@/app/models';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useWorkspace } from '@/lib/WorkspaceContext';

 
import { useState, useEffect } from 'react';

interface CreditInfoCardProps {
    organizationNameHash: string | undefined;
}

export function CreditInfoCard({ organizationNameHash }: CreditInfoCardProps) {
    const [creditInfo, setCreditInfo] = useState<TenantCredit | null>(null);
    const { user } = useWorkspace();
    const isAdmin = true;

    const fetchCreditInfo = async () => {
        if (!organizationNameHash) return;
        
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/tenants/${organizationNameHash}/financials`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (response.ok && data.code === 200) {
                setCreditInfo(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch credit info:', error);
        }
    };

    useEffect(() => {
        // only admin can see the credit info
        if (isAdmin) {
            fetchCreditInfo();
        }
    }, [organizationNameHash]);

    // if not admin, not show the component
    if (!isAdmin) {
        return null;
    }

    return (
        <Card className="w-full rounded-xl bg-muted/50 mt-4">
            <CardHeader>
                <CardTitle>信用信息</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div className="gap-1">
                        <div className="flex items-center gap-1">
                            <Label className="text-muted-foreground text-xs">信用评分</Label>
                            {/* <HoverCard>
                                <HoverCardTrigger>
                                    <QuestionMarkCircledIcon className="h-4 w-4 text-muted-foreground hover:text-gray-900 cursor-help" />
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80 bg-white border rounded-md shadow-lg p-3">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            范围为0-10分，评分越高表示信用越好。评分由系统根据客户评价、历史交易记录等多个维度自动计算得出。
                                        </p>
                                    </div>
                                </HoverCardContent>
                            </HoverCard> */}
                        </div>
                        <p className="font-medium text-xs mt-1">
                            {creditInfo?.credit_score ?? '-'}
                        </p>
                    </div>
                    <div>
                        <Label className="text-muted-foreground text-xs">信用额度</Label>
                        <p className="text-lg font-medium text-xs">
                            {creditInfo?.credit_limit ? `¥${creditInfo.credit_limit.toLocaleString()}` : '-'}
                        </p>
                    </div>
                    <div>
                        <Label className="text-muted-foreground text-xs">保证金</Label>
                        <p className="text-lg font-medium text-xs">
                            {creditInfo?.deposit_amount ? `¥${creditInfo.deposit_amount.toLocaleString()}` : '-'}
                        </p>
                    </div>
                    <div>
                        <Label className="text-muted-foreground text-xs">账期（天）</Label>
                        <p className="text-lg font-medium text-xs">
                            {creditInfo?.payment_period_days ?? '-'}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}