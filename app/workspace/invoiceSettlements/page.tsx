'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function InvoiceSettlements() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateSettlement = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/invoiceSettlements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                toast({
                    title: '成功',
                    description: '结算单已生成',
                    variant: 'default',
                });
            } else {
                throw new Error(result.error || '未知错误');
            }
        } catch (error) {
            console.error('生成结算单失败:', error);
            toast({
                title: '错误',
                description: '生成结算单失败，请稍后重试',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">结算单管理</h1>
            <Button 
                onClick={handleGenerateSettlement} 
                disabled={isLoading}
                className="flex items-center gap-2"
            >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                生成结算单
            </Button>
        </div>
    );
}