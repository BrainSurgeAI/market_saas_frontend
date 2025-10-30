import { Button } from "@/components/ui/button";

interface ButtonProps {
    returnExchangeRecordsLength: number,
    tenantType: string,
    orderItemsSize: number,
    orderStatus: string,
    orderHandler: () => void,
    rejectOrCompleteHandler: () => void
}

/**
 * 客户角色下订单详情页面操作按钮
 * 
 * @param tenantType 租户类型
 * @param orderStatus 订单状态
 * @returns 是否显示按钮
 */
export default function CustomButton({ returnExchangeRecordsLength, tenantType, orderItemsSize, orderStatus, orderHandler, rejectOrCompleteHandler }: ButtonProps) {
    const styles = getStyles(orderStatus);
    const text = getText(orderStatus);

    return isDisplay(tenantType, orderStatus) && returnExchangeRecordsLength === orderItemsSize && (
        <Button
            variant="outline"
            size="sm"
            className={`h-8 px-2 text-xs flex items-center gap-1 text-white hover:text-white ${styles}`}
            onClick={orderStatus === 'STOCKED' ? orderHandler : rejectOrCompleteHandler}>
            {text}
        </Button>
    )
}

function isDisplay(tenantType: string, orderStatus: string) {
    // if (tenantType.toLowerCase() !== 'customer' || orderStatus === 'COMPLETED') {
    //     return false;
    // }

    // return true;
    if ((tenantType.toLowerCase() === 'customer' && orderStatus === 'CUSTOMER_INSPECTING') || (tenantType.toLowerCase() === 'market' && orderStatus === 'MARKET_INSPECTING')) {
        return true;
    } else {
        return false;
    }
}

function getStyles(orderStatus: string) {
    if (orderStatus === 'SUPPLIER_DELIVERING') {
        return 'bg-green-700 hover:bg-green-600';
    } else if (orderStatus === 'REJECTED') {
        return 'bg-blue-700 hover:bg-blue-600';
    } else if (orderStatus === 'AFTER_SALE') {
        return 'bg-red-700 hover:bg-red-600';
    } else {
        return 'bg-green-700 hover:bg-green-600';
    }
}

function getText(orderStatus: string) {
    if (orderStatus === 'MARKET_INSPECTING') {
        return '完成验收';
    } else if (orderStatus === 'AFTER_SALE') {
        return '拒绝供应商售后';
    } else {
        return '完成订单';
    }
}
