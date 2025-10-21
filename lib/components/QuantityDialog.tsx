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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
	const [quantity, setQuantity] = useState<string>("1");
	const [error, setError] = useState<string>("");

	// 重置状态
	useEffect(() => {
		if (isOpen) {
			// 如果有初始数量，使用初始数量；否则使用最小起订量
			const defaultQuantity = initialQuantity || minOrderQuantity || 1;
			setQuantity(defaultQuantity.toString());
			setError("");
		}
	}, [isOpen, minOrderQuantity, initialQuantity]);

	// 判断是否需要允许小数
	const allowDecimals = unit.toLowerCase() === "kg" || unit.toLowerCase() === "g";

	// 处理输入变化
	const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;

		// 针对kg和g的输入验证（允许2位小数）
		if (allowDecimals) {
			// 允许空字符串、正整数和最多两位小数的正数
			if (value === "" || /^[0-9]*\.?[0-9]{0,2}$/.test(value)) {
				setQuantity(value);

				// 检查是否小于最小起订量
				const numericValue = parseFloat(value);
				if (!isNaN(numericValue) && numericValue < minOrderQuantity) {
					setError(`最小起订量为 ${minOrderQuantity} ${unit}`);
				} else {
					setError("");
				}
			}
		} else {
			// 其他单位只允许正整数
			if (value === "" || /^[0-9]+$/.test(value)) {
				setQuantity(value);

				// 检查是否小于最小起订量
				const numericValue = parseInt(value);
				if (!isNaN(numericValue) && numericValue < minOrderQuantity) {
					setError(`最小起订量为 ${minOrderQuantity} ${unit}`);
				} else {
					setError("");
				}
			}
		}
	};

	// 处理确认
	const handleConfirm = () => {
		if (!quantity) {
			setError("请输入数量");
			return;
		}

		const numericQuantity = parseFloat(quantity);

		if (isNaN(numericQuantity) || numericQuantity <= 0) {
			setError("请输入有效的数量");
			return;
		}

		if (numericQuantity < minOrderQuantity) {
			setError(`不能低于最小起订量 ${minOrderQuantity} ${unit}`);
			return;
		}

		onConfirm(numericQuantity);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle className="text-sm">采购数量</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="quantity" className="text-xs">
							商品：{productName},
							{minOrderQuantity > 1 && <span className="text-xs text-orange-500 ml-2">最小起订量: {minOrderQuantity} {unit}</span>}
						</Label>
						<Input
							id="quantity"
							type="text"
							value={quantity}
							onChange={handleQuantityChange}
							placeholder={allowDecimals ? "请输入数量，可保留2位小数" : "请输入整数数量"}
							className={error ? "border-red-500" : ""}
							autoFocus
						/>
						{error && <p className="text-xs text-red-500">{error}</p>}
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} size="sm">
						取消
					</Button>
					<Button onClick={handleConfirm} size="sm">确定</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
} 