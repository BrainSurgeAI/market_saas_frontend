import { Badge } from "@/components/ui/badge";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface StatusBarProps {
    status: string | null;
    priceSource: string;
    saveStatus: string;
    draftStatus: boolean;
    getStatusStyle: (status: string) => string;
    getStatusText: (status: string) => string;
    productId: number;
    onSave?: (productId: number) => void;
    hasChanges?: boolean;
}

export default function StatusCell({ 
    status, 
    priceSource,
    saveStatus, 
    draftStatus, 
    getStatusStyle, 
    getStatusText,
    productId,
    onSave,
    hasChanges = false
}: StatusBarProps) {
    // 判断是否显示保存按钮
    // 只有在状态为 REJECTED 或者价格来源是历史或者状态为null/undefined时，才显示保存按钮
    console.log(status);
    const isEditable = status === 'REJECTED' || (priceSource === 'HISTORY') || status === null || status === undefined;
    const showSaveButton = isEditable && (hasChanges || !draftStatus);
    
    // 处理保存按钮点击
    const handleSaveClick = () => {
        if (onSave) {
            onSave(productId);
        }
    };

    // 检查是否显示状态标签
    // 当有状态且不可编辑时显示状态标签
    const showStatusBadge = status !== null && status !== undefined && status !== '' && !isEditable;

    return (
        <TableCell className="w-[80px] text-right text-xs">
            {showSaveButton ? (
                // 显示保存按钮
                <Button 
                    size="sm" 
                    onClick={handleSaveClick}
                >
                    <Save className="h-4 w-4" />
                </Button>
            ) : showStatusBadge ? (
                // 显示状态标签 - 包括 PENDING, APPROVED, PUBLISHED 等状态
                <Badge variant="outline" className={`status-badge text-xs ${getStatusStyle(status)}`}>
                    {getStatusText(status)}
                </Badge>
            ) : saveStatus === "success" ? (
                // 保存成功状态 - 显示为待审核
                <Badge variant="outline" className="status-badge text-xs text-amber-500 border-amber-500 bg-amber-50">
                    待审核
                </Badge>
            ) : draftStatus ? (
                // 已保存到本地
                <Badge variant="outline" className="text-xs text-gray-500 border-gray-500">
                    已保存
                </Badge>
            ) : (
                ''
            )}
        </TableCell>
    )
}