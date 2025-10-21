'use client'

import { useState } from 'react';
import { Organization } from "@/app/models";
import { useRouter } from 'next/navigation';
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Loader2,
	PencilIcon,
	PlusCircle,
	RefreshCw,
	PowerIcon,
	PowerOffIcon,
	AlertTriangleIcon,
	MoreHorizontal,
	ExternalLinkIcon,
	X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TenantForm, TenantFormValues, getTenantTypeText } from "./tenant-form";
import { Category } from '@/app/workspace/types';

interface TenantsPageProps {
	market_id: string;
	tenants: Organization[];
	business_scope: Category[];
}

export function TenantsPage({ market_id, tenants: initialTenants, business_scope }: TenantsPageProps) {
	const router = useRouter();
	const [tenants, setTenants] = useState<Organization[]>(initialTenants);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
	const [selectedTenant, setSelectedTenant] = useState<Organization | null>(null);
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
	const [showStatusInfo, setShowStatusInfo] = useState<boolean>(true);

	// 重置所有状态的函数
	const resetAllDialogStates = () => {
		setSelectedTenant(null);
		setIsCreateDialogOpen(false);
		setIsEditDialogOpen(false);
		setIsStatusDialogOpen(false);
		setOpenDropdownId(null);
	};

	// 格式化时间
	const formatDate = (dateString: string | number) => {
		const date = new Date(dateString);
		return date.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	// 获取状态对应的样式
	const getStatusStyle = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return 'bg-green-100 text-green-800 hover:bg-green-200';
			case 'PENDING':
				return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
			case 'REJECTED':
				return 'bg-red-100 text-red-800 hover:bg-red-200';
			case 'SUBMITTED':
				return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
			default:
				return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
		}
	};

	// 判断租户是否被禁用
	const isTenantDisabled = (tenant: Organization | null): boolean => {
		if (!tenant) return false;
		return Boolean(tenant.deletedAt);
	};

	// 刷新租户数据
	const refreshTenants = async () => {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/markets/${market_id}/tenants`);
			if (!response.ok) {
				throw new Error('刷新租户列表失败');
			}
			const data = await response.json();
			setTenants(data.data);
			toast({
				title: "刷新成功",
				description: "租户列表已更新",
			});
		} catch (error) {
			console.error('刷新租户列表失败:', error);
			toast({
				title: "刷新失败",
				description: "请稍后重试",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// 创建租户处理
	const handleCreateTenant = async (data: TenantFormValues) => {
		setIsLoading(true);

		try {
			const submitData = {
				...data,
				businessScope: data.businessScope || ""
			};

			const response = await fetch(`/api/markets/${market_id}/tenants`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(submitData)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || '创建租户失败');
			}

			// 创建成功后刷新租户列表
			await refreshTenants();

			// 关闭对话框
			resetAllDialogStates();

			toast({
				title: "创建成功",
				description: `租户 ${data.name} ~ 已成功创建`,
			});
		} catch (error) {
			toast({
				title: "创建失败",
				description: error instanceof Error ? error.message : "请稍后重试",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// 编辑租户处理
	const handleEditTenant = async (data: TenantFormValues) => {
		if (!selectedTenant) return;

		setIsLoading(true);

		try {
			const submitData = {
				...data,
				businessScope: data.businessScope || ""
			};

			const response = await fetch(`/api/markets/${market_id}/tenants/${selectedTenant.nameHash}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(submitData)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || '更新租户失败');
			}

			await refreshTenants();
			resetAllDialogStates();

			toast({
				title: "更新成功",
				description: `租户 ${data.name} ~ 信息已更新`,
			});
		} catch (error) {
			toast({
				title: "更新失败",
				description: error instanceof Error ? error.message : "请稍后重试",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// 启用/禁用租户处理
	const handleToggleTenantStatus = async () => {
		if (!selectedTenant) return;

		const isCurrentlyDisabled = isTenantDisabled(selectedTenant);
		const newStatus = !isCurrentlyDisabled;

		setIsLoading(true);

		try {
			const response = await fetch(`/api/markets/${market_id}/tenants/${selectedTenant.nameHash}/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					isDisabled: newStatus
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `${newStatus ? '禁用' : '启用'}租户失败`);
			}

			// 成功后刷新租户列表
			await refreshTenants();

			// 关闭对话框并清除选中的租户
			resetAllDialogStates();

			toast({
				title: newStatus ? "禁用成功" : "启用成功",
				description: `租户 ${selectedTenant.name} ~ 已${newStatus ? '禁用' : '启用'}`,
			});
		} catch (error) {
			toast({
				title: newStatus ? "禁用失败" : "启用失败",
				description: error instanceof Error ? error.message : "请稍后重试",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// 打开编辑对话框
	const openEditDialog = (tenant: Organization) => {
		// 先清除所有状态，再设置新状态
		resetAllDialogStates();

		// 设置选中的租户，延迟打开对话框以确保状态已更新
		setSelectedTenant(tenant);
		setTimeout(() => {
			setIsEditDialogOpen(true);
		}, 0);
	};

	// 打开状态切换对话框
	const openStatusDialog = (tenant: Organization) => {
		// 先清除所有状态，再设置新状态  
		resetAllDialogStates();

		// 设置选中的租户，延迟打开对话框以确保状态已更新
		setSelectedTenant(tenant);
		setTimeout(() => {
			setIsStatusDialogOpen(true);
		}, 0);
	};

	// 查看租户详情
	const viewTenantDetail = (nameHash: string) => {
		router.push(`/workspace/markets/${market_id}/tenants/${nameHash}`);
	};

	return (
		<div className="container mx-auto p-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>租户管理</CardTitle>
						<CardDescription>管理所有与本市场关联的租户</CardDescription>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={refreshTenants}
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin mr-1" />
							) : (
								<RefreshCw className="h-4 w-4 mr-1" />
							)}
							刷新
						</Button>
						<Dialog
							open={isCreateDialogOpen}
							onOpenChange={(open) => {
								if (open) {
									setIsCreateDialogOpen(true);
								} else {
									resetAllDialogStates();
								}
							}}
						>
							<DialogTrigger asChild>
								<Button size="sm">
									<PlusCircle className="h-4 w-4 mr-1" />
									新建租户
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>创建新租户</DialogTitle>
									<DialogDescription>
										添加一个新的租户到系统中。创建后，他们将可以访问平台功能。
									</DialogDescription>
								</DialogHeader>
								<TenantForm
									marketId={market_id}
									isLoading={isLoading}
									mode="create"
									onSubmit={handleCreateTenant}
									onCancel={() => resetAllDialogStates()}
									business_scope={business_scope}
								/>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>

				{/* 状态说明卡片 */}
				{showStatusInfo && (
					<div className="px-6 py-2 mb-4 bg-blue-50 border border-blue-100 rounded-md mx-6 relative">
						<button
							className="absolute right-2 top-2 text-blue-400 hover:text-blue-600 focus:outline-none"
							onClick={() => setShowStatusInfo(false)}
							aria-label="关闭状态说明"
						>
							<X className="h-4 w-4" />
						</button>
						<div className="flex items-start gap-2">
							<AlertTriangleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
							<div>
								<h4 className="text-sm font-medium text-blue-700">状态说明</h4>
								<p className="text-xs text-blue-600 mt-1">
									<span className="font-medium">PENDING</span>：表示租户已创建但尚未创建默认用户，需要在租户详情页面创建默认用户才能完成租户激活。
								</p>
							</div>
						</div>
					</div>
				)}

				<CardContent>
					<Table>
						<TableCaption>共 {tenants.length} 个租户</TableCaption>
						<TableHeader>
							<TableRow>
								<TableHead className="text-xs font-semibold">名称</TableHead>
								<TableHead className="text-xs font-semibold">类型</TableHead>
								<TableHead className="text-xs font-semibold">状态</TableHead>
								<TableHead className="text-xs font-semibold">地址</TableHead>
								<TableHead className="text-xs font-semibold">创建时间</TableHead>
								<TableHead className="text-xs font-semibold">最后更新</TableHead>
								<TableHead className="text-right text-xs font-semibold">操作</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{tenants.length === 0 ? (
								<TableRow>
									<TableCell colSpan={8} className="text-center py-10">
										没有找到租户数据
									</TableCell>
								</TableRow>
							) : (
								tenants.map((tenant) => {
									const isDisabled = isTenantDisabled(tenant);
									return (
										<TableRow
											key={tenant.id}
											className={`hover:bg-gray-100 text-xs ${isDisabled ? 'bg-gray-50 opacity-60' : ''}`}
										>

											<TableCell>
												{tenant.name}
												{isDisabled && (
													<Badge variant="outline" className="ml-2 text-red-500 border-red-200 text-[10px]">
														已禁用
													</Badge>
												)}
											</TableCell>
											<TableCell>
												<Badge variant="outline" className="capitalize text-xs">
													{getTenantTypeText(tenant.tenantType)}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge className={getStatusStyle(tenant.status)}>
													{tenant.status}
												</Badge>
											</TableCell>
											<TableCell className="max-w-[200px] truncate" title={tenant.address}>
												{tenant.address}
											</TableCell>
											<TableCell>{formatDate(tenant.createdAt)}</TableCell>
											<TableCell>{formatDate(tenant.updatedAt)}</TableCell>
											<TableCell className="text-right space-x-2">
												<DropdownMenu
													open={openDropdownId === tenant.nameHash}
													onOpenChange={(open) => {
														if (open) {
															setOpenDropdownId(tenant.nameHash);
														} else {
															setOpenDropdownId(null);
														}
													}}
												>
													<DropdownMenuTrigger asChild onClick={(e) => {
														e.stopPropagation();
														setOpenDropdownId(prev => prev === tenant.nameHash ? null : tenant.nameHash);
													}}>
														<Button
															variant="outline"
															size="sm"
															className="h-8 w-8 p-0 focus-visible:ring-0"
														>
															<MoreHorizontal className="h-4 w-4" />
															<span className="sr-only">操作菜单</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-[160px]">
														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation();
																openEditDialog(tenant);
															}}
														>
															<PencilIcon className="h-4 w-4 mr-2" />
															<span>编辑</span>
														</DropdownMenuItem>

														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation();
																viewTenantDetail(tenant.nameHash);
															}}
														>
															<ExternalLinkIcon className="h-4 w-4 mr-2" />
															<span>详情</span>
														</DropdownMenuItem>

														<DropdownMenuSeparator />

														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation();
																openStatusDialog(tenant);
															}}
															className={isDisabled ? "text-green-600" : "text-red-600"}
														>
															{isDisabled ? (
																<PowerIcon className="h-4 w-4 mr-2" />
															) : (
																<PowerOffIcon className="h-4 w-4 mr-2" />
															)}
															<span>{isDisabled ? "启用" : "禁用"}</span>
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* 编辑租户对话框 */}
			{isEditDialogOpen && selectedTenant && (
				<Dialog
					open={isEditDialogOpen}
					onOpenChange={(open) => {
						if (!open) {
							resetAllDialogStates();
						}
					}}
				>
					<DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => {
						e.preventDefault();
						resetAllDialogStates();
					}}>
						<DialogHeader>
							<DialogTitle>编辑租户信息</DialogTitle>
							<DialogDescription>
								修改租户的信息。请确保所有必填字段都已填写。
							</DialogDescription>
						</DialogHeader>
						<TenantForm
							marketId={market_id}
							tenant={selectedTenant}
							isLoading={isLoading}
							mode="edit"
							onSubmit={handleEditTenant}
							onCancel={() => resetAllDialogStates()}
							business_scope={business_scope}
						/>
					</DialogContent>
				</Dialog>
			)}

			{/* 租户状态切换确认对话框 */}
			{isStatusDialogOpen && selectedTenant && (
				<Dialog
					open={isStatusDialogOpen}
					onOpenChange={(open) => {
						if (!open) {
							resetAllDialogStates();
						}
					}}
				>
					<DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => {
						e.preventDefault();
						resetAllDialogStates();
					}}>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<AlertTriangleIcon className={isTenantDisabled(selectedTenant) ? "text-green-500" : "text-red-500"} size={18} />
								{isTenantDisabled(selectedTenant) ? "启用租户" : "禁用租户"}
							</DialogTitle>
							<DialogDescription>
								{isTenantDisabled(selectedTenant)
									? "启用后，该租户将可以正常访问系统并进行操作。"
									: "禁用后，该租户将无法登录系统，所有相关账户访问将被拒绝。"}
							</DialogDescription>
						</DialogHeader>
						<div className="py-4">
							<p>确定要{isTenantDisabled(selectedTenant) ? "启用" : "禁用"}租户 <strong>{selectedTenant.name}</strong> 吗？</p>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={(e) => {
									e.stopPropagation();
									resetAllDialogStates();
								}}
								disabled={isLoading}
							>
								取消
							</Button>
							<Button
								type="button"
								variant={isTenantDisabled(selectedTenant) ? "default" : "destructive"}
								onClick={(e) => {
									e.stopPropagation();
									handleToggleTenantStatus();
								}}
								disabled={isLoading}
							>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								确认{isTenantDisabled(selectedTenant) ? "启用" : "禁用"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}