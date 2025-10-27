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
    userRole?: string;
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
    userRole,
    onSave,
    hasChanges = false
}: StatusBarProps) {
    // 只有PRICER角色才能保存价格
    const canSaveByRole = userRole === 'PRICER';

    // 基础编辑权限：根据不同状态决定是否可保存
    // - PENDING状态：允许保存（待审核产品可以保存修改后的价格）
    // - REJECTED状态：允许保存（被拒绝的产品可以保存重新编辑的价格）
    // - 或者价格来源是历史或者状态为null/undefined时（新产品）
    const isBasicEditable = status === 'PENDING' ||
                        status === 'REJECTED' ||
                        (priceSource === 'HISTORY') ||
                        status === null || status === undefined;

    // 最终保存权限：基础权限 + 角色权限 + 有修改或未保存状态
    // 只要有修改就显示保存按钮，不管draftStatus如何
    const showSaveButton = isBasicEditable && canSaveByRole && hasChanges;

    // 调试信息
    console.log('StatusCell Debug:', {
        productId,
        status,
        priceSource,
        userRole,
        canSaveByRole,
        isBasicEditable,
        hasChanges,
        showSaveButton,
        draftStatus
    });

    // 处理保存按钮点击
    const handleSaveClick = () => {
        if (onSave) {
            onSave(productId);
        }
    };

    // 检查是否显示状态标签
    // 当有状态且基础不可编辑时显示状态标签
    const showStatusBadge = status !== null && status !== undefined && status !== '' && !isBasicEditable;

    return (
        <TableCell className="w-[80px] text-right text-xs">
            {showSaveButton ? (
                // 显示保存按钮
                <Button
                    size="sm"
                    onClick={handleSaveClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
                <div className="text-xs text-gray-400">-</div>
            )}
        </TableCell>
    )
}