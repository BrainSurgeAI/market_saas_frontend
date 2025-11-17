"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { OrderOverview } from "@/app/workspace/types";

import { useToast } from "@/hooks/use-toast";
import OrdersList from "@/app/workspace/components/orders/OrdersList";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 声明全局window类型，添加updateOrderInList方法
declare global {
	interface Window {
		updateOrderInList?: (orderCode: string, updates: Partial<OrderOverview>) => void;
	}
}

export interface Provider {
	id: string;
	name: string;
	businessScope?: string;
}

export default function ProviderOrdersPage() {
	const params = useParams();
	const { toast } = useToast();
	const { user } = useWorkspace();

	// 供应商相关状态
	const [providers, setProviders] = useState<Provider[]>([]);
	const [loadingProviders, setLoadingProviders] = useState(false);
	const [selectedProvider, setSelectedProvider] = useState<string>("");
	const [currentOrderCode, setCurrentOrderCode] = useState<string>("");
	const [showProviderDialog, setShowProviderDialog] = useState(false);
	const [assigningOrder, setAssigningOrder] = useState(false);

	// 处理指派订单按钮点击
	const handleAssignClick = (orderCode: string, event: React.MouseEvent) => {
		event.stopPropagation();
		setCurrentOrderCode(orderCode);
		setSelectedProvider("");
		setShowProviderDialog(true);
	};

	// 处理指派订单到供应商
	const handleAssignOrder = async () => {
		if (!selectedProvider || !currentOrderCode || assigningOrder) return;

		try {
			setAssigningOrder(true);

			const response = await fetch(`/api/markets/${params.market_id}/orders/${currentOrderCode}/assign`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					providerId: parseInt(selectedProvider),
					confirmedBy: user?.name
				})
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`指派订单失败: ${response.status}, ${errorText}`);
			}

			// 尝试从响应中获取更新后的订单数据
			let responseData;
			try {
				responseData = await response.json();
			} catch {
				responseData = null;
			}

			// 更新本地订单列表，将指派的订单的assignedTo设为非空值，状态更新为ASSIGNED
			const selectedProviderObj = providers.find(p => p.id === selectedProvider);

			// 使用OrdersList组件暴露的updateOrderInList方法更新订单
			if (typeof window !== 'undefined' && window.updateOrderInList) {
				window.updateOrderInList(currentOrderCode, {
					assignedTo: selectedProviderObj?.name || '已指派',
					orderStatus: responseData?.orderStatus || 'ASSIGNED' // 更新订单状态为已指派
				});
			}

			toast({
				title: "指派成功",
				description: `订单 ${currentOrderCode} 已成功指派`,
				variant: "success",
			});

			setShowProviderDialog(false);
		} catch (err) {
			toast({
				title: "指派失败",
				description: err instanceof Error ? err.message : "指派订单时出错",
				variant: "destructive",
			});
		} finally {
			setAssigningOrder(false);
		}
	};

	// 获取当前选中供应商的业务范围
	const getSelectedProviderBusinessScope = () => {
		if (!selectedProvider) return [];

		const provider = providers.find(p => p.id === selectedProvider);
		if (!provider || !provider.businessScope) return [];

		return provider.businessScope.split(',');
	};

	useEffect(() => {
		fetchProviders();
	}, []);

	const fetchProviders = async () => {
		try {
			setLoadingProviders(true);
			const response = await fetch(`/api/markets/${params.market_id}/providers`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`请求失败: ${response.status}`);
			}

			const responseData = await response.json();

			if (Array.isArray(responseData)) {
				setProviders(responseData);
			} else if (responseData.data && Array.isArray(responseData.data)) {
				setProviders(responseData.data);
			} else {
				setProviders([]);
			}
		} catch (err) {
			toast({
				title: "获取供应商失败",
				description: err instanceof Error ? err.message : "获取供应商列表时出错",
				variant: "destructive",
			});
		} finally {
			setLoadingProviders(false);
		}
	};

	return (
		<div className="container mx-auto py-6">
			<div className="space-y-6">
				<div>
					<h2 className="text-lg font-semibold">订单管理</h2>
				</div>

				<OrdersList org_id={params.market_id as string} redirectUrl={`/workspace/markets/${params.market_id}/orders`} providers={providers} handleAssignClick={handleAssignClick} />
			</div>

			<Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="text-base font-semibold">指派订单</DialogTitle>
						<DialogDescription className="text-xs">
							选择一个供应商来处理此订单，未指派供应商的订单将无法进行备货
						</DialogDescription>
					</DialogHeader>
					<div className="py-1">
						{loadingProviders ? (
							<div className="flex justify-center py-2">
								<p className="text-sm text-gray-500">正在加载供应商数据...</p>
							</div>
						) : providers.length === 0 ? (
							<div className="flex justify-center py-2">
								<p className="text-sm text-gray-500">暂无可用供应商</p>
							</div>
						) : (
							<>
								<Select value={selectedProvider} onValueChange={setSelectedProvider}>
									<SelectTrigger className="text-xs">
										<SelectValue placeholder="选择供应商" />
									</SelectTrigger>
									<SelectContent>
										{providers.map((provider) => (
											<SelectItem key={provider.id} value={provider.id} className="cursor-pointer text-xs">
												{provider.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								{/* 显示所选供应商的业务范围 */}
								{selectedProvider && (
									<div className="mt-3">
										<p className="text-xs text-gray-500 mb-2">供应商业务范围:</p>
										<div className="flex flex-wrap gap-2">
											{getSelectedProviderBusinessScope().length > 0 ? (
												getSelectedProviderBusinessScope().map((scope, index) => (
													<Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
														{scope.trim()}
													</Badge>
												))
											) : (
												<p className="text-xs text-gray-500">该供应商未设置业务范围</p>
											)}
										</div>
									</div>
								)}
							</>
						)}
					</div>
					<DialogFooter>
						<Button variant="outline" size="sm" onClick={() => setShowProviderDialog(false)}>
							取消
						</Button>
						<Button size="sm" onClick={handleAssignOrder} disabled={!selectedProvider || assigningOrder}>
							{assigningOrder ? "指派中..." : "确认"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
