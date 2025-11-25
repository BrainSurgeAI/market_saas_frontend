"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Eye } from "lucide-react";
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
	const [isHovered, setIsHovered] = useState(false);

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
			{/* Fresh eCommerce Card Design */}
			<div
				className={`group bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 ${
					isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
				}`}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onClick={() => onViewDetail(product)}
			>
				{/* Product Image Container */}
				<div className="relative aspect-square overflow-hidden bg-slate-50">
					{/* Loading State */}
					{!isLoaded && (
						<div className="w-full h-full flex items-center justify-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						</div>
					)}

					{/* Product Image */}
					<Image
						src={product.image || "/images/default-product.png"}
						alt={product.name}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						className={`object-cover transition-all duration-500 ease-out ${
							isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
						} ${isHovered ? 'scale-110' : ''}`}
						onLoad={handleImageLoad}
						onError={handleImageError}
						priority={false}
					/>

					{/* Error State */}
					{hasError && (
						<div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
							<div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-2">
								<span className="text-slate-400 text-lg">📦</span>
							</div>
							<span className="text-xs text-slate-500">图片加载失败</span>
						</div>
					)}

					{/* Overlay Actions */}
					<div className={`absolute inset-0 bg-black/0 transition-all duration-300 flex items-center justify-center ${
						isHovered ? 'bg-black/10' : ''
					}`}>
						<div className={`flex gap-2 transition-all duration-300 ${
							isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
						}`}>
							<Button
								size="sm"
								variant="secondary"
								className="bg-white/90 hover:bg-white text-slate-700 shadow-lg backdrop-blur-sm"
								onClick={(e) => {
									e.stopPropagation();
									onViewDetail(product);
								}}
							>
								<Eye className="w-4 h-4" />
							</Button>
							<Button
								size="sm"
								className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
								onClick={handleAddToCart}
							>
								<ShoppingCart className="w-4 h-4" />
							</Button>
						</div>
					</div>

					{/* Category Badge */}
					<div className="absolute top-3 left-3">
						{product.discountRate && product.discountRate < 1 && (
							<Badge
								variant="secondary"
								className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 backdrop-blur-sm border-green-200"
							>
								- {Math.round((1 - product.discountRate) * 100)}%
								</Badge>
						)}
					</div>

					{/* Favorite Button */}
					{/*
					<Button
						size="sm"
						variant="ghost"
						className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-red-500 transition-all duration-200 ${
							isHovered ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
						}`}
						onClick={(e) => {
							e.stopPropagation();
							// TODO: Implement favorite functionality
						}}
					>
						<Heart className="w-4 h-4" />
					</Button>
					*/}
				</div>

				{/* Product Info */}
				<div className="p-4 space-y-3">
					{/* Product Name */}
					<h3 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
						{product.name}
					</h3>

					{/* Price and Unit */}
					<div className="flex items-baseline justify-between">
						<div className="flex items-baseline gap-1">
							<span className="text-medium font-mono font-bold text-slate-900">
								¥{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
							</span>
							<span className="text-xs text-slate-500 font-medium">
								/{product.unit}
							</span>
						</div>

						{/* Quick Add Button */}
						<Button
							size="sm"
							variant="outline"
							className="h-8 px-3 rounded-full border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
							onClick={handleAddToCart}
						>
							<ShoppingCart className="w-3 h-3 mr-1" />
							<span className="text-xs font-medium">加入</span>
						</Button>
					</div>

					{/* Additional Info */}
					<div className="flex items-center justify-between text-xs text-slate-500">
						{product.minOrderQuantity && (
							<span>起订: {product.minOrderQuantity}{product.unit}</span>
						)}
						{product.processingRequirements && (
							<span className="truncate ml-2">加工要求</span>
						)}
					</div>
				</div>
			</div>

			{/* Quantity Dialog */}
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