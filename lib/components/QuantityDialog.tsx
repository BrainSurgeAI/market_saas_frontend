"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, Package } from "lucide-react";

interface QuantityDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (quantity: number) => void;
	productName: string;
	unit: string;
	minOrderQuantity?: number;
	initialQuantity?: number;
}

export function QuantityDialog({
	isOpen,
	onClose,
	onConfirm,
	productName,
	unit,
	minOrderQuantity = 1,
	initialQuantity,
}: QuantityDialogProps) {
	const [quantity, setQuantity] = useState<number>(minOrderQuantity);
	const [error, setError] = useState<string>("");

	// 判断是否需要允许小数
	const allowDecimals = unit.toLowerCase() === "kg" || unit.toLowerCase() === "g";

	// 计算每次增减的步长
	const getStepValue = () => {
		if (allowDecimals) {
			// kg和g单位按100g（0.1kg）变化
			return unit.toLowerCase() === "kg" ? 0.1 : 100;
		}
		// 其他单位按1变化
		return 1;
	};

	const stepValue = getStepValue();

	// 重置状态
	useEffect(() => {
		if (isOpen) {
			// 确保最小起订量至少为1
			const safeMinOrderQuantity = Math.max(1, minOrderQuantity || 1);
			const defaultQuantity = initialQuantity || safeMinOrderQuantity;
			setQuantity(defaultQuantity);
			setError("");
		}
	}, [isOpen, minOrderQuantity, initialQuantity]);

	// 增加数量
	const handleIncrease = () => {
		const newQuantity = quantity + stepValue;

		// 只有当新数量 >= 最小起订量时才允许增加
		if (newQuantity >= minOrderQuantity) {
			setQuantity(newQuantity);
			setError("");
		} else {
			setError(`最小起订量为 ${minOrderQuantity} ${unit}`);
		}
	};

	// 减少数量
	const handleDecrease = () => {
		const newQuantity = Math.max(0, quantity - stepValue);
		if (newQuantity >= minOrderQuantity) {
			setQuantity(newQuantity);
			setError("");
		} else {
			setError(`最小起订量为 ${minOrderQuantity} ${unit}`);
		}
	};

	// // 直接输入数量（可选，用于高级用户）
	// const handleQuantityChange = (value: string) => {
	// 	const numericValue = allowDecimals ? parseFloat(value) : parseInt(value);

	// 	if (!isNaN(numericValue) && numericValue >= 0) {
	// 		setQuantity(numericValue);

	// 		if (numericValue < minOrderQuantity) {
	// 			setError(`最小起订量为 ${minOrderQuantity} ${unit}`);
	// 		} else {
	// 			setError("");
	// 		}
	// 	}
	// };

	// 处理确认
	const handleConfirm = () => {
		if (quantity < minOrderQuantity) {
			setError(`不能低于最小起订量 ${minOrderQuantity} ${unit}`);
			return;
		}

		onConfirm(quantity);
		onClose();
	};

	// 格式化数量显示
	const formatQuantity = (qty: number) => {
		// 确保 qty 是有效数字
		if (typeof qty !== 'number' || isNaN(qty) || qty < 0) {
			return '0';
		}

		if (allowDecimals) {
			// 对于小数，总是显示1位小数以保持一致性
			return qty.toFixed(1);
		}
		return Math.floor(qty).toString();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[420px] rounded-2xl">
				<DialogHeader className="pb-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
							<ShoppingCart className="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<DialogTitle className="text-lg font-bold text-slate-900">
								添加商品
							</DialogTitle>
							<p className="text-sm text-slate-500 mt-1">{productName}</p>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-6">
					{/* 数量选择区域 */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-slate-700">采购数量</span>
							{minOrderQuantity > 1 && (
								<Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
									最小起订: {minOrderQuantity} {unit}
								</Badge>
							)}
						</div>

						{/* 数量控制 */}
						<div className="flex items-center justify-center gap-4">
							<Button
								variant="outline"
								size="lg"
								className="w-12 h-12 rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50"
								onClick={handleDecrease}
								disabled={quantity <= minOrderQuantity}
							>
								<Minus className="w-5 h-5" />
							</Button>

							<div className="flex flex-col items-center gap-2 min-w-[120px]">
								<div className="text-2xl font-bold text-slate-900 font-mono">
									{formatQuantity(quantity)}
								</div>
								<div className="text-sm text-slate-500 font-medium">
									{unit}
								</div>
							</div>

							<Button
								variant="outline"
								size="lg"
								className="w-12 h-12 rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50"
								onClick={handleIncrease}
							>
								<Plus className="w-5 h-5" />
							</Button>
						</div>

						{/* 变化提示 */}
						<div className="text-center">
							<p className="text-xs text-slate-400">
								每次 {allowDecimals ? `增加 ${stepValue}${unit}` : `增加 ${stepValue} 个`}
							</p>
						</div>

						{/* 错误提示 */}
						{error && (
							<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
								<div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
									<span className="text-red-600 text-xs">!</span>
								</div>
								<p className="text-sm text-red-700">{error}</p>
							</div>
						)}
					</div>

					{/* 商品信息预览 */}
					{/* <div className="bg-slate-50 rounded-xl p-4 space-y-3">
						<div className="flex items-center gap-3">
							<Package className="w-5 h-5 text-slate-400" />
							<span className="text-sm font-medium text-slate-700">商品信息</span>
						</div>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="text-slate-500">商品名称</span>
								<p className="font-medium text-slate-900">{productName}</p>
							</div>
							<div>
								<span className="text-slate-500">计量单位</span>
								<p className="font-medium text-slate-900">{unit}</p>
							</div>
						</div>
					</div> */}
				</div>

				<DialogFooter className="flex gap-3 pt-6">
					<Button
						variant="outline"
						onClick={onClose}
						className="flex-1 h-12 rounded-xl border-slate-200"
					>
						取消
					</Button>
					<Button
						onClick={handleConfirm}
						className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20"
						disabled={quantity < minOrderQuantity}
					>
						<ShoppingCart className="w-4 h-4 mr-2" />
						确认添加
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
} 