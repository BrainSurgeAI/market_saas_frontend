'use client'

import { useState } from 'react';
import ReconciliationStatementList from "./ReconciliationStatementList";
import ReconciliationOrderSheet from "./ReconciliationOrderSheet";
import { ReconciliationStatement } from "@/app/types/reconciliationTypes";

interface ReconciliationStatementListWithSheetProps {
	statements: ReconciliationStatement[];
	customerId: string;
	tenantType: string;
}

/**
 * 带有滑动面板功能的结算单列表组件
 */
export default function ReconciliationStatementListWithSheet({
	statements,
	customerId,
	tenantType,
}: ReconciliationStatementListWithSheetProps) {
	const [selectedStatement, setSelectedStatement] = useState<ReconciliationStatement | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const handleStatementClick = (statement: ReconciliationStatement) => {
		setSelectedStatement(statement);
		setSheetOpen(true);
	};

	// const handleSheetClose = () => {
	// 	setSheetOpen(false);
	// 	// 延迟清理选中状态，避免动画过程中数据消失
	// 	setTimeout(() => {
	// 		setSelectedStatement(null);
	// 	}, 300);
	// };

	return (
		<>
			<ReconciliationStatementList
				statements={statements}
				customerId={customerId}
				tenantType={tenantType}
				onStatementClick={handleStatementClick}
			/>
			<ReconciliationOrderSheet
				statement={selectedStatement}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</>
	);
} 