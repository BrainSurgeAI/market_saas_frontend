import { Button } from "@/components/ui/button";
import { OrderStatus, TenantType } from "@/lib/types/orderStatus";

interface ButtonProps {
    returnExchangeRecordsLength: number,
    tenantType: string,
    orderItemsSize: number,
    orderStatus: string,
    orderHandler: () => void,
    rejectOrCompleteHandler: () => void
}

/**
 * 租户角色下订单详情页面操作按钮
 *
 * @param tenantType 租户类型
 * @param orderStatus 订单状态
 * @returns 是否显示按钮
 */
export default function CustomButton({ returnExchangeRecordsLength, tenantType, orderItemsSize, orderStatus, orderHandler, rejectOrCompleteHandler }: ButtonProps) {
    const styles = getStyles(orderStatus);
    const text = getText(orderStatus);

    const status = orderStatus as OrderStatus;
    const tenantLower = tenantType.toLowerCase() as TenantType;

    const requireAllProcessed = [
        OrderStatus.MARKET_INSPECTING,
        OrderStatus.EXCHANGE_INSPECTING,
        OrderStatus.CUSTOMER_INSPECTING,
    ].includes(status);

    const allProductsProcessed = !requireAllProcessed || (returnExchangeRecordsLength === orderItemsSize && returnExchangeRecordsLength > 0);

    if (!isDisplay(tenantLower, status) || !allProductsProcessed) {
        return null;
    }

    const handleClick = [OrderStatus.MARKET_INSPECTING, OrderStatus.EXCHANGE_INSPECTING, OrderStatus.CUSTOMER_INSPECTING].includes(status)
        ? orderHandler
        : rejectOrCompleteHandler;

    return (
        <Button
            variant="outline"
            size="sm"
            className={`h-8 px-2 text-xs flex items-center gap-1 text-white hover:text-white ${styles}`}
            onClick={handleClick}>
            {text}
        </Button>
    );
}

function isDisplay(tenantType: TenantType, orderStatus: OrderStatus) {
    if (tenantType === TenantType.MARKET) {
        return [OrderStatus.MARKET_INSPECTING, OrderStatus.EXCHANGE_INSPECTING].includes(orderStatus);
    }

    if (tenantType === TenantType.CUSTOMER) {
        return [OrderStatus.CUSTOMER_INSPECTING, OrderStatus.RETURN_REQUESTED].includes(orderStatus);
    }

    return false;
}

function getStyles(orderStatus: string) {
    const status = orderStatus as OrderStatus;

    if (status === OrderStatus.RETURN_REQUESTED) {
        return 'bg-red-700 hover:bg-red-600';
    }

    if ([OrderStatus.MARKET_INSPECTING, OrderStatus.EXCHANGE_INSPECTING, OrderStatus.CUSTOMER_INSPECTING].includes(status)) {
        return 'bg-green-700 hover:bg-green-600';
    }

    return 'bg-green-700 hover:bg-green-600';
}

function getText(orderStatus: string) {
    const status = orderStatus as OrderStatus;

    if ([OrderStatus.MARKET_INSPECTING, OrderStatus.EXCHANGE_INSPECTING].includes(status)) {
        return '完成验收';
    }

    if (status === OrderStatus.RETURN_REQUESTED) {
        return '拒绝供应商售后';
    }

    return '完成订单';
}
