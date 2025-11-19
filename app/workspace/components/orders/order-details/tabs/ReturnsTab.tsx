"use client";

import { ReturnListSection } from "../ReturnListSection";
import { ExchangeReturnRecord } from "@/lib/types/orderStatus";
import { OrderItem } from "@/lib/types/orderStatus";

interface ReturnsTabProps {
	returnRecords: ExchangeReturnRecord[];
	orderItems: OrderItem[];
}

export function ReturnsTab({ returnRecords, orderItems }: ReturnsTabProps) {
	return <ReturnListSection returnRecords={returnRecords} orderItems={orderItems} />;
}

