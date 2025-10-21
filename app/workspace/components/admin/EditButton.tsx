import { Button } from "@/components/ui/button";
import { Pencil1Icon } from "@radix-ui/react-icons";

interface EditButtonProps {
    roles: string[];
    needRole: string;
    status?: string;
    isEditMode: boolean;
    onEdit: () => void;
}



export function EditButton({ roles, needRole, status, isEditMode, onEdit }: EditButtonProps) {
    const hasPermission = roles.some(role => role.includes(needRole));

    if (!hasPermission || isEditMode) {
        return null;
    }

    const isDisabled = status === 'SUBMITTED' || status === 'REJECTED';

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            disabled={isDisabled}
        >
            <Pencil1Icon className="h-4 w-4 mr-2" />
            编辑
        </Button>
    );
}