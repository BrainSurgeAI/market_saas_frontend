"use client"

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/WorkspaceContext";
import {
    ArrowLeft,
    // Save,
    // Import,
    Upload,
    Loader2,
    CheckCircle,
    AlertCircle,
    Check,
} from "lucide-react";


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { Button } from "@/components/ui/button";
import { 
    AlertDialog,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

import { formatDate } from "../helpers";
import { toast } from "@/hooks/use-toast";
import { loadFromIndexedDB, openDatabase, saveToIndexedDB, STORE_NAME } from "@/lib/indexedDB";

// 获取认证令牌
function getAuthToken(): string {
    if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'auth-token') {
                return value;
            }
        }
    }
    return '';
}

// 从token中提取用户名
function getUsernameFromToken(): string {
    const token = getAuthToken();
    if (!token) return '';

    try {
        // JWT token的payload部分是中间的部分，用.分割
        const payload = token.split('.')[1];
        if (payload) {
            const decoded = JSON.parse(atob(payload));
            return decoded.username || decoded.sub || '';
        }
    } catch (error) {
        console.error('Error extracting username from token:', error);
    }
    return '';
}
import SearchBar from "./SearchBar";
import StatusCell from "./Table/StatusBar";
import PriceInputCell from "./Table/PriceInputCell";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface Product {
    id: number;
    name: string;
    category: string;
    unit: string;
    minPrice: number | 0;
    maxPrice: number | 0;
    avgPrice: number | 0;
    lastAvgPrice: number | 0;
    lastMinPrice: number | 0;
    lastMaxPrice: number | 0;
    status: string;
    avgPriceDiff?: number;
    priceSource: string;
    publishDate: string;
}

interface PaginationData {
    total: number;
    page: number;
    page_size: number;
}

type PriceData = {
    minPrice: number | string;
    maxPrice: number | string;
    avgPrice: number | string;
    minPriceDiff?: number | string;
    maxPriceDiff?: number | string;
    avgPriceDiff?: number | string;
    variance?: string;
};

const formatPrice = (price: any): string => {
    if (price === undefined || price === null) return "-";

    try {
        const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
        return isNaN(numPrice) ? String(price) : numPrice.toFixed(2);
    } catch (e) {
        return String(price);
    }
};

