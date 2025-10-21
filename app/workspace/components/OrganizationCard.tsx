import { Organization } from '@/app/models';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

import { EditButton } from './admin/EditButton';
import { ApiError, handleApiError } from '@/lib/api-client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface OrganizationCardProps {
    organization: Organization | null;
    isEditMode: boolean;
    setIsEditMode: (value: boolean) => void;
}

const organizationSchema = z.object({
    address: z.string()
        .min(2, '地址长度至少2个字符')
        .max(32, '地址长度不能超过32个字符'),
    business_scope: z.string()
        .min(2, '经营范围长度至少2个字符')
        .max(32, '经营范围长度不能超过32个字符')
});

export function OrganizationCard({
    organization: org,
    isEditMode,
    setIsEditMode
}: OrganizationCardProps) {
    const { toast } = useToast();

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingData, setPendingData] = useState<z.infer<typeof organizationSchema> | null>(null);

    const form = useForm<z.infer<typeof organizationSchema>>({
        resolver: zodResolver(organizationSchema),
        defaultValues: {
            address: org?.address || "",
            business_scope: org?.businessScope || "",
        },
    });

    useEffect(() => {
        if (org) {
            form.reset({
                address: org.address || '',
                business_scope: org.businessScope || '',
            });
        }
    }, [org, form]);

    const handleSubmit = async (data: z.infer<typeof organizationSchema>) => {
        setPendingData(data);
        setShowConfirmDialog(true);
    };
    
    const handleConfirmedSubmit = async () => {
        try {
            //if (!isAuthenticated() || !org || !pendingData) return;

            // const response = await apiClient.updateOrganization(org.name_hash, pendingData);
            // if (response.code === 200) {
            //     toast({
            //         variant: "success",
            //         description: response.message,
            //     });
            //     setIsEditMode(false);
            //     setShowConfirmDialog(false);
            // }
        } catch (error) {
            handleApiError(error as ApiError, toast);
        }
    };

    return (
        <>
        <Card className="w-full rounded-xl bg-muted/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>
                        {isEditMode ? "编辑组织信息" : org?.name}
                    </CardTitle>
                    <EditButton 
                        roles={[]} 
                        needRole="ADMIN" 
                        status={org?.status} 
                        isEditMode={isEditMode} 
                        onEdit={() => setIsEditMode(true)} 
                    />
                </div>
            </CardHeader>
            <CardContent>
                {isEditMode ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)}>
                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="text-xs">组织地址*</Label>
                                        <Input
                                            id="address"
                                            {...form.register('address')}
                                        />
                                        {form.formState.errors.address && (
                                            <p className="text-xs text-destructive">
                                                {form.formState.errors.address.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="business_scope" className="text-xs">经营范围*</Label>
                                        <Input
                                            id="business_scope"
                                            {...form.register('business_scope')}
                                        />
                                        {form.formState.errors.business_scope && (
                                            <p className="text-xs text-destructive">
                                                {form.formState.errors.business_scope.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => setIsEditMode(false)}
                                        type="button"
                                    >
                                        取消
                                    </Button>
                                    <Button size="sm" type="submit">
                                        保存
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-4 text-xs">
                                <p><Label className="text-xs">地址:</Label> {org?.address}</p>
                                <p><Label className="text-xs">经营范围:</Label> {org?.businessScope}</p>
                                <p className="text-xs text-muted-foreground">
                                    <Label className="text-xs">创建时间:</Label> {
                                        org?.createdAt ? new Date(org.createdAt).toLocaleString() : ''
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
        
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>确认修改组织信息</AlertDialogTitle>
                <AlertDialogDescription>
                    修改组织信息后，需要重新进行审核。在审核通过之前，部分功能将被限制使用。
                    确定要继续吗？
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmedSubmit}>
                    确认修改
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
        </>
    );
}