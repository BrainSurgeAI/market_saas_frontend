'use client'

import { useState, useEffect, useMemo, useCallback } from "react"
import { ProductTable } from "./ProductTable"
import { useCategoryFilter } from "@/hooks/useCategoryFilter"
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline"
import { PriceAnnouncement } from "@/app/workspace/types"
import { StatsCards, type ProductStats } from "./StatsCards"
import { CustomPagination } from "./CustomPagination"
import { LoadingOverlay } from "@/components/shared/LoadingOverlay"
import { SearchSidebar } from "./SearchSidebar"

interface PriceAnnouncementsProps {
    initialProducts: PriceAnnouncement[]
    currentDate: string
    isPriceNotPublished: boolean
    categories: Map<number, string>
    priceStats: {
        total: number
        increased: number
        decreased: number
        unchanged: number
    }
}

const ITEMS_PER_PAGE = 25;

export function PriceAnnouncements({
    initialProducts,
    currentDate,
    isPriceNotPublished,
    categories
}: PriceAnnouncementsProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
        key: '',
        direction: null
    });
    
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [localProducts, setLocalProducts] = useState<PriceAnnouncement[]>(initialProducts);

    const {
        selectedCategory,
        setSelectedCategory,
        handleCategoryChange,
        remoteProducts,
        setRemoteProducts,
        isLoading,
        setSearchSource
    } = useCategoryFilter({
        lastCategoryProducts: localProducts,
        categories,
        setLocalProducts,
        onError: (error) => {
            console.error('分类筛选出错:', error)
        }
    })

    // Initialize the first category to display
    useEffect(() => {
        if (categories.size > 0) {
            const firstCategoryId = Array.from(categories.keys())[0];
            setSelectedCategory(firstCategoryId);

            const categoryName = categories.get(firstCategoryId);
            const hasLocalData = localProducts.some(p => p.levelOneCategory === categoryName);

            // Only call the remote API if there is no local data
            if (!hasLocalData) {
                setSearchSource('remote');
                handleCategoryChange(firstCategoryId, currentDate);
            } else {
                setSearchSource('local');
            }
        }
    }, [categories, currentDate, localProducts]);


    // 更新搜索过滤逻辑
    const filteredProducts = useMemo(() => {
        console.log('remoteProducts', remoteProducts.length);
        const allProducts = remoteProducts.length > 0 ? [...remoteProducts] : [...localProducts];

        // 如果搜索产品数据中是空的，直接返回空数组
        if (allProducts.length === 0) {
            return [];
        }

        return allProducts.filter(product => {
            const searchTermLower = searchTerm.toLowerCase().trim();

            // 搜索词匹配
            const matchesSearch = !searchTermLower ||
                product.productName.toLowerCase().includes(searchTermLower) ||
                product.levelOneCategory.toLowerCase().includes(searchTermLower) ||
                product.levelThreeCategory.toLowerCase().includes(searchTermLower);

            // 分类匹配
            let matchesCategory = true;
            if (selectedCategory) {
                const categoryName = categories.get(selectedCategory);
                matchesCategory = product.levelOneCategory === categoryName;
            }

            const matches = matchesSearch && matchesCategory;
            return matches;
        });
    }, [localProducts, remoteProducts, searchTerm, selectedCategory, categories]);

    // 应用排序逻辑到过滤后的产品
    const sortedAndFilteredProducts = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) {
            return filteredProducts;
        }

        return [...filteredProducts].sort((a, b) => {
            const getValue = (product: PriceAnnouncement, key: string) => {
                const value = product[key as keyof PriceAnnouncement];
                return key.includes('price') ? parseFloat(value) : value;
            };

            const aValue = getValue(a, sortConfig.key);
            const bValue = getValue(b, sortConfig.key);

            if (sortConfig.direction === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });
    }, [filteredProducts, sortConfig.key, sortConfig.direction]);

    // 分页数据 - 使用排序后的数据
    const paginatedProducts = sortedAndFilteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // 计算当前筛选条件下的统计数据
    const calculateStats = useCallback((): ProductStats => {
        return {
            total: filteredProducts.length,
            increased: filteredProducts.filter(p => parseFloat(p.avgPriceChange) > 0).length,
            decreased: filteredProducts.filter(p => parseFloat(p.avgPriceChange) < 0).length,
            unchanged: filteredProducts.filter(p => parseFloat(p.avgPriceChange) === 0).length,
        };
    }, [filteredProducts]);

    const currentStats = useMemo(() => calculateStats(), [calculateStats]);

    const handleSort = useCallback((key: string) => {
        setSortConfig(prevSort => ({
            key,
            direction:
                prevSort.key === key && prevSort.direction === 'asc'
                    ? 'desc'
                    : prevSort.direction === 'desc'
                        ? null
                        : 'asc'
        }));
        // 排序时重置到第一页
        setCurrentPage(1);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {isLoading && <LoadingOverlay />}

            {isPriceNotPublished && (
                <div className="bg-yellow-50 border-b border-yellow-200">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                            <svg className="h-5 w-5 text-yellow-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-sm font-medium text-yellow-800">
                                {currentDate} 价格尚未发布，请稍后再试
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div className="bg-blue-900 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-white">
                                融链-军采服务中心价格公示平台
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                {/* 移动端搜索按钮 */}
                <div className="lg:hidden mb-4">
                    <button
                        onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs bg-blue-900 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <AdjustmentsHorizontalIcon className="h-4 w-4 text-white" />
                        <span>筛选条件 {filteredProducts.length > 0 && `(${filteredProducts.length})`}</span>
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="lg:flex-1 lg:max-w-[calc(100%-22rem)] w-full">
                        {/* 统计卡片区域 */}
                        <StatsCards stats={currentStats} />

                        {/* 主要内容区域 */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <ProductTable
                                products={paginatedProducts}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                            />
                            <div className="py-4 px-6 border-t border-gray-200">
                                <CustomPagination
                                    currentPage={currentPage}
                                    setCurrentPage={setCurrentPage}
                                    totalItems={filteredProducts.length}
                                    itemsPerPage={ITEMS_PER_PAGE} />
                            </div>
                        </div>
                    </div>

                    <SearchSidebar
                        isMobileFilterOpen={isMobileFilterOpen}
                        setIsMobileFilterOpen={setIsMobileFilterOpen}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        handleCategoryChange={handleCategoryChange}
                        categories={categories}
                        filteredProducts={filteredProducts}
                        currentDate={currentDate}
                        setRemoteProducts={setRemoteProducts} />

                    {/* 移动端遮罩层 */}
                    {isMobileFilterOpen && (
                        <div
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
                            onClick={() => setIsMobileFilterOpen(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}