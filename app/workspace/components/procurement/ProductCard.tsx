"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Product } from "../../types";
import { useState } from "react";
import Image from "next/image";
import { QuantityDialog } from "@/lib/components/QuantityDialog";

interface ProductCardProps {
	product: Product;
	onAddToCart: (product: Product, selectedProcessingFees: Record<string, boolean | string>, quantity?: number) => void;
	onViewDetail: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onViewDetail }: ProductCardProps) {
	const [isLoaded, setIsLoaded] = useState(false);
	const [hasError, setHasError] = useState(false);
	const [showQuantityDialog, setShowQuantityDialog] = useState(false);

	const handleAddToCart = (e: React.MouseEvent) => {
		e.stopPropagation();
		setShowQuantityDialog(true);
	};

	const handleQuantityConfirm = (quantity: number) => {
		onAddToCart(product, {}, quantity);
	};

	const handleImageLoad = () => {
		setIsLoaded(true);
	};

	const handleImageError = () => {
		console.error(`Failed to load image: ${product.image}`);
		setHasError(true);
		setIsLoaded(true);
	};

	return (
		<>
			<div className={`bg-white rounded-md border border-gray-200 overflow-hidden cursor-pointer transition-all duration-300 
				${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} onClick={() => onViewDetail(product)}>
				<div className="relative">
					<div className="w-full aspect-square overflow-hidden group relative">
						{!isLoaded && (
							<div className="w-full h-full flex items-center justify-center bg-gray-100">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
							</div>
						)}
						<Image
							src={product.image || "/images/default-product.png"}
							alt={product.name}
							fill
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							className={`object-cover transition-transform duration-500 ease-in-out group-hover:scale-110 `}
							onLoad={handleImageLoad}
							onError={handleImageError}
							priority={true}
						/>
						{hasError && (
							<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
								<span className="text-sm text-gray-500">图片加载失败</span>
							</div>
						)}
						<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 z-10">
							<h3 className="text-sm font-semibold text-white truncate">{product.name}</h3>
						</div>
					</div>
				</div>
				<div className="p-3 flex justify-between items-center">
					<p className="text-sm font-mono">
						¥{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}<span className="text-xs text-gray-500">/{product.unit}</span>
					</p>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 rounded-full bg-gray-100 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
						onClick={handleAddToCart}>
						<ShoppingCart className="h-3.5 w-3.5" />
						<span className="sr-only">添加到采购清单</span>
					</Button>
				</div>
			</div>

			<QuantityDialog
				isOpen={showQuantityDialog}
				onClose={() => setShowQuantityDialog(false)}
				onConfirm={handleQuantityConfirm}
				productName={product.name}
				unit={product.unit}
				minOrderQuantity={product.minOrderQuantity}
			/>
		</>
	);
} 