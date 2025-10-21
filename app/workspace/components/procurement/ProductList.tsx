"use client";

import { Product } from "../../types";
import { ProductCard } from "./ProductCard";

interface ProductListProps {
	products: Product[];
	onAddToCart: (product: Product, selectedProcessingFees: Record<string, boolean | string>) => void;
	onViewDetail: (product: Product) => void;
	loading: boolean;
	onLoadMore: () => void;
}

export function ProductList({
	products,
	onAddToCart,
	onViewDetail,
	loading,
	onLoadMore
}: ProductListProps) {
	if (!products || products.length === 0) {
		return (
			<div className="space-y-4 mt-4">
				{loading ? (
					<div className="flex justify-center py-4">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-md">
						<p className="text-gray-500 mb-2">暂无产品数据</p>
						<p className="text-xs text-gray-400">请尝试选择其他分类或搜索关键词</p>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-4 mt-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{products.map((product) => (
					<ProductCard
						key={product.id}
						product={product}
						onAddToCart={onAddToCart}
						onViewDetail={onViewDetail}
					/>
				))}
			</div>

			{loading && (
				<div className="flex justify-center py-4">
					<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
				</div>
			)}

			{!loading && products.length > 0 && (
				<div className="flex justify-center py-2">
					<button
						onClick={onLoadMore}
						className="text-xs text-gray-500 hover:text-primary transition-colors"
					>
						加载更多产品...
					</button>
				</div>
			)}
		</div>
	);
}