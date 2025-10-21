'use client'

import { useState } from 'react'
import { getAnnouncementPrices } from '@/lib/api-utils'
import { formatDateForApi } from '@/lib/utils'
import { PriceAnnouncement } from '@/app/workspace/types'

interface UseCategoryFilterOptions {
	lastCategoryProducts: PriceAnnouncement[]
	categories: Map<number, string>
	categoryFieldName?: keyof PriceAnnouncement
	onError?: (error: Error) => void
	setLocalProducts: (products: PriceAnnouncement[]) => void
}

interface UseCategoryFilterResult{
	selectedCategory: number
	setSelectedCategory: (categoryId: number) => void
	handleCategoryChange: (categoryId: number, date?: string) => Promise<void>
	remoteProducts: PriceAnnouncement[]
	isLoading: boolean
	setSearchSource: (source: 'local' | 'remote' | null) => void
	setRemoteProducts: (products: PriceAnnouncement[]) => void
}

export function useCategoryFilter({
	lastCategoryProducts,
	categories,
	categoryFieldName = 'levelOneCategory' as keyof PriceAnnouncement,
	onError,
	setLocalProducts
}: UseCategoryFilterOptions): UseCategoryFilterResult {
	const [selectedCategory, setSelectedCategory] = useState<number>(0)
	const [remoteProducts, setRemoteProducts] = useState<PriceAnnouncement[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [searchSource, setSearchSource] = useState<'local' | 'remote' | null>(null)

	const handleCategoryChange = async (categoryId: number, date?: string) => {
		setSelectedCategory(categoryId);

		if (categoryId === 0) {
			setRemoteProducts([]);
			setSearchSource(null);
			return;
		}

		const categoryName = categories.get(categoryId);
		const isLoaded = lastCategoryProducts.some(p => p[categoryFieldName] === categoryName && (p.priceDate !== null && p.priceDate !== date));
		
		if (isLoaded) {
			setRemoteProducts([]);
			setSearchSource('local');
			return;
		}

		try {
			setIsLoading(true);
			setSearchSource('remote');

			const products = await getAnnouncementPrices(categoryId, formatDateForApi(date || ''));
			setRemoteProducts(products);
			setSelectedCategory(categoryId);	
		} catch (error) {
			if (onError && error instanceof Error) {
				onError(error);
				setRemoteProducts([]);
				setSearchSource(null);
			}
		} finally {
			setIsLoading(false);
		}
	}

	return {
		selectedCategory,
		setSelectedCategory,
		handleCategoryChange,
		remoteProducts,
		setRemoteProducts,
		isLoading,
		setSearchSource
	}
} 