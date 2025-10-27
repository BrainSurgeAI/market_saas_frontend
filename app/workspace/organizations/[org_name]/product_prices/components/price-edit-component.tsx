"use client";

import { useState, useEffect } from "react";
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
import {
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { loadFromIndexedDB, saveToIndexedDB, openDatabase, STORE_NAME } from "@/lib/indexedDB";
import { format } from "date-fns";
import { formatDate } from "../helpers";

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

interface PriceData {
    minPrice: number | string;
    maxPrice: number | string;
    avgPrice: number | string;
    minPriceDiff?: number | string;
    maxPriceDiff?: number | string;
    avgPriceDiff?: number | string;
    variance?: string;
}

interface PriceEditComponentProps {
    product: Product;
    orgName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PriceEditComponent({ product, orgName, onClose, onSuccess }: PriceEditComponentProps) {
    const [priceInputs, setPriceInputs] = useState<PriceData>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [submitMessage, setSubmitMessage] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState("确认提交");
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmText, setConfirmText] = useState("确认提交");
    const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

    // 初始化价格输入数据
    useEffect(() => {
        if (product) {
            setPriceInputs({
                minPrice: product.minPrice > 0 ? product.minPrice : product.lastMinPrice,
                maxPrice: product.maxPrice > 0 ? product.maxPrice : product.lastMaxPrice,
                avgPrice: product.avgPrice > 0 ? product.avgPrice : product.lastAvgPrice,
            });
        }
    }, [product]);

    // 处理价格变化
    const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
        const numValue = value === '' ? '' : parseFloat(value);

        if (!product) return;

        setPriceInputs(prev => {
            const productPrices = prev || {};
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

            return updatedPrices;
        });
    };

    // 保存单个产品价格
    const handleSaveProduct = async () => {
        try {
            setIsSaving(true);

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
            const hasAnyPriceChanges = priceInputs && (
                (typeof priceInputs.minPrice === 'number' && priceInputs.minPrice !== product.minPrice) ||
                (typeof priceInputs.maxPrice === 'number' && priceInputs.maxPrice !== product.maxPrice)
            );

            // 如果没有任何价格输入改动，使用当前显示的价格
            const enhancedProductData: PriceData = {
                minPrice: priceInputs.minPrice !== undefined && priceInputs.minPrice !== '' ? priceInputs.minPrice : (product.minPrice > 0 ? product.minPrice : product.lastMinPrice),
                maxPrice: priceInputs.maxPrice !== undefined && priceInputs.maxPrice !== '' ? priceInputs.maxPrice : (product.maxPrice > 0 ? product.maxPrice : product.lastMaxPrice),
                avgPrice: priceInputs.avgPrice !== undefined && priceInputs.avgPrice !== '' ? priceInputs.avgPrice : (product.avgPrice > 0 ? product.avgPrice : product.lastAvgPrice),
                variance: priceInputs.variance,
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

            // 构造单个产品的数据格式
            const formattedData = {
                productId: product.id,
                minPrice: typeof enhancedProductData.minPrice === 'number' ? enhancedProductData.minPrice.toString() : enhancedProductData.minPrice,
                maxPrice: typeof enhancedProductData.maxPrice === 'number' ? enhancedProductData.maxPrice.toString() : enhancedProductData.maxPrice,
                avgPrice: typeof enhancedProductData.avgPrice === 'number' ? enhancedProductData.avgPrice.toString() : enhancedProductData.avgPrice,
                minPriceDiff: enhancedProductData.minPriceDiff,
                maxPriceDiff: enhancedProductData.maxPriceDiff,
                avgPriceDiff: enhancedProductData.avgPriceDiff
            };

            // 直接提交到服务器，不使用IndexedDB
            setConfirmTitle("确认提交价格数据");
            setConfirmMessage(`您确定要提交产品 "${product.name}" 的价格数据吗？提交后，数据将被同步到服务器。`);
            setConfirmText("确认提交");
            setConfirmAction(() => () => confirmSubmitPrices([formattedData]));
            setShowConfirmDialog(true);

        } catch (e) {
            console.error("Failed to save product data:", e);
            toast({
                title: "保存失败，请重试",
                description: "处理价格数据时发生错误",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // 确认提交价格
    const confirmSubmitPrices = async (prices: any[]) => {
        try {
            setShowConfirmDialog(false);
            setShowSubmitDialog(true);
            setSubmitStatus('loading');
            setSubmitMessage('正在提交价格数据，请勿关闭浏览器...');

            // 发送到服务器
            const response = await fetch(`/api/organizations/${orgName}/prices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({ prices })
            });

            if (!response.ok) {
                setSubmitStatus('error');
                const result = await response.json();
                setSubmitMessage(result.error || '提交失败');
                return;
            }

            // 显示成功消息
            setSubmitStatus('success');
            setSubmitMessage(`产品 "${product.name}" 的价格数据已成功提交！`);

            // 延迟后关闭对话框并触发成功回调
            setTimeout(() => {
                handleCloseDialog();
                onSuccess();
            }, 2000);

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

    const formatPrice = (price: any): string => {
        if (price === undefined || price === null) return "-";
        try {
            const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
            return isNaN(numPrice) ? String(price) : numPrice.toFixed(2);
        } catch (e) {
            return String(price);
        }
    };

    if (!product) {
        return null;
    }

    return (
        <div className="space-y-6">
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
            <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="mr-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        返回
                    </Button>
                    <div>
                        <h3 className="text-xl font-bold">修改报价 - {product.name}</h3>
                        <p className="text-muted-foreground text-sm">{formatDate(new Date())}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleSaveProduct} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                保存中...
                            </>
                        ) : (
                            '提交报价'
                        )}
                    </Button>
                </div>
            </div>

            {/* 产品信息卡片 */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                        <div className="text-lg font-semibold">{product.name}</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                        <div className="text-lg">{product.category}</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
                        <div className="text-lg">{product.unit}</div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">发布日期</label>
                        <div className="text-lg">{product.publishDate}</div>
                    </div>
                </div>

                {/* 价格输入表单 */}
                <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold mb-4">价格信息</h4>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                最高价 (元)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={priceInputs.maxPrice || ''}
                                onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                                placeholder={`${product.lastMaxPrice}`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {product.lastMaxPrice && (
                                <p className="text-xs text-gray-500 mt-1">昨日价格: {formatPrice(product.lastMaxPrice)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                最低价 (元)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={priceInputs.minPrice || ''}
                                onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                                placeholder={`${product.lastMinPrice}`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {product.lastMinPrice && (
                                <p className="text-xs text-gray-500 mt-1">昨日价格: {formatPrice(product.lastMinPrice)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                中间价 (元)
                            </label>
                            <input
                                type="text"
                                value={priceInputs.avgPrice || ''}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600"
                            />
                            <p className="text-xs text-gray-500 mt-1">自动计算</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}