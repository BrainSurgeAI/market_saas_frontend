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
  onPriceChange: (productId: number, field: 'minPrice' | 'maxPrice', value: string) => void;
}

export default function PriceInputCell({
  productId,
  fieldName,
  value,
  placeholder,
  priceSource,
  status,
  onPriceChange
}: PriceInputCellProps) {
  // 只有在状态为 REJECTED 或者价格来源是历史且没有提交的情况下才可编辑
  const isEditable = status === 'REJECTED' || (priceSource === 'HISTORY') || Number(placeholder) === 0;
  
  // 检查是否处于拒绝状态，拒绝状态显示红色边框
  const isRejected = status === "REJECTED";
  
  // 根据编辑状态决定是否显示输入框或静态文本
  return (
    <TableCell className="w-[120px] text-xs font-mono">
      <Input
        type="number"
        step="0.01"
        min="0"
        max="9999.99"
        placeholder={placeholder}
        className={cn(
          "w-24 ml-auto text-xs font-mono",
          isRejected && "border-red-500 focus-visible:ring-red-500 focus-visible:left-offset-0",
          !isEditable && "bg-gray-50"
        )}
        style={isRejected ? { borderWidth: '1.5px' } : undefined}
        value={value}
        disabled={!isEditable}
        onChange={(e) => onPriceChange(productId, fieldName, e.target.value)}
        onClick={(e) => isEditable && e.currentTarget.select()}
      />
    </TableCell>
  );
}