'use client'

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermission } from "@/app/context/permission-context";
import {
    ArrowLeft,
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

// 重用entry页面的组件
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

interface RejectedProductListProps {
    products: Product[];
    orgName: string;
    pagination?: PaginationData;
    baseUrl?: string;
}

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

const formatPrice = (price: any): string => {
    if (price === undefined || price === null) return "-";

    try {
        const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
        return isNaN(numPrice) ? String(price) : numPrice.toFixed(2);
    } catch (e) {
        return String(price);
    }
};

export default function RejectedProductList({ products, orgName, pagination, baseUrl }: RejectedProductListProps) {
    const router = useRouter();
    const { userRole, hasPermission } = usePermission();

    // Price entry state (重用entry页面的状态管理)
    const [priceInputs, setPriceInputs] = useState<Record<number, PriceData>>({});
    const [saveStatus, setSaveStatus] = useState<Record<number, string>>({});
    const [draftStatus, setDraftStatus] = useState<Record<number, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Submit dialog states
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [submitMessage, setSubmitMessage] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
    const [confirmTitle, setConfirmTitle] = useState("确认提交");
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmText, setConfirmText] = useState("确认提交");

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(pagination?.page || 1);
    const [dataLoading, setDataLoading] = useState(false);

    const itemsPerPage = pagination?.page_size || 10;

    // 加载时从 IndexedDB 恢复暂存状态
    useEffect(() => {
        const loadSavedData = async () => {
            try {
                const loadedData = await loadFromIndexedDB(orgName);
                if (loadedData) {
                    setPriceInputs(loadedData);

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
    }, [orgName]);

    const handlePriceChange = (productId: number, field: 'minPrice' | 'maxPrice', value: string) => {
        const numValue = value === '' ? '' : parseFloat(value);
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setPriceInputs(prev => {
            const productPrices = prev[productId] || {};
            const updatedPrices = { ...productPrices, [field]: numValue };

            if (field === 'minPrice' && numValue !== '') {
                // 修改最低价：找最高价计算平均值
                let maxPrice = null;

                if (typeof updatedPrices.maxPrice === 'number') {
                    maxPrice = updatedPrices.maxPrice;
                } else if (product.maxPrice && product.maxPrice > 0) {
                    maxPrice = Number(product.maxPrice);
                } else if (product.lastMaxPrice) {
                    maxPrice = Number(product.lastMaxPrice);
                }

                if (maxPrice && maxPrice > 0) {
                    updatedPrices.avgPrice = ((numValue + maxPrice) / 2).toFixed(2);
                } else {
                    updatedPrices.avgPrice = numValue.toFixed(2);
                }
            } else if (field === 'maxPrice' && numValue !== '') {
                // 修改最高价：找最低价计算平均值
                let minPrice = null;

                if (typeof updatedPrices.minPrice === 'number') {
                    minPrice = updatedPrices.minPrice;
                } else if (product.minPrice && product.minPrice > 0) {
                    minPrice = Number(product.minPrice);
                } else if (product.lastMinPrice) {
                    minPrice = Number(product.lastMinPrice);
                }

                if (minPrice && minPrice > 0) {
                    updatedPrices.avgPrice = ((minPrice + numValue) / 2).toFixed(2);
                } else {
                    updatedPrices.avgPrice = numValue.toFixed(2);
                }
            } else if (typeof updatedPrices.minPrice === 'number' && typeof updatedPrices.maxPrice === 'number') {
                // 两个价格都有，直接计算平均值
                updatedPrices.avgPrice = ((updatedPrices.minPrice + updatedPrices.maxPrice) / 2).toFixed(2);
            } else {
                updatedPrices.avgPrice = '';
            }

            // 计算价格变动率
            if (updatedPrices.avgPrice && updatedPrices.avgPrice !== '' && product.lastAvgPrice) {
                try {
                    const numAvgPrice = parseFloat(updatedPrices.avgPrice);
                    const lastPrice = Number(product.lastAvgPrice);

                    if (!isNaN(numAvgPrice) && !isNaN(lastPrice) && lastPrice !== 0) {
                        updatedPrices.variance = ((numAvgPrice - lastPrice) / lastPrice * 100).toFixed(1);
                    }
                } catch (e) {
                    // 静默处理错误
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

    // 重用entry页面的保存逻辑
    const handleSaveProduct = async (productId: number) => {
        try {
            setIsSaving(true);

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

            const productInput = priceInputs[productId];
            const hasAnyPriceChanges = productInput && (
                typeof productInput.minPrice === 'number' ||
                typeof productInput.maxPrice === 'number'
            );

            if (!hasAnyPriceChanges) {
                setConfirmTitle("使用历史价格");
                setConfirmMessage(`您尚未修改 "${product.name}" 的价格，是否要将最近发布价格作为今日价格？`);
                setConfirmText("确认使用");
                setConfirmAction(() => () => confirmUsePreviousPriceForProduct(productId));
                setShowConfirmDialog(true);
                setIsSaving(false);
                return;
            }

            const enhancedProductData: PriceData = {
                minPrice: productInput && productInput.minPrice !== undefined && productInput.minPrice !== '' ? productInput.minPrice : (product.minPrice > 0 ? product.minPrice : product.lastMinPrice),
                maxPrice: productInput && productInput.maxPrice !== undefined && productInput.maxPrice !== '' ? productInput.maxPrice : (product.maxPrice > 0 ? product.maxPrice : product.lastMaxPrice),
                avgPrice: productInput && productInput.avgPrice !== undefined && productInput.avgPrice !== '' ? productInput.avgPrice : (product.avgPrice > 0 ? product.avgPrice : product.lastAvgPrice),
                variance: productInput && productInput.variance,
                minPriceDiff: 0,
                maxPriceDiff: 0,
                avgPriceDiff: 0
            };

            // 计算价格差值
            if (enhancedProductData.minPrice !== undefined && enhancedProductData.minPrice !== '' && product.lastMinPrice) {
                const minPriceNum = typeof enhancedProductData.minPrice === 'string'
                    ? parseFloat(enhancedProductData.minPrice)
                    : Number(enhancedProductData.minPrice);

                if (!isNaN(minPriceNum) && minPriceNum > 0) {
                    enhancedProductData.minPriceDiff = (minPriceNum - product.lastMinPrice).toFixed(2);
                }
            }

            if (enhancedProductData.maxPrice !== undefined && enhancedProductData.maxPrice !== '' && product.lastMaxPrice) {
                const maxPriceNum = typeof enhancedProductData.maxPrice === 'string'
                    ? parseFloat(enhancedProductData.maxPrice)
                    : Number(enhancedProductData.maxPrice);

                if (!isNaN(maxPriceNum) && maxPriceNum > 0) {
                    enhancedProductData.maxPriceDiff = (maxPriceNum - product.lastMaxPrice).toFixed(2);
                }
            }

            if (enhancedProductData.avgPrice !== undefined && enhancedProductData.avgPrice !== '' && product.lastAvgPrice) {
                const avgPriceNum = typeof enhancedProductData.avgPrice === 'string'
                    ? parseFloat(enhancedProductData.avgPrice)
                    : Number(enhancedProductData.avgPrice);

                if (!isNaN(avgPriceNum) && avgPriceNum > 0) {
                    enhancedProductData.avgPriceDiff = (avgPriceNum - product.lastAvgPrice).toFixed(2);
                }
            }

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

            const currentData = await loadFromIndexedDB(orgName) || {};
            const updatedData = {
                ...currentData,
                [productId]: enhancedProductData
            };

            const saveResult = await saveToIndexedDB(orgName, updatedData);

            if (saveResult) {
                setDraftStatus(prev => ({
                    ...prev,
                    [productId]: true
                }));

                setSaveStatus(prev => ({
                    ...prev,
                    [productId]: "success"
                }));

                toast({
                    title: "保存成功",
                    description: `已保存产品 ${product.name} 的价格数据`,
                    variant: "default",
                });

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
        } finally {
            setIsSaving(false);
        }
    };

    // 重用entry页面的确认使用历史价格逻辑
    const confirmUsePreviousPriceForProduct = async (productId: number) => {
        try {
            setIsSaving(true);
            setShowConfirmDialog(false);

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

                    const saveResult = await saveToIndexedDB(orgName, enhancedData);

                    if (saveResult) {
                        setDraftStatus(prev => ({...prev, [productId]: true}));
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

    // 重用entry页面的提交逻辑
    const handleSubmitPrices = async () => {
        try {
            setShowSubmitDialog(true);
            setSubmitStatus('loading');
            setSubmitMessage('正在提交价格数据，请勿关闭浏览器...');

            const priceData = await loadFromIndexedDB(orgName);
            if (!priceData || Object.keys(priceData).length === 0) {
                setSubmitStatus('error');
                setSubmitMessage('没有可提交的价格数据，请在提交前保存');
                return;
            }

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

            if (Object.keys(completeEntries).length === 0) {
                setSubmitStatus('error');
                setSubmitMessage('没有可提交的完整价格数据，请确保填写了最高价和最低价');
                return;
            }

            const formattedData = Object.entries(completeEntries).map(([productId, prices]) => {
                const priceInfo = prices as PriceData;

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

            const username = getUsernameFromToken();
            const response = await fetch(`/api/organizations/${orgName}/prices`, {
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

            setSaveStatus(prev => {
                const newStatus: Record<number, string> = { ...prev };
                Object.keys(completeEntries).forEach(id => {
                    newStatus[parseInt(id)] = "success";
                });
                return newStatus;
            });

            if (Object.keys(incompleteEntries).length > 0) {
                await saveToIndexedDB(orgName, incompleteEntries);
            } else {
                const db = await openDatabase();
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                store.delete(orgName);
            }

            setDraftStatus(prev => {
                const newDraftStatus = { ...prev };
                Object.keys(completeEntries).forEach(id => {
                    delete newDraftStatus[parseInt(id)];
                });
                return newDraftStatus;
            });

            setSubmitStatus('success');
            setSubmitMessage(`成功提交了 ${Object.keys(completeEntries).length} 条价格数据！`);

            // 刷新页面数据
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error("提交价格时出错:", error);
            setSubmitStatus('error');
            setSubmitMessage('提交失败，请重试');
        }
    };

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

    const handleCloseDialog = () => {
        setShowSubmitDialog(false);
        setSubmitStatus('idle');
        setSubmitMessage('');
    };

    // 重用entry页面的状态计算函数
    const getPriceVariance = (product: Product) => {
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

        if (product.avgPrice !== undefined && product.avgPrice !== null && product.lastAvgPrice) {
            try {
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

    // 过滤产品（只显示REJECTED状态的产品）
    const filteredProducts = Array.isArray(products) ? products.filter(product => product.status === 'REJECTED') : [];

    const handlePageChange = (page: number) => {
        if (page !== currentPage && baseUrl) {
            setCurrentPage(page);
            router.push(`${baseUrl}?page=${page}`);
        }
    };

    if (dataLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">加载中...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* 确认对话框 */}
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
                        <h3 className="text-xl font-bold">已拒绝产品报价</h3>
                        <p className="text-muted-foreground text-sm">{formatDate(new Date())}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {userRole === 'PRICER' && (
                        <Button variant="destructive" size="sm" onClick={handleSubmitPricesClick}
                            disabled={submitStatus === 'loading'}>
                            <Upload className="h-4 w-4 mr-2" />
                            重新提交报价
                        </Button>
                    )}
                </div>
            </div>

            {/* 产品列表和报价表格 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px] text-xs font-semibold">产品名称</TableHead>
                            <TableHead className="w-[100px] text-xs font-semibold">分类</TableHead>
                            <TableHead className="w-[40px] text-xs font-semibold">单位</TableHead>
                            <TableHead className="w-[60px] text-xs font-semibold">发布日期</TableHead>
                            <TableHead className="w-[120px] text-right text-xs font-semibold">最高价</TableHead>
                            <TableHead className="w-[120px] text-right text-xs font-semibold">最低价</TableHead>
                            <TableHead className="w-[48px] text-right text-xs font-semibold">中间价</TableHead>
                            <TableHead className="w-[80px] text-right text-xs font-semibold hidden">昨日中间价</TableHead>
                            <TableHead className="w-[80px] text-right text-xs font-semibold hidden">变动</TableHead>
                            <TableHead className="w-[80px] text-right text-xs font-semibold">状态</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dataLoading ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-10">
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                        加载中...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : !Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-10">
                                    没有找到已拒绝的产品
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => {
                                const variance = getPriceVariance(product);
                                const varianceColor = getPriceVarianceColor(variance);
                                const productPrices = priceInputs[product.id] || {};
                                return (
                                    <TableRow key={product.id}>
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
                                            userRole={userRole}
                                            onPriceChange={handlePriceChange}
                                        />
                                        <PriceInputCell
                                            productId={product.id}
                                            fieldName="minPrice"
                                            value={productPrices.minPrice || (product.minPrice > 0 ? product.minPrice : product.lastMinPrice)}
                                            placeholder={`${product.lastMinPrice}`}
                                            priceSource={product.priceSource}
                                            status={product.status}
                                            userRole={userRole}
                                            onPriceChange={handlePriceChange}
                                        />
                                        <TableCell className="w-[48px] text-right font-medium text-xs font-mono">
                                            {(() => {
                                                // 优先显示用户输入计算的中间价
                                                if (productPrices.avgPrice && productPrices.avgPrice !== '') {
                                                    return productPrices.avgPrice;
                                                }
                                                // 其次显示产品原有的中间价
                                                if (product.avgPrice && product.avgPrice > 0) {
                                                    return formatPrice(product.avgPrice);
                                                }
                                                // 最后显示历史中间价
                                                return formatPrice(product.lastAvgPrice);
                                            })()}
                                        </TableCell>
                                        <TableCell className="w-[80px] text-right text-xs font-mono hidden">{formatPrice(product.lastAvgPrice)}</TableCell>
                                        <TableCell className={`w-[80px] text-right ${varianceColor} text-xs font-mono font-semibold hidden`}>
                                            {productPrices.variance
                                                ? `${productPrices.variance}%`
                                                : variance
                                                    ? `${variance}%`
                                                    : "-"}
                                        </TableCell>
                                        <StatusCell
                                            productId={product.id}
                                            status={product.status}
                                            priceSource={product.priceSource}
                                            saveStatus={saveStatus[product.id]}
                                            draftStatus={draftStatus[product.id]}
                                            userRole={userRole}
                                            getStatusStyle={getStatusStyle}
                                            getStatusText={getStatusText}
                                            onSave={handleSaveProduct}
                                            hasChanges={
                                                productPrices.minPrice !== undefined ||
                                                productPrices.maxPrice !== undefined ||
                                                productPrices.avgPrice !== undefined ||
                                                product.lastMinPrice !== undefined ||
                                                product.lastMaxPrice !== undefined ||
                                                product.lastAvgPrice !== undefined
                                            }
                                        />
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
                                        for (let i = 1; i <= totalPages; i++) {
                                            pageNumbers.push(i);
                                        }
                                    } else {
                                        if (currentPage <= 3) {
                                            for (let i = 1; i <= 4; i++) {
                                                pageNumbers.push(i);
                                            }
                                            pageNumbers.push('ellipsis');
                                            pageNumbers.push(totalPages);
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNumbers.push(1);
                                            pageNumbers.push('ellipsis');
                                            for (let i = totalPages - 3; i <= totalPages; i++) {
                                                pageNumbers.push(i);
                                            }
                                        } else {
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

                        <div className="text-xs text-gray-500 mt-2 text-center">
                            显示第 {(currentPage - 1) * itemsPerPage + 1} 至 {Math.min(currentPage * itemsPerPage, pagination?.total || 0)} 条，共 {pagination?.total || 0} 条
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-between items-center">
                <div>
                    <span className="text-muted-foreground text-xs">
                        共 {pagination?.total || 0} 个产品，当前页显示 {filteredProducts.length} 个，已填写 {Object.keys(priceInputs).length} 个价格
                    </span>
                </div>
            </div>
        </div>
    );
}