export function PriceEntryPage({
    products: initialProducts,
    pagination: initialPagination,
    userRoles,
    orgName
}: {
    products: Product[],
    pagination: PaginationData,
    userRoles: string[],
    orgName?: string // orgName现在是可选的
}) {
    const router = useRouter();
    const { org_name } = useParams();
    const { organization } = useWorkspace();

    // 优先使用WorkspaceContext中的组织信息，然后是URL参数，最后是props
    const currentOrgName = organization?.nameHash || org_name || orgName;

    console.log('PriceEntryPage - organization from context:', organization?.nameHash);
    console.log('PriceEntryPage - org_name from params:', org_name);
    console.log('PriceEntryPage - orgName from props:', orgName);
    console.log('PriceEntryPage - currentOrgName:', currentOrgName);

    // 如果没有org_name，显示错误
    if (!currentOrgName) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-2">错误</h2>
                    <p className="text-gray-600">无法获取组织信息，请重新访问页面</p>
                    <p className="text-sm text-gray-400 mt-2">Context: {JSON.stringify(organization?.nameHash)}</p>
                </div>
            </div>
        );
    }

    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [priceInputs, setPriceInputs] = useState<Record<number, PriceData>>({});
    const [saveStatus, setSaveStatus] = useState<Record<number, string>>({});
    const [draftStatus, setDraftStatus] = useState<Record<number, boolean>>({});
    const [products, setProducts] = useState<Product[]>(Array.isArray(initialProducts) ? initialProducts : []);
    const [pagination, setPagination] = useState<PaginationData>(initialPagination || { total: 0, page: 1, page_size: 10 });
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);

    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [submitMessage, setSubmitMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(initialPagination?.page || 1);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
    const [confirmTitle, setConfirmTitle] = useState("确认提交");
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmText, setConfirmText] = useState("确认提交");
    
    const [productToSave, setProductToSave] = useState<number | null>(null);

    const [userRole, setUserRole] = useState<string>(userRoles[0]);

    const itemsPerPage = pagination?.page_size || 10;

    // 获取指定页面的数据
    const fetchPageData = async (page: number, pageSize?: number, search?: string, category?: string) => {
        try {
            console.log('fetchPageData called:', { page, pageSize, search, category });
            setDataLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                page_size: (pageSize || itemsPerPage).toString(),
            });

            if (search && search.trim()) {
                params.append('search', search.trim());
            }

            if (category && category !== 'all') {
                params.append('category', category);
            }

            console.log('API Request URL:', `/api/product-prices?${params.toString()}`);

            const response = await fetch(
                `/api/product-prices?${params.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAuthToken()}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch page data: ${response.status}`);
            }

            const result = await response.json();
            console.log('API Response:', result); // Debug log

            // 处理后端API的响应结构
            // fetchRemoteData 返回的是后端的原始数据
            let products = [];
            let paginationData = { total: 0, page: page, page_size: pageSize || itemsPerPage };

            console.log('Raw API result:', result); // Debug log

            // 后端API的实际格式：{ code: 200, message: 'success', data: { data: [...], total: 219, page: 2, page_size: 10 } }
            if (result.data && result.data.data) {
                products = Array.isArray(result.data.data) ? result.data.data : [];
                paginationData = {
                    total: result.data.total || 0,
                    page: result.data.page || page,
                    page_size: result.data.page_size || (pageSize || itemsPerPage)
                };
            } else if (Array.isArray(result.data)) {
                // 如果data直接是数组
                products = result.data;
                paginationData = {
                    total: result.total || 0,
                    page: result.page || page,
                    page_size: result.page_size || (pageSize || itemsPerPage)
                };
            } else if (Array.isArray(result)) {
                // 如果结果直接是数组
                products = result;
            }

            console.log('Processed data:', { products, paginationData }); // Debug log
            setProducts(products);
            setPagination(paginationData);
            setCurrentPage(paginationData.page); // 更新当前页码
        } catch (error) {
            console.error('Error fetching page data:', error);
            toast({
                title: "加载数据失败",
                description: "无法加载指定页面的数据，请稍后重试",
                variant: "destructive",
            });
        } finally {
            setDataLoading(false);
        }
    };

    // 搜索函数
    const handleSearch = () => {
        setCurrentPage(1); // 重置到第一页
        fetchPageData(1, itemsPerPage, searchTerm, selectedCategory);
    };

    const categories = useMemo(() => {
        if (!Array.isArray(products)) {
            return [];
        }
        const uniqueCategories = new Set<string>();
        products.forEach(product => {
            if (product && product.category) {
                uniqueCategories.add(product.category);
            }
        });
        return Array.from(uniqueCategories).sort();
    }, [products]);

    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [batchAuditDialog, setBatchAuditDialog] = useState<{
        isOpen: boolean;
        action: 'approve' | 'reject';
        count: number;
    }>({
        isOpen: false,
        action: 'approve',
        count: 0
    });

    const handleSubmitPricesClick = () => {
        setConfirmTitle("确认提交价格数据");
        setConfirmMessage("您确定要提交价格数据吗？提交后，数据将被同步到服务器。");
        setConfirmText("确认提交");
        setConfirmAction(() => confirmSubmitPrices);
        setShowConfirmDialog(true);
    };

    const confirmSubmitPrices = () => {
        handleSubmitPrices();
    };

    // 加载时从 IndexedDB 恢复暂存状态
    useEffect(() => {
        const loadSavedData = async () => {
            try {
                const loadedData = await loadFromIndexedDB(currentOrgName as string);
                if (loadedData) {
                    setPriceInputs(loadedData);

                    // 设置所有已保存产品的暂存状态
                    const newDraftStatus: Record<number, boolean> = {};
                    Object.keys(loadedData).forEach(id => {
                        newDraftStatus[parseInt(id)] = true;
                    });
                    setDraftStatus(newDraftStatus);
                }
            } catch (e) {
                console.error("Failed to load saved price data", e);
            }
        };

        loadSavedData();
    }, [currentOrgName]);

    // Loading data from remote server
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);


    const handlePriceChange = (productId: number, field: 'minPrice' | 'maxPrice', value: string) => {
        const numValue = value === '' ? '' : parseFloat(value);

        // 获取当前产品信息
        const product = products.find(p => p.id === productId);
        if (!product) return;

        // Update the specific field
        setPriceInputs(prev => {
            const productPrices = prev[productId] || {};
            const updatedPrices = { ...productPrices, [field]: numValue };

            if (typeof updatedPrices.minPrice === 'number' && typeof updatedPrices.maxPrice === 'number') {
                updatedPrices.avgPrice = ((updatedPrices.minPrice + updatedPrices.maxPrice) / 2).toFixed(2);
            } else if (field === 'minPrice' && numValue !== '') {
                if (typeof updatedPrices.maxPrice === 'number') {
                    updatedPrices.avgPrice = ((numValue + updatedPrices.maxPrice) / 2).toFixed(2);
                } else if (product.lastMaxPrice) {
                  
                    const maxPrice = typeof product.lastMaxPrice === 'string'
                        ? parseFloat(product.lastMaxPrice)
                        : Number(product.lastMaxPrice);

                    if (!isNaN(maxPrice) && maxPrice > 0) {
                        updatedPrices.avgPrice = ((numValue + maxPrice) / 2).toFixed(2);
                    } else {
                        updatedPrices.avgPrice = numValue.toFixed(2);
                    }
                } else {
                    updatedPrices.avgPrice = numValue.toFixed(2);
                }
            } else if (field === 'maxPrice' && numValue !== '') {
                if (typeof updatedPrices.minPrice === 'number') {
                    updatedPrices.avgPrice = ((updatedPrices.minPrice + numValue) / 2).toFixed(2);
                } else if (product.lastMinPrice) {
                    const minPrice = typeof product.lastMinPrice === 'string'
                        ? parseFloat(product.lastMinPrice)
                        : Number(product.lastMinPrice);

                    if (!isNaN(minPrice) && minPrice > 0) {
                        updatedPrices.avgPrice = ((minPrice + numValue) / 2).toFixed(2);
                    } else {
                        updatedPrices.avgPrice = numValue.toFixed(2);
                    }
                } else {
                    updatedPrices.avgPrice = numValue.toFixed(2);
                }
            } else {
                updatedPrices.avgPrice = '';
            }

            if (updatedPrices.avgPrice && updatedPrices.avgPrice !== '' && product.lastAvgPrice) {
                try {
                    const numAvgPrice = typeof updatedPrices.avgPrice === 'string'
                        ? parseFloat(updatedPrices.avgPrice)
                        : Number(updatedPrices.avgPrice);
                    const lastPrice = typeof product.lastAvgPrice === 'string'
                        ? parseFloat(product.lastAvgPrice)
                        : Number(product.lastAvgPrice);

                    if (!isNaN(numAvgPrice) && !isNaN(lastPrice) && lastPrice !== 0) {
                        updatedPrices.variance = ((numAvgPrice - lastPrice) / lastPrice * 100).toFixed(1);
                    }
                } catch (e) {
                    console.error("Error calculating price variance in handlePriceChange:", e);
                }
            }

            return {
                ...prev,
                [productId]: updatedPrices
            };
        });

        if (saveStatus[productId]) {
            const updatedStatus = { ...saveStatus };
            delete updatedStatus[productId];
            setSaveStatus(updatedStatus);
        }
    };

    // 提交价格
    const handleSubmitPrices = async () => {
        try {
            
            setShowSubmitDialog(true);
            setSubmitStatus('loading');
            setSubmitMessage('正在提交价格数据，请勿关闭浏览器...');

            // 从 IndexedDB 读取数据
            const priceData = await loadFromIndexedDB(currentOrgName as string);
            if (!priceData || Object.keys(priceData).length === 0) {
                setSubmitStatus('error');
                setSubmitMessage('没有可提交的价格数据，请在提交前保存');
                return;
            }

            // 筛选出完整的记录（同时包含最高价、最低价和中间价）
            const completeEntries: Record<string, any> = {};
            const incompleteEntries: Record<string, any> = {};

            Object.entries(priceData).forEach(([productId, prices]) => {
                const priceInfo = prices as PriceData;

                const minPriceNum = typeof priceInfo.minPrice === 'string'
                    ? parseFloat(priceInfo.minPrice)
                    : Number(priceInfo.minPrice);

                const maxPriceNum = typeof priceInfo.maxPrice === 'string'
                    ? parseFloat(priceInfo.maxPrice)
                    : Number(priceInfo.maxPrice);

                // 检查是否所有必要字段都存在且有值
                if (
                    priceInfo.minPrice !== undefined && priceInfo.minPrice !== '' &&
                    priceInfo.maxPrice !== undefined && priceInfo.maxPrice !== '' &&
                    priceInfo.avgPrice !== undefined && priceInfo.avgPrice !== '' &&
                    minPriceNum > 0 && maxPriceNum > 0
                ) {
                    completeEntries[productId] = priceInfo;
                } else {
                    incompleteEntries[productId] = priceInfo;
                }
            });

            console.log(`completeEntries: ${JSON.stringify(completeEntries)}`);
            console.log(`incompleteEntries: ${JSON.stringify(incompleteEntries)}`);

            // 检查是否有完整记录可提交
            if (Object.keys(completeEntries).length === 0) {
                setSubmitStatus('error');
                setSubmitMessage('没有可提交的完整价格数据，请确保填写了最高价和最低价');
                return;
            }

            // 转换数据格式以适应API需求
            const formattedData = Object.entries(completeEntries).map(([productId, prices]) => {
                const priceInfo = prices as PriceData;

                // 确保所有价格都是字符串格式
                const formattedItem = {
                    productId: parseInt(productId),
                    minPrice: typeof priceInfo.minPrice === 'number' ? priceInfo.minPrice.toString() : priceInfo.minPrice,
                    maxPrice: typeof priceInfo.maxPrice === 'number' ? priceInfo.maxPrice.toString() : priceInfo.maxPrice,
                    avgPrice: typeof priceInfo.avgPrice === 'number' ? priceInfo.avgPrice.toString() : priceInfo.avgPrice,
                    minPriceDiff: priceInfo.minPriceDiff,
                    maxPriceDiff: priceInfo.maxPriceDiff,
                    avgPriceDiff: priceInfo.avgPriceDiff
                };

                return formattedItem;
            });

            // 发送到服务器
            const username = getUsernameFromToken();
            const response = await fetch(`/api/organizations/${currentOrgName}/prices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({ prices: formattedData })
            });

            if (!response.ok) {
                setSubmitStatus('error');
                const result = await response.json();
                setSubmitMessage(result.error);
                return;
            }

            const submittedProductIds = Object.keys(completeEntries).map(id => parseInt(id));

            // 使用React状态更新产品状态，同时保留提交的价格值
            setProducts(prevProducts =>
                prevProducts.map(product => {
                    if (submittedProductIds.includes(product.id)) {
                        const productPriceData = completeEntries[product.id.toString()];
                        // 将产品状态更新为 PENDING，同时更新价格数据
                        return { 
                            ...product, 
                            status: "PENDING",
                            minPrice: typeof productPriceData.minPrice === 'string' 
                                ? parseFloat(productPriceData.minPrice) 
                                : productPriceData.minPrice,
                            maxPrice: typeof productPriceData.maxPrice === 'string' 
                                ? parseFloat(productPriceData.maxPrice) 
                                : productPriceData.maxPrice,
                            avgPrice: typeof productPriceData.avgPrice === 'string' 
                                ? parseFloat(productPriceData.avgPrice) 
                                : productPriceData.avgPrice,
                            priceSource: 'TODAY' // 标记为今日价格
                        };
                    }
                    return product;
                })
            );

            // 更新提交状态
            setSaveStatus(prev => {
                const newStatus: Record<number, string> = { ...prev };
                Object.keys(completeEntries).forEach(id => {
                    newStatus[parseInt(id)] = "success";
                });
                return newStatus;
            });

            // 清理 IndexedDB 中的数据
            if (Object.keys(incompleteEntries).length > 0) {
                await saveToIndexedDB(currentOrgName as string, incompleteEntries);
            } else {
                // 如果没有不完整的记录，清除所有数据
                const db = await openDatabase();
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                store.delete(currentOrgName as string);
            }

            // 更新暂存状态，移除已提交的产品
            setDraftStatus(prev => {
                const newDraftStatus = { ...prev };
                Object.keys(completeEntries).forEach(id => {
                    delete newDraftStatus[parseInt(id)];
                });
                return newDraftStatus;
            });

            // 显示成功消息
            setSubmitStatus('success');
            setSubmitMessage(`成功提交了 ${Object.keys(completeEntries).length} 条价格数据！`);
        } catch (error) {
            console.error("提交价格时出错:", error);
            setSubmitStatus('error');
            setSubmitMessage('提交失败，请重试');
        }
    };

    const handleCloseDialog = () => {
        setShowSubmitDialog(false);
        setSubmitStatus('idle');
        setSubmitMessage('');
    };
    

    // 添加单行保存函数
    const handleSaveProduct = async (productId: number) => {
        try {
            setIsSaving(true);
            
            // 获取当前产品
            const product = products.find(p => p.id === productId);
            if (!product) {
                toast({
                    title: "保存失败",
                    description: "找不到指定的产品",
                    variant: "destructive",
                });
                setIsSaving(false);
                return;
            }
            
            // 检查是否有价格输入改动
            const productInput = priceInputs[productId];
            const hasAnyPriceChanges = productInput && (
                typeof productInput.minPrice === 'number' || 
                typeof productInput.maxPrice === 'number'
            );
            
            // 如果没有任何价格输入改动，显示确认对话框
            if (!hasAnyPriceChanges) {
                setProductToSave(productId);
                setConfirmTitle("使用历史价格");
                setConfirmMessage(`您尚未修改 "${product.name}" 的价格，是否要将最近发布价格作为今日价格？`);
                setConfirmText("确认使用");
                setConfirmAction(() => () => confirmUsePreviousPriceForProduct(productId));
                setShowConfirmDialog(true);
                setIsSaving(false);
                return;
            }
            
            // 原有的保存逻辑
            const enhancedProductData: PriceData = {
                minPrice: productInput && productInput.minPrice !== undefined && productInput.minPrice !== '' ? productInput.minPrice : (product.minPrice > 0 ? product.minPrice : product.lastMinPrice),
                maxPrice: productInput && productInput.maxPrice !== undefined && productInput.maxPrice !== '' ? productInput.maxPrice : (product.maxPrice > 0 ? product.maxPrice : product.lastMaxPrice),
                avgPrice: productInput && productInput.avgPrice !== undefined && productInput.avgPrice !== '' ? productInput.avgPrice : (product.avgPrice > 0 ? product.avgPrice : product.lastAvgPrice),
                variance: productInput && productInput.variance,
                minPriceDiff: 0,
                maxPriceDiff: 0,
                avgPriceDiff: 0
            };

            // 计算最低价差值
            if (enhancedProductData.minPrice !== undefined && enhancedProductData.minPrice !== '' && product.lastMinPrice) {
                const minPriceNum = typeof enhancedProductData.minPrice === 'string'
                    ? parseFloat(enhancedProductData.minPrice)
                    : Number(enhancedProductData.minPrice);

                if (!isNaN(minPriceNum) && minPriceNum > 0) {
                    enhancedProductData.minPriceDiff = (minPriceNum - product.lastMinPrice).toFixed(2);
                }
            }

            // 计算最高价差值
            if (enhancedProductData.maxPrice !== undefined && enhancedProductData.maxPrice !== '' && product.lastMaxPrice) {
                const maxPriceNum = typeof enhancedProductData.maxPrice === 'string'
                    ? parseFloat(enhancedProductData.maxPrice)
                    : Number(enhancedProductData.maxPrice);

                if (!isNaN(maxPriceNum) && maxPriceNum > 0) {
                    enhancedProductData.maxPriceDiff = (maxPriceNum - product.lastMaxPrice).toFixed(2);
                }
            }

            // 计算平均价差值
            if (enhancedProductData.avgPrice !== undefined && enhancedProductData.avgPrice !== '' && product.lastAvgPrice) {
                const avgPriceNum = typeof enhancedProductData.avgPrice === 'string'
                    ? parseFloat(enhancedProductData.avgPrice)
                    : Number(enhancedProductData.avgPrice);

                if (!isNaN(avgPriceNum) && avgPriceNum > 0) {
                    enhancedProductData.avgPriceDiff = (avgPriceNum - product.lastAvgPrice).toFixed(2);
                }
            }

            // 如果平均价存在但变动率不存在，计算变动率
            if (enhancedProductData.avgPrice && !enhancedProductData.variance && product.lastAvgPrice) {
                try {
                    const avgPriceNum = typeof enhancedProductData.avgPrice === 'string'
                        ? parseFloat(enhancedProductData.avgPrice)
                        : Number(enhancedProductData.avgPrice);
                    const lastPrice = typeof product.lastAvgPrice === 'string'
                        ? parseFloat(product.lastAvgPrice)
                        : Number(product.lastAvgPrice);

                    if (!isNaN(avgPriceNum) && !isNaN(lastPrice) && lastPrice !== 0) {
                        enhancedProductData.variance = ((avgPriceNum - lastPrice) / lastPrice * 100).toFixed(1);
                    }
                } catch (e) {
                    console.error("Error calculating price variance in handleSaveProduct:", e);
                }
            }

            // 获取当前保存的数据
            const currentData = await loadFromIndexedDB(currentOrgName as string) || {};

            // 更新单个产品的数据
            const updatedData = {
                ...currentData,
                [productId]: enhancedProductData
            };

            // 保存到IndexedDB
            const saveResult = await saveToIndexedDB(currentOrgName as string, updatedData);

            if (saveResult) {
                // 更新产品的暂存状态
                setDraftStatus(prev => ({
                    ...prev,
                    [productId]: true
                }));

                // 更新保存状态
                setSaveStatus(prev => ({
                    ...prev,
                    [productId]: "success"
                }));

                toast({
                    title: "保存成功",
                    description: `已保存产品 ${product.name} 的价格数据`,
                    variant: "default",
                });

                // 3秒后清除状态
                setTimeout(() => {
                    setSaveStatus(prev => {
                        const newStatus = { ...prev };
                        delete newStatus[productId];
                        return newStatus;
                    });
                }, 3000);
            }
        } catch (e) {
            console.error("Failed to save product data:", e);
            toast({
                title: "保存失败，请重试",
                description: "您的浏览器可能不支持 IndexedDB 或存储空间已满",
                variant: "destructive",
            });
        }
    };

    // 新增函数，确认使用昨日价格作为今日价格（单个产品）
    const confirmUsePreviousPriceForProduct = async (productId: number) => {
        try {
            setIsSaving(true);
            setShowConfirmDialog(false);
            
            // 获取当前产品
            const product = products.find(p => p.id === productId);
            if (!product) {
                toast({
                    title: "保存失败",
                    description: "找不到指定的产品",
                    variant: "destructive",
                });
                setIsSaving(false);
                return;
            }
            
            if (product.lastMinPrice && product.lastMaxPrice) {
                const lastMinPrice = typeof product.lastMinPrice === 'string' 
                    ? parseFloat(product.lastMinPrice) 
                    : Number(product.lastMinPrice);
                
                const lastMaxPrice = typeof product.lastMaxPrice === 'string' 
                    ? parseFloat(product.lastMaxPrice) 
                    : Number(product.lastMaxPrice);
                
                const lastAvgPrice = typeof product.lastAvgPrice === 'string'
                    ? parseFloat(product.lastAvgPrice)
                    : Number(product.lastAvgPrice);
                
                if (!isNaN(lastMinPrice) && !isNaN(lastMaxPrice) && lastMinPrice > 0 && lastMaxPrice > 0) {
                    // 使用昨日价格构造今日价格数据
                    const avgPrice = lastAvgPrice || ((lastMinPrice + lastMaxPrice) / 2);
                    const enhancedData: Record<number, PriceData> = {
                        [productId]: {
                            minPrice: lastMinPrice,
                            maxPrice: lastMaxPrice,
                            avgPrice: avgPrice,
                            minPriceDiff: 0,
                            maxPriceDiff: 0,
                            avgPriceDiff: 0,
                            variance: "0.0"
                        }
                    };
                    
                    // 保存到IndexedDB
                    const saveResult = await saveToIndexedDB(currentOrgName as string, enhancedData);
                    
                    if (saveResult) {
                        // 更新产品的暂存状态
                        setDraftStatus(prev => ({...prev, [productId]: true}));
                        
                        // 更新价格输入状态
                        setPriceInputs(prev => ({
                            ...prev,
                            [productId]: enhancedData[productId]
                        }));
                        
                        toast({
                            title: "保存成功",
                            description: `已成功使用昨日价格作为产品 "${product.name}" 的今日价格`,
                            variant: "default",
                        });
                    } else {
                        toast({
                            title: "保存失败",
                            description: "无法保存到本地数据库，请稍后重试",
                            variant: "destructive",
                        });
                    }
                } else {
                    toast({
                        title: "无法使用昨日价格",
                        description: `产品 "${product.name}" 没有有效的昨日价格数据`,
                        variant: "default",
                    });
                }
            } else {
                toast({
                    title: "无法使用昨日价格",
                    description: `产品 "${product.name}" 没有昨日价格数据`,
                    variant: "default",
                });
            }
        } catch (error) {
            console.error("Error in confirmUsePreviousPriceForProduct:", error);
            toast({
                title: "操作失败",
                description: "使用昨日价格时发生错误",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // 使用服务端过滤和分页，products 就是过滤和分页后的结果
    const filteredProducts = Array.isArray(products) ? products : [];
    const paginatedProducts = Array.isArray(products) ? products : [];

    // Debug log
    console.log('Product states:', {
        products,
        filteredProducts,
        paginatedProducts,
        isArray: Array.isArray(paginatedProducts)
    });

    const handlePageChange = (page: number) => {
        console.log('handlePageChange called:', { page, currentPage, itemsPerPage, searchTerm, selectedCategory });
        if (page !== currentPage) {
            setCurrentPage(page);
            fetchPageData(page, itemsPerPage, searchTerm, selectedCategory);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getPriceVariance = (product: Product) => {
        // 首先检查用户输入的数据
        const userInputAvgPrice = priceInputs[product.id]?.avgPrice;
        if (userInputAvgPrice && userInputAvgPrice !== '' && product.lastAvgPrice) {
            try {
                const numAvgPrice = typeof userInputAvgPrice === 'string'
                    ? parseFloat(userInputAvgPrice)
                    : Number(userInputAvgPrice);
                const lastPrice = typeof product.lastAvgPrice === 'string'
                    ? parseFloat(product.lastAvgPrice)
                    : Number(product.lastAvgPrice);

                if (isNaN(numAvgPrice) || isNaN(lastPrice) || lastPrice === 0) return null;

                const variance = ((numAvgPrice - lastPrice) / lastPrice) * 100;
                return variance.toFixed(1);
            } catch (e) {
                console.error("Error calculating price variance from user input:", e);
            }
        }

        // 如果用户没有输入，再检查API返回的值
        if (product.avgPrice !== undefined && product.avgPrice !== null && product.lastAvgPrice) {
            try {
                // 计算百分比变动
                const todayAvgPrice = typeof product.avgPrice === 'string'
                    ? parseFloat(product.avgPrice)
                    : Number(product.avgPrice);
                const yestodayAvgPrice = typeof product.lastAvgPrice === 'string'
                    ? parseFloat(product.lastAvgPrice)
                    : Number(product.lastAvgPrice);

                if (isNaN(todayAvgPrice) || isNaN(yestodayAvgPrice) || yestodayAvgPrice === 0 || todayAvgPrice === 0) return null;

                const variance = ((todayAvgPrice - yestodayAvgPrice) / yestodayAvgPrice) * 100;
                return variance.toFixed(1);
            } catch (e) {
                console.error("Error calculating price variance from API data:", e);
            }
        }

        return null;
    };

    const getPriceVarianceColor = (variance: string | null) => {
        if (variance === null) return "";
        const numVariance = parseFloat(variance);
        if (numVariance > 0) return "text-red-500";
        if (numVariance < 0) return "text-green-500";
        return "text-gray-500";
    };

    // 状态映射函数：将英文状态映射为中文
    const getStatusText = (status: string | null | undefined): string => {
        if (!status) return "";

        const statusMap: Record<string, string> = {
            "PENDING": "待审核",
            "APPROVED": "已审核",
            "PUBLISHED": "已发布",
            "REJECTED": "已拒绝"
        };

        return statusMap[status] || status;
    };

    // 获取状态对应的样式
    const getStatusStyle = (status: string | null | undefined): string => {
        if (!status) return "";

        const styleMap: Record<string, string> = {
            "PENDING": "text-amber-500 border-amber-500",
            "APPROVED": "text-green-500 border-green-500 bg-green-50",
            "PUBLISHED": "text-blue-500 border-blue-500 bg-blue-50",
            "REJECTED": "text-red-500 border-red-500 bg-red-50"
        };

        return styleMap[status] || "text-gray-500 border-gray-500";
    };

    // 审核对话框状态
    const [auditDialog, setAuditDialog] = useState<{
        isOpen: boolean;
        product: Product | null;
        action: 'approve' | 'reject';
    }>({
        isOpen: false,
        product: null,
        action: 'approve'
    });

    // 处理审核按钮点击
    const handleAuditClick = (product: Product) => {
        // 如果产品状态是PENDING，默认动作是approve，否则是reject
        const defaultAction = product.status === 'PENDING' ? 'approve' : 'reject';
        
        setAuditDialog({
            isOpen: true,
            product,
            action: defaultAction
        });
    };

    // 处理拒绝按钮点击
    const handleRejectClick = (product: Product) => {
        setAuditDialog({
            isOpen: true,
            product,
            action: 'reject'
        });
    };

    // 关闭审核对话框
    const handleCloseAuditDialog = () => {
        setAuditDialog({
            isOpen: false,
            product: null,
            action: 'approve'
        });
    };

    // 确认审核操作
    const confirmAudit = async () => {
        if (!auditDialog.product) return;
        
        try {
            setIsSaving(true);
            
            const productId = auditDialog.product.id;
            const action = auditDialog.action;
            const method = 'PATCH';
            
            // 构建API URL
            const apiUrl = `/api/tenants/${currentOrgName}/prices/aprox-price`;
            
            // 调用远程API
            const response = await fetch(apiUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({
                    products: [productId],
                    status: action === 'approve' ? 'PUBLISHED' : 'REJECTED'
                })
            });
            
            if (!response.ok) {
                throw new Error(`审核操作失败: ${response.status}`);
            }
            
            // 更新本地状态
            setProducts(prevProducts => 
                prevProducts.map(p => {
                    if (p.id === productId) {
                        // 根据操作更新状态
                        const newStatus = action === 'approve' ? 'PUBLISHED' : 'REJECTED';
                        return { ...p, status: newStatus };
                    }
                    return p;
                })
            );
            
            // 更新过滤后的产品列表
            const filteredProducts = products.filter(p => p.status === 'PENDING');
            setProducts(prevProducts => 
                prevProducts.map(p => {
                    if (p.id === productId) {
                        const newStatus = action === 'approve' ? 'PUBLISHED' : 'REJECTED';
                        return { ...p, status: newStatus };
                    }
                    return p;
                })
            );
            
            toast({
                title: "操作成功",
                description: `产品价格已${action === 'approve' ? '发布' : '拒绝'}`,
                variant: "default",
            });
            
            // 关闭对话框
            handleCloseAuditDialog();
        } catch (error) {
            console.error("审核操作出错:", error);
            toast({
                title: "操作失败",
                description: "无法完成审核操作，请稍后重试",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // 处理选择所有产品
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedProducts([]);
        } else {
            const pendingProductIds = paginatedProducts
                .filter(product => product.status === 'PENDING')
                .map(product => product.id);
            setSelectedProducts(pendingProductIds);
        }
        setSelectAll(!selectAll);
    };

    // 处理选择单个产品
    const handleSelectProduct = (productId: number, checked: boolean) => {
        if (checked) {
            setSelectedProducts(prev => [...prev, productId]);
        } else {
            setSelectedProducts(prev => prev.filter(id => id !== productId));
        }
    };

    // 处理批量审核
    const handleBatchAudit = (action: 'approve' | 'reject') => {
        if (selectedProducts.length === 0) {
            toast({
                title: "请先选择产品",
                description: "请至少选择一个待审核的产品",
                variant: "destructive",
            });
            return;
        }

        setBatchAuditDialog({
            isOpen: true,
            action,
            count: selectedProducts.length
        });
    };

    // 确认批量审核操作
    const confirmBatchAudit = async () => {
        if (selectedProducts.length === 0) return;
        
        try {
            setIsSaving(true);
            
            const action = batchAuditDialog.action;
            
            // 构建API URL
            const apiUrl = `/api/tenants/${currentOrgName}/prices/aprox-price`;
            
            // 调用远程API
            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({ products: selectedProducts, status: action === 'approve' ? 'PUBLISHED' : 'REJECTED' })
            });
            
            if (!response.ok) {
                throw new Error(`批量审核操作失败: ${response.status}`);
            }
            
            // 更新本地状态
            setProducts(prevProducts => 
                prevProducts.map(p => {
                    if (selectedProducts.includes(p.id)) {
                        // 根据操作更新状态
                        const newStatus = action === 'approve' ? 'PUBLISHED' : 'REJECTED';
                        return { ...p, status: newStatus };
                    }
                    return p;
                })
            );
            
            toast({
                title: "批量操作成功",
                description: `已成功${action === 'approve' ? '发布' : '拒绝'} ${selectedProducts.length} 个产品价格`,
                variant: "default",
            });
            
            // 清空选择
            setSelectedProducts([]);
            setSelectAll(false);
            
            // 关闭对话框
            setBatchAuditDialog({
                isOpen: false,
                action: 'approve',
                count: 0
            });
        } catch (error) {
            console.error("批量审核操作出错:", error);
            toast({
                title: "操作失败",
                description: "无法完成批量审核操作，请稍后重试",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // 检查当前页是否所有待审核产品都被选中
    useEffect(() => {
        const pendingProductIds = paginatedProducts
            .filter(product => product.status === 'PENDING')
            .map(product => product.id);
        
        const allSelected = pendingProductIds.length > 0 && 
            pendingProductIds.every(id => selectedProducts.includes(id));
        
        setSelectAll(allSelected);
    }, [paginatedProducts, selectedProducts]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">加载中...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* 确认对话框 - 使用showConfirmDialog状态 */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
                        <div className="text-sm text-muted-foreground">
                            <div className="py-4">{confirmMessage}</div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            取消
                        </Button>
                        <Button onClick={() => {
                            setShowConfirmDialog(false);
                            confirmAction();
                        }}>
                            {confirmText}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 状态对话框 */}
            <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {submitStatus === 'loading' && '正在提交...'}
                            {submitStatus === 'success' && '提交成功'}
                            {submitStatus === 'error' && '提交失败'}
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="py-4 flex flex-col items-center justify-center">
                        {submitStatus === 'loading' && (
                            <div className="flex flex-col items-center space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <div>正在提交价格数据，请稍候...</div>
                            </div>
                        )}
                        {submitStatus === 'success' && (
                            <div className="flex flex-col items-center space-y-4">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                                <div>{submitMessage || '价格数据已成功提交'}</div>
                            </div>
                        )}
                        {submitStatus === 'error' && (
                            <div className="flex flex-col items-center space-y-4">
                                <AlertCircle className="h-8 w-8 text-red-500" />
                                <div>{submitMessage || '提交价格数据时发生错误'}</div>
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <Button onClick={() => handleCloseDialog()}>
                            {submitStatus === 'loading' ? '等待中...' : '关闭'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 页面头部 */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="mr-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        返回
                    </Button>
                    <div>
                        <h3 className="text-xl font-bold">产品报价</h3>
                        <p className="text-muted-foreground text-sm">{formatDate(new Date())}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {userRole === 'PRICER' && (
                        <Button variant="destructive" size="sm" onClick={handleSubmitPricesClick}
                            disabled={submitStatus === 'loading'}>
                            <Upload className="h-4 w-4 mr-2" />
                            提交报价
                        </Button>
                    )}
                    {/* <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        导出
                    </Button> */}
                </div>
            </div>
            {/* 筛选和搜索区 */}
            <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categories={categories}
                onSearch={handleSearch}
                loading={dataLoading}
            />

            {/* 批量操作按钮 - 仅在审核员角色且有选中项时显示 */}
            {userRole === 'AUDITOR' && (
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-muted-foreground">
                        {selectedProducts.length > 0 ? `已选择 ${selectedProducts.length} 个产品` : '请选择要批量操作的产品'}
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleBatchAudit('approve')}
                            disabled={selectedProducts.length === 0}
                        >
                            <Check className="h-4 w-4 mr-2" />
                            批量通过
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleBatchAudit('reject')}
                            disabled={selectedProducts.length === 0}
                        >
                            批量拒绝
                        </Button>
                    </div>
                </div>
            )}

            {/* 产品列表和报价表格 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {userRole === 'AUDITOR' && (
                                <TableHead className="w-[40px] text-xs font-semibold">
                                    <Checkbox 
                                        checked={selectAll} 
                                        onCheckedChange={handleSelectAll}
                                        aria-label="选择所有产品"
                                    />
                                </TableHead>
                            )}
                            <TableHead className="w-[150px] text-xs font-semibold">产品名称</TableHead>
                            <TableHead className="w-[100px] text-xs font-semibold">分类</TableHead>
                            <TableHead className="w-[40px] text-xs font-semibold">单位</TableHead>
                            <TableHead className="w-[60px] text-xs font-semibold">发布日期</TableHead>
                            <TableHead className="w-[120px] text-right text-xs font-semibold">最高价</TableHead>
                            <TableHead className="w-[120px] text-right text-xs font-semibold">最低价</TableHead>
                            <TableHead className="w-[48px] text-right text-xs font-semibold">中间价</TableHead>
                            {userRole === 'PRICER' && (
                                <>
                                    <TableHead className="w-[80px] text-right text-xs font-semibold hidden">昨日中间价</TableHead>
                                    <TableHead className="w-[80px] text-right text-xs font-semibold hidden">变动</TableHead>
                                </>
                            )}
                            {userRole === 'AUDITOR' && (
                                <>
                                    <TableHead className="w-[60px] text-right text-xs font-semibold">状态</TableHead>
                                    <TableHead className="w-[120px] text-right text-xs font-semibold">操作</TableHead>
                                </>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dataLoading ? (
                            <TableRow>
                                <TableCell colSpan={userRole === 'AUDITOR' ? 11 : 10} className="text-center py-10">
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                        加载中...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : !Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={userRole === 'AUDITOR' ? 11 : 10} className="text-center py-10">
                                    没有找到匹配的产品
                                </TableCell>
                            </TableRow>
                        ) : (
                            (Array.isArray(paginatedProducts) ? paginatedProducts : []).map((product) => {
                                const variance = getPriceVariance(product);
                                const varianceColor = getPriceVarianceColor(variance);
                                const productPrices = priceInputs[product.id] || {};
                                return (
                                    <TableRow key={product.id}>
                                        {userRole === 'AUDITOR' && (
                                            <TableCell className="w-[40px]">
                                                {product.status === 'PENDING' && (
                                                    <Checkbox 
                                                        checked={selectedProducts.includes(product.id)}
                                                        onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                                                        aria-label={`选择产品 ${product.name}`}
                                                    />
                                                )}
                                            </TableCell>
                                        )}
                                        <TableCell className="font-medium w-[150px]">
                                            <div className="flex items-center text-xs">
                                                {product.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-[100px]">
                                            <Badge variant="outline" className={`text-xs ${getStatusStyle(product.status)}`}>{product.category}</Badge>
                                        </TableCell>
                                        <TableCell className="w-[40px] text-xs font-mono">{product.unit}</TableCell>
                                        <TableCell className={`w-[40px] text-xs font-mono ${product.priceSource === 'TODAY' ? 'text-green-700' : 'text-red-700'}`}>{product.publishDate}</TableCell>
                                        <PriceInputCell
                                            productId={product.id}
                                            fieldName="maxPrice"
                                            value={productPrices.maxPrice || (product.maxPrice > 0 ? product.maxPrice : product.lastMaxPrice)}
                                            placeholder={`${product.lastMaxPrice}`}
                                            priceSource={product.priceSource}
                                            status={product.status}
                                            onPriceChange={handlePriceChange}
                                        />
                                        <PriceInputCell
                                            productId={product.id}
                                            fieldName="minPrice"
                                            value={productPrices.minPrice || (product.minPrice > 0 ? product.minPrice : product.lastMinPrice)}
                                            placeholder={`${product.lastMinPrice}`}
                                            priceSource={product.priceSource}
                                            status={product.status}
                                            onPriceChange={handlePriceChange}
                                        />
                                        <TableCell className="w-[48px] text-right font-medium text-xs font-mono">
                                            {productPrices.avgPrice !== undefined && productPrices.avgPrice !== ''
                                                ? `${productPrices.avgPrice}`
                                                : (product.avgPrice && product.avgPrice > 0)
                                                    ? formatPrice(product.avgPrice)
                                                    : formatPrice(product.lastAvgPrice)}
                                        </TableCell>
                                        <TableCell className="w-[80px] text-right text-xs font-mono hidden">{formatPrice(product.lastAvgPrice)}</TableCell>
                                        <TableCell className={`w-[80px] text-right ${varianceColor} text-xs font-mono font-semibold hidden`}>
                                            {productPrices.variance
                                                ? `${productPrices.variance}%`
                                                : variance
                                                    ? `${variance}%`
                                                    : "-"}
                                        </TableCell>
                                        {userRole === 'PRICER' && (
                                            <StatusCell
                                                productId={product.id}
                                                status={product.status}
                                                priceSource={product.priceSource}
                                                saveStatus={saveStatus[product.id]}
                                                draftStatus={draftStatus[product.id]}
                                                getStatusStyle={getStatusStyle}
                                                getStatusText={getStatusText}
                                                onSave={handleSaveProduct}
                                                hasChanges={
                                                    // 检查是否有修改过的价格数据
                                                    productPrices.minPrice !== undefined ||
                                                    productPrices.maxPrice !== undefined ||
                                                    productPrices.avgPrice !== undefined ||
                                                    product.lastMinPrice !== undefined ||
                                                    product.lastMaxPrice !== undefined ||
                                                    product.lastAvgPrice !== undefined
                                                }
                                            />
                                        )}
                                        {userRole === 'AUDITOR' && (
                                            <>
                                                <TableCell className={`w-[60px] text-right text-xs font-semibold ${getStatusStyle(product.status)}`}>
                                                    {getStatusText(product.status)}
                                                </TableCell>
                                                <TableCell className="w-[120px] text-right text-xs font-semibold">
                                                    <div className="flex justify-end gap-1">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className={product.status === 'PENDING' 
                                                                ? "text-blue-600 border-blue-200 hover:bg-blue-50"
                                                                : product.status === 'PUBLISHED'
                                                                    ? "text-red-600 border-red-200 hover:bg-red-50"
                                                                    : "text-gray-400 border-gray-200 cursor-not-allowed"
                                                            }
                                                            onClick={() => handleAuditClick(product)}
                                                            disabled={!product.status || product.status === 'REJECTED'}
                                                        >
                                                            {product.status ? (product.status === 'PENDING' ? '通过' : product.status === 'PUBLISHED'? '撤回': '已拒绝') : '未报价'}
                                                        </Button>
                                                        {product.status === 'PENDING' && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                                onClick={() => handleRejectClick(product)}
                                                            >
                                                                拒绝
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </>
                                        )}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                {/* 分页组件 */}
                {pagination?.total > 0 && (
                    <div className="py-4 px-6 border-t">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                        className={currentPage === 1 || dataLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {/* 生成页码 */}
                                {(() => {
                                    const totalPages = Math.ceil((pagination?.total || 0) / itemsPerPage);
                                    const pageNumbers = [];
                                    const maxPagesToShow = 5;

                                    if (totalPages <= maxPagesToShow) {
                                        // 如果总页数小于等于最大显示页数，显示所有页码
                                        for (let i = 1; i <= totalPages; i++) {
                                            pageNumbers.push(i);
                                        }
                                    } else {
                                        // 否则，显示当前页附近的页码和省略号
                                        if (currentPage <= 3) {
                                            // 当前页靠近开始
                                            for (let i = 1; i <= 4; i++) {
                                                pageNumbers.push(i);
                                            }
                                            pageNumbers.push('ellipsis');
                                            pageNumbers.push(totalPages);
                                        } else if (currentPage >= totalPages - 2) {
                                            // 当前页靠近结束
                                            pageNumbers.push(1);
                                            pageNumbers.push('ellipsis');
                                            for (let i = totalPages - 3; i <= totalPages; i++) {
                                                pageNumbers.push(i);
                                            }
                                        } else {
                                            // 当前页在中间
                                            pageNumbers.push(1);
                                            pageNumbers.push('ellipsis');
                                            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                                                pageNumbers.push(i);
                                            }
                                            pageNumbers.push('ellipsis');
                                            pageNumbers.push(totalPages);
                                        }
                                    }

                                    return pageNumbers.map((page, index) => {
                                        if (page === 'ellipsis') {
                                            return (
                                                <PaginationItem key={`ellipsis-${index}`}>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            );
                                        }

                                        return (
                                            <PaginationItem key={`page-${page}`}>
                                                <PaginationLink
                                                    onClick={() => handlePageChange(page as number)}
                                                    isActive={currentPage === page}
                                                    className={dataLoading ? "pointer-events-none" : "cursor-pointer"}
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    });
                                })()}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => handlePageChange(Math.min(Math.ceil(pagination.total / itemsPerPage), currentPage + 1))}
                                        className={currentPage === Math.ceil(pagination.total / itemsPerPage) || dataLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>

                        {/* 分页信息 */}
                        <div className="text-xs text-gray-500 mt-2 text-center">
                            显示第 {(currentPage - 1) * itemsPerPage + 1} 至 {Math.min(currentPage * itemsPerPage, pagination?.total || 0)} 条，共 {pagination?.total || 0} 条
                        </div>
                    </div>
                )}
            </div>
            {/* 批量操作区域 */}
            <div className="mt-6 flex justify-between items-center">
                <div>
                    <span className="text-muted-foreground text-xs">
                        共 {pagination?.total || 0} 个产品，当前页显示 {products.length} 个，已填写 {Object.keys(priceInputs).length} 个价格
                    </span>
                </div>
                <div className="flex gap-2">
                    {/* <Button variant="outline" size="sm">
                        <File className="h-4 w-4 mr-2" />
                        批量导入
                    </Button> */}
                    {/* <Button onClick={handleSaveAll} size="sm">
                        <Import className="h-4 w-4 mr-2" />
                        导入昨日价格
                    </Button> */}
                </div>
            </div>

            {/* 审核对话框 */}
            <AlertDialog open={auditDialog.isOpen} onOpenChange={(open) => {
                if (!open) handleCloseAuditDialog();
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {auditDialog.action === 'approve' ? '确认通过价格' : '确认拒绝价格'}
                        </AlertDialogTitle>
                        <div className="text-sm text-muted-foreground">
                            {auditDialog.action === 'approve' ? (
                                <div className="py-2">您确定要将产品 <span className="font-semibold">"{auditDialog.product?.name}"</span> 的价格通过审核吗？</div>
                            ) : (
                                <div className="py-2">您确定要将产品 <span className="font-semibold">"{auditDialog.product?.name}"</span> 的价格拒绝吗？拒绝后，该价格将被标记为无效。</div>
                            )}
                            
                            <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                <div className="text-sm font-medium">当前状态: <span className={getStatusStyle(auditDialog.product?.status)}>{getStatusText(auditDialog.product?.status)}</span></div>
                                <div className="text-sm font-medium mt-1">操作后状态: <span className={getStatusStyle(auditDialog.action === 'approve' ? 'APPROVED' : 'REJECTED')}>
                                    {getStatusText(auditDialog.action === 'approve' ? 'APPROVED' : 'REJECTED')}
                                </span></div>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCloseAuditDialog}>取消</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmAudit}
                            disabled={isSaving}
                            className={auditDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    处理中...
                                </>
                            ) : (
                                <>
                                    {auditDialog.action === 'approve' ? '确认发布' : '确认拒绝'}
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 批量审核对话框 */}
            <AlertDialog open={batchAuditDialog.isOpen} onOpenChange={(open) => {
                if (!open) setBatchAuditDialog({...batchAuditDialog, isOpen: false});
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {batchAuditDialog.action === 'approve' ? '批量通过价格' : '批量拒绝价格'}
                        </AlertDialogTitle>
                        <div className="text-sm text-muted-foreground">
                            <div className="py-2">
                                您确定要{batchAuditDialog.action === 'approve' ? '通过' : '拒绝'}所选的 
                                <span className="font-semibold"> {batchAuditDialog.count} </span>
                                个产品价格吗？
                            </div>
                            
                            <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                <div className="text-sm font-medium">当前状态: <span className={getStatusStyle('PENDING')}>{getStatusText('PENDING')}</span></div>
                                <div className="text-sm font-medium mt-1">操作后状态: <span className={getStatusStyle(batchAuditDialog.action === 'approve' ? 'PUBLISHED' : 'REJECTED')}>
                                    {getStatusText(batchAuditDialog.action === 'approve' ? 'PUBLISHED' : 'REJECTED')}
                                </span></div>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setBatchAuditDialog({...batchAuditDialog, isOpen: false})}>取消</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmBatchAudit}
                            disabled={isSaving}
                            className={batchAuditDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    处理中...
                                </>
                            ) : (
                                <>
                                    {batchAuditDialog.action === 'approve' ? '确认批量发布' : '确认批量拒绝'}
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}