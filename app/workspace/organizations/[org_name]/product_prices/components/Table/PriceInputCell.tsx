import { Input } from "@/components/ui/input";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface PriceInputCellProps {
  productId: number;
  fieldName: 'minPrice' | 'maxPrice';
  value: number | string;
  placeholder: string;
  priceSource: string;
  status: string;
  userRole?: string;
  onPriceChange: (productId: number, field: 'minPrice' | 'maxPrice', value: string) => void;
}

export default function PriceInputCell({
  productId,
  fieldName,
  value,
  placeholder,
  priceSource,
  status,
  userRole,
  onPriceChange
}: PriceInputCellProps) {
  // 只有PRICER角色才能编辑价格
  const canEditByRole = userRole === 'PRICER';

  // 基础编辑权限：根据不同状态决定是否可编辑
  // - PENDING状态：允许编辑（待审核产品可以修改价格）
  // - REJECTED状态：允许编辑（被拒绝的产品可以重新编辑价格）
  // - 或者价格来源是历史且没有占位符的情况下（新产品或历史价格）
  const isBasicEditable = status === 'PENDING' ||
                        status === 'REJECTED' ||
                        (priceSource === 'HISTORY') ||
                        Number(placeholder) === 0;

  // 最终编辑权限：基础权限 + 角色权限
  const isEditable = isBasicEditable && canEditByRole;

  // 检查是否处于拒绝状态，拒绝状态显示红色边框
  const isRejected = status === "REJECTED";

  return (
    <TableCell className="w-[120px] text-xs font-mono">
      {isEditable ? (
        <Input
          type="number"
          step="0.01"
          min="0"
          max="9999.99"
          placeholder={placeholder}
          className={cn(
            "w-24 ml-auto text-xs font-mono",
            isRejected && "border-red-500 focus-visible:ring-red-500 focus-visible:left-offset-0"
          )}
          style={isRejected ? { borderWidth: '1.5px' } : undefined}
          value={value}
          onChange={(e) => onPriceChange(productId, fieldName, e.target.value)}
          onClick={(e) => e.currentTarget.select()}
        />
      ) : (
        <div
          className={cn(
            "w-24 ml-auto text-xs font-mono px-3 py-2 text-right border rounded",
            isRejected && "border-red-500",
            !isRejected && "border-gray-200 bg-gray-50"
          )}
        >
          {value || placeholder || '-'}
        </div>
      )}
    </TableCell>
  );
}