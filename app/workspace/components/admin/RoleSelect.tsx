import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";

import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Role } from "@/app/models";
import { useWorkspace } from "@/lib/WorkspaceContext";

interface RoleSelectProps {
    id?: string;
    label?: string;
    value: number;
    onChange: (value: number) => void;
    required?: boolean;
    className?: string;
}

export function RoleSelect({
    id = "role",
    label = "角色",
    value,
    onChange,
    required = false,
    className = "w-full p-2 border rounded-md dark:text-black dark:bg-white"
}: RoleSelectProps) {
    const router = useRouter();
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
   // const { organization } = useContext(WorkspaceContext);
    const {  organization: organizationContext } = useWorkspace();
    useEffect(() => {   
        const token = localStorage.getItem('token');
        if (!token) {
            toast({
                variant: 'destructive',
                title: '签名已失效',
                description: '请重新登录',
            })  
            router.push('/login');
            return;
        }

        if (!organizationContext) {
            setError('Organization not found');
            return;
        }

        // apiClient.getRoles(organizationContext.name_hash, organizationContext.tenant_type, token)
        //     .then((response) => {
        //         if (response.code === 200) {
        //             setRoles(response.data ?? []);
        //         } else {
        //             setError(response.message || 'Failed to fetch roles');
        //         }
        //     })
        //     .catch((error) => {
        //         setError('Failed to fetch roles');
        //         console.error('Failed to fetch roles:', error);
        //     })
        //     .finally(() => {
        //         setIsLoading(false);
        //     });
    }, [ organizationContext]);

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Label htmlFor={id}>{label}</Label>
                <select disabled className={className}>
                    <option>加载中...</option>
                </select>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-2">
                <Label htmlFor={id}>{label}</Label>
                <select disabled className={className}>
                    <option>加载失败</option>
                </select>
                <p className="text-sm text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <select
                id={id}
                className={className}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                required={required}
            >
                <option value="">请选择角色</option>
                {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                        {role.alias_name}
                    </option>
                ))}
            </select>
        </div>
    );
}