"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProcessingFee, ProductDetail as ProductDetailType } from "../../types";
import { ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { QuantityDialog } from "@/lib/components/QuantityDialog";
import { LoadingOverlay } from "@/components/LoadingOverlay";

interface ProductDetailProps {
	isOpen: boolean;
	onClose: () => void;
	product: ProductDetailType | null;
	loading: boolean;
	onAddToCart: (product: ProductDetailType, selectedProcessingFees: Record<string, boolean | string>, quantity?: number) => void;
	processingFees: ProcessingFee[];
}

export function ProductDetailSheet({
	isOpen,
	onClose,
	product,
	loading,
	onAddToCart,
	processingFees
}: ProductDetailProps) {
	const [selectedProcessingFees, setSelectedProcessingFees] = useState<Record<string, boolean | string>>({});
	const [processingNote, setProcessingNote] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [showQuantityDialog, setShowQuantityDialog] = useState(false);

	// 预先计算radio组和checkbox组
	const { radioFees, checkboxFees } = useMemo(() => {
		const radio = processingFees.filter(fee => !fee.isCheckbox).map(fee => String(fee.processingFeeId));
		const checkbox = processingFees.filter(fee => fee.isCheckbox).map(fee => String(fee.processingFeeId));
		return { radioFees: radio, checkboxFees: checkbox };
	}, [processingFees]);

	// 查找"无需服务"选项的ID
	const noServiceFeeId = useMemo(() => {
		const noServiceFee = processingFees.find(fee =>
			fee.processingType?.includes("无需服务") ||
			fee.description?.includes("无需服务")
		);
		return noServiceFee ? String(noServiceFee.processingFeeId) : null;
	}, [processingFees]);

	const isNoServiceSelected = useMemo(() => {
		return noServiceFeeId ? !!selectedProcessingFees[noServiceFeeId] : false;
	}, [selectedProcessingFees, noServiceFeeId]);


	const hasCheckboxOptions = useMemo(() => {
		return checkboxFees.length > 0;
	}, [checkboxFees]);

	const hasRadioOptions = useMemo(() => {
		return radioFees.length > 0;
	}, [radioFees]);


	const hasSelectedRadio = useMemo(() => {
		return radioFees.some(id => !!selectedProcessingFees[id]);
	}, [selectedProcessingFees, radioFees]);

	useEffect(() => {
		if (product) {
			setSelectedProcessingFees({});
			setProcessingNote("");
			setError(null);
		}
	}, [product]);

	const validateSelection = useCallback(() => {
		// 如果有radio选项但没有选择任何一个，显示错误
		if (hasRadioOptions && !hasSelectedRadio) {
			setError("请选择一个加工服务选项");
			return false;
		}

		setError(null);
		return true;
	}, [hasRadioOptions, hasSelectedRadio]);

	const handleAddToCart = useCallback(() => {
		if (product) {
			// 验证选择
			if (!validateSelection()) {
				return;
			}

			// 将备注添加到选择的处理选项中
			const updatedProcessingFees = { ...selectedProcessingFees };
			if (!isNoServiceSelected && hasRadioOptions && processingNote) {
				updatedProcessingFees.note = processingNote;
			}

			// 显示数量选择对话框
			setShowQuantityDialog(true);
		}
	}, [product, selectedProcessingFees, processingNote, isNoServiceSelected, hasRadioOptions, validateSelection]);

	// 处理数量确认
	const handleQuantityConfirm = useCallback((quantity: number) => {
		if (product) {
			// 将备注添加到选择的处理选项中
			const updatedProcessingFees = { ...selectedProcessingFees };
			if (!isNoServiceSelected && hasRadioOptions && processingNote) {
				updatedProcessingFees.note = processingNote;
			}

			onAddToCart(product, updatedProcessingFees, quantity);
			onClose(); // 添加到购物清单后关闭滑动界面
		}
	}, [product, selectedProcessingFees, processingNote, isNoServiceSelected, hasRadioOptions, onAddToCart, onClose]);

	// 处理checkbox变化 - 使用useCallback优化
	const handleCheckboxChange = useCallback((feeId: string, checked: boolean) => {
		setSelectedProcessingFees(prev => ({
			...prev,
			[feeId]: checked
		}));
		// 清除错误提示
		setError(null);
	}, []);

	// 处理radio变化 - 优化性能
	const handleRadioChange = useCallback((feeId: string) => {
		// 直接设置新状态，不需要先过滤和循环
		setSelectedProcessingFees(prev => {
			// 创建新状态对象
			const newState = { ...prev };

			// 清除所有已有的radio选项
			radioFees.forEach(id => {
				if (id in newState) {
					delete newState[id];
				}
			});

			// 设置新选中的radio选项
			newState[feeId] = true;

			return newState;
		});
		// 清除错误提示
		setError(null);
	}, [radioFees]);

	// 处理备注输入变化
	const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setProcessingNote(e.target.value);
	}, []);

	// 渲染处理选项项
	const renderProcessingFeeItem = useCallback((fee: ProcessingFee) => {
		const feeId = String(fee.processingFeeId);
		const isChecked = !!selectedProcessingFees[feeId];

		return (
			<li key={feeId} className="flex items-center gap-2">
				{fee.isCheckbox !== undefined ? (
					fee.isCheckbox ? (
						<input
							type="checkbox"
							id={`fee-${feeId}`}
							className="h-3.5 w-3.5 rounded border-gray-300 text-primary"
							checked={isChecked}
							onChange={(e) => handleCheckboxChange(feeId, e.target.checked)}
						/>
					) : (
						<input
							type="radio"
							name="processingFeeOption"
							id={`fee-${feeId}`}
							className="h-3.5 w-3.5 rounded-full border-gray-300 text-primary"
							checked={isChecked}
							onChange={() => handleRadioChange(feeId)}
						/>
					)
				) : null}
				<label htmlFor={`fee-${feeId}`} className="cursor-pointer">
					{fee.processingType} {fee.description}
				</label>
			</li>
		);
	}, [selectedProcessingFees, handleCheckboxChange, handleRadioChange]);

	// 判断是否应该显示输入框
	const shouldShowInput = useMemo(() => {
		// 如果选择了"无需服务"，不显示输入框
		if (isNoServiceSelected) return false;

		// 如果有单选选项，显示输入框
		return hasRadioOptions;
	}, [isNoServiceSelected, hasRadioOptions]);

	return (
		<>
			{loading ? (
				<LoadingOverlay />
			) : (
				<Sheet open={isOpen} onOpenChange={onClose}>
					<SheetContent className="w-full sm:max-w-md overflow-auto">
						<SheetHeader>
							<SheetTitle className="text-base font-medium">
								商品详情
							</SheetTitle>
						</SheetHeader>

						{product ? (
							<div className="space-y-2">
								<div className="aspect-square w-full overflow-hidden relative rounded-lg shadow-md group transition-all duration-300 hover:shadow-lg">
									<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<Image
										src={product.image}
										alt={product.name}
										fill
										sizes="(max-width: 768px) 100vw, 400px"
										priority
										className="object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								</div>

								<div>
									<h3 className="text-base font-semibold">{product.name}</h3>
									<div className="flex items-center justify-between">
										<p className="text-base font-mono">
											¥{((product.price ?? 0) * (product.discountRate ?? 1)).toFixed(2)}<span className="text-xs text-gray-500">/{product.unit}</span>
										</p>
									</div>
									<p className="text-xs text-gray-500 pt-1">{product.pricingMethod?.toLowerCase()}，最小起购量 <span className="text-primary font-mono">{product.minOrderQuantity} {product.unit}</span></p>
									<p className="text-xs text-gray-500">今日价格公示：</p>
									<p className="text-xs text-gray-500">最高价 <span className="text-primary font-mono">¥{product.maxPrice}</span>，中间价 <span className="text-primary font-mono">¥{product.price}</span>， 最低价 <span className="text-primary font-mono">¥{product.minPrice}</span></p>
								</div>

								<Separator />

								{product.description && (
									<div className="space-y-2">
										<h4 className="text-sm font-medium">产品描述</h4>
										<p className="text-xs text-gray-600">{product.description.trim()}</p>
									</div>
								)}
								{product.spec && (
									<div className="space-y-2">
										<h4 className="text-sm font-medium">规格</h4>
										<p className="text-xs text-gray-600">{product.spec.trim()}</p>
									</div>
								)}

								{product.specialNotes && (
									<div className="space-y-2">
										<h4 className="text-sm font-medium">特别说明</h4>
										<p className="text-xs text-gray-600">{product.specialNotes.trim()}</p>
									</div>
								)}

								{product.tips && (
									<div className="space-y-2">
										<h4 className="text-sm font-medium">温馨提示</h4>
										<ul className="text-xs text-gray-600 space-y-1 list-disc">
											{product.tips}
										</ul>
									</div>
								)}
								{product.brand && (
									<div className="flex justify-between text-xs">
										<span>品牌:</span>
										<span className="text-gray-600">{product.brand.trim()}</span>
									</div>
								)}
								{product.storageConditions && (
									<div className="flex justify-between text-xs">
										<span>存储方式:</span>
										<span className="text-gray-600">{product.storageConditions.trim()}</span>
									</div>
								)}
								{product.shelfLife && (
									<div className="flex justify-between text-xs">
										<span>保质期:</span>
										<span className="text-gray-600">{product.shelfLife.trim()}</span>
									</div>
								)}
								<Separator />
								{processingFees && processingFees.length > 0 && (
									<div className="space-y-2">
										<h4 className="text-sm font-medium">
											免费附加服务
											{hasRadioOptions && <span className="text-xs text-red-500 ml-1">*</span>}
										</h4>
										<ul className="text-xs text-gray-600 space-y-2 list-none pl-0">
											{/* 先渲染单选选项 */}
											{processingFees
												.filter(fee => fee.feeType === 'RADIO')
												.map(renderProcessingFeeItem)}

											{/* 再渲染复选选项 */}
											{processingFees
												.filter(fee => fee.feeType !== 'RADIO')
												.map(renderProcessingFeeItem)}
										</ul>

										{/* 显示错误信息 */}
										{error && (
											<div className="text-xs text-red-500 mt-1">
												{error}
											</div>
										)}

										{/* 条件显示的备注输入框 - 当有单选选项时不显示 */}
										{shouldShowInput && (
											<div className="mt-2 text-xs">
												<Input type="text" placeholder="特殊需求请备注" value={processingNote} onChange={handleNoteChange} className="text-xs" />
											</div>
										)}
									</div>
								)}

								<Button
									className="w-full text-xs transition-all duration-200 hover:shadow-sm"
									onClick={handleAddToCart}
								>
									<ShoppingCart className="h-4 w-4 mr-2" />
									添加到采购清单
								</Button>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center h-[50vh]">
								<p className="text-sm text-gray-500">未找到产品信息</p>
							</div>
						)}
					</SheetContent>
				</Sheet>
			)}

			{/* 数量选择对话框 */}
			{product && (
				<QuantityDialog
					isOpen={showQuantityDialog}
					onClose={() => setShowQuantityDialog(false)}
					onConfirm={handleQuantityConfirm}
					productName={product.name}
					unit={product.unit}
					minOrderQuantity={product.minOrderQuantity}
				/>
			)}
		</>
	);
} 