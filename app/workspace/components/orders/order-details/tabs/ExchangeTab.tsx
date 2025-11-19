"use client";

import { OrderStatus, OperationType } from "@/lib/types/orderStatus";
import { ExchangeItem } from "@/lib/types/orderStatus";
import { ExchangeListSection } from "../ExchangeListSection";
import { ExchangeItemStatus } from "@/lib/types/orderStatus";

interface ExchangeTabProps {
	tenantType: string;
	orderStatus: OrderStatus;
	beginInspecting: boolean;
	onBeginInspect: () => void;
	allExchangeItemsCompleted: boolean;
	onDeliverToMarket: () => void;
	exchangeItems: ExchangeItem[];
	loadingExchangeReturn: boolean;
	handleExchangeStatusChange: (itemId: number, newStatus: ExchangeItemStatus, reason?: string) => Promise<void>;
	handleOperation: (id: number, type: OperationType) => void;
	canPerformExchangeAction: (item: ExchangeItem, action: string) => boolean;
	getExchangeStatusLabel: (status: ExchangeItemStatus) => string;
	getExchangeStatusVariant: (status: ExchangeItemStatus) => "default" | "secondary" | "destructive" | "outline";
	onCompleteAcceptance: () => void;
	getReceivedQuantity: (itemId: number) => string | number | undefined;
}

export function ExchangeTab({
	tenantType,
	orderStatus,
	beginInspecting,
	onBeginInspect,
	allExchangeItemsCompleted,
	onDeliverToMarket,
	exchangeItems,
	loadingExchangeReturn,
	handleExchangeStatusChange,
	handleOperation,
	canPerformExchangeAction,
	getExchangeStatusLabel,
	getExchangeStatusVariant,
	onCompleteAcceptance,
	getReceivedQuantity,
}: ExchangeTabProps) {
	return (
		<ExchangeListSection
			tenantType={tenantType}
			orderStatus={orderStatus}
			beginInspecting={beginInspecting}
			onBeginInspect={onBeginInspect}
			allExchangeItemsCompleted={allExchangeItemsCompleted}
			onDeliverToMarket={onDeliverToMarket}
			exchangeItems={exchangeItems}
			loadingExchangeReturn={loadingExchangeReturn}
			handleExchangeStatusChange={handleExchangeStatusChange}
			handleOperation={handleOperation}
			canPerformExchangeAction={canPerformExchangeAction}
			getExchangeStatusLabel={getExchangeStatusLabel}
			getExchangeStatusVariant={getExchangeStatusVariant}
			onCompleteAcceptance={onCompleteAcceptance}
			getReceivedQuantity={getReceivedQuantity}
		/>
	);
}

