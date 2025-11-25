"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, Calendar } from "lucide-react";

import { useRouter } from "next/navigation";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Badge } from "@/components/ui/badge";

import { Product, CartItem, ProductDetail as ProductDetailType, ProcessingFee, CategoryWithSubCategories } from "../../types";
import { ProductList } from "./ProductList";
import { SearchBar } from "./SearchBar";
import { ProductDetailSheet } from "./ProductDetail";
import { QuantityDialog } from "@/lib/components/QuantityDialog";
import { Organization, User } from "@/app/models";

interface ProcurementPageProps {
	user: User;
	organization: Organization;
	userRole: string[];
}

export function ProcurementPage({ user, organization, userRole }: ProcurementPageProps) {
	const { toast } = useToast();
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [productDetail, setProductDetail] = useState<ProductDetailType | null>(null);
	const [processingFees, setProcessingFees] = useState<ProcessingFee[]>([]);
	const [loading, setLoading] = useState(false);
	const [showDetail, setShowDetail] = useState(false);

	// 滚动加载相关状态
	const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);

	const [products, setProducts] = useState<Product[]>([]);
	const [remoteProducts, setRemoteProducts] = useState<Product[]>([])
	const [categories, setCategories] = useState<CategoryWithSubCategories[]>([]);
	const [searchSource, setSearchSource] = useState<'local' | 'remote' | null>(null)

	// 添加远程搜索状态和函数
	const [isSearching, setIsSearching] = useState(false);
	const [remoteSearched, setRemoteSearched] = useState(false);

	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	const baseApiUrl = `/api/customers/${organization.nameHash}/products`;

	const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(null);
	const [showQuantityDialog, setShowQuantityDialog] = useState(false);
	const [showMobileCart, setShowMobileCart] = useState(false);

	// 在state区域添加一个新的状态变量
	const [activeCategroyId, setActiveCategroyId] = useState<string>("all");

	// 远程搜索函数
	const searchRemoteProducts = useCallback(async (term: string) => {
		if (!term || term.length < 2 || isSearching || remoteSearched) return;

		try {
			setIsSearching(true);
			const apiUrl = `${baseApiUrl}/search?name=${encodeURIComponent(term)}`;
			const response = await fetch(apiUrl);

			if (!response.ok) {
				throw new Error(`搜索请求失败: ${response.status}`);
			}

			const products = await response.json();
			if (products && products.length > 0) {

				// 将远程搜索结果添加到本地产品列表中
				setRemoteProducts(products);
				setDisplayedProducts(products.slice(0, 8));
				setHasMore(products.length > 8);
				setSearchSource('remote');

				toast({
					title: "搜索成功",
					description: `找到 ${products.length} 个匹配的产品`,
					variant: "success",
					duration: 3000,
				});
			} else {
				toast({
					title: "未找到产品",
					description: "没有找到匹配的产品",
					variant: "default",
					duration: 3000,
				});
			}

			setRemoteSearched(true);
		} catch (error) {
			toast({
				title: "搜索失败",
				description: "无法搜索产品，请稍后重试",
				variant: "destructive",
				duration: 3000,
			});
		} finally {
			setIsSearching(false);
		}
	}, [organization, isSearching, remoteSearched, toast]);

	// 监听搜索词变化
	useEffect(() => {
		setRemoteSearched(false);

		if (!searchTerm) {
			setSearchSource('local');
			loadInitialProducts();
		}
	}, [searchTerm]);

	// 处理搜索词变化
	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
	};

	// 处理搜索按钮点击
	const handleSearch = () => {
		if (searchTerm.length >= 2) {
			searchRemoteProducts(searchTerm);
		} else if (searchTerm.length === 0) {
			setSearchSource('local');
			loadInitialProducts();
		} else {
			// 搜索词长度不足，显示提示
			toast({
				title: "搜索提示",
				description: "请输入至少2个字符进行搜索",
				variant: "default",
				duration: 3000,
			});
		}
	};

	// 根据搜索词和类别筛选产品
	const filteredProducts = useMemo(() => {
		const allProducts = [...products, ...remoteProducts];
		return allProducts.filter((product: Product) => {
			const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
			return matchesSearch && matchesCategory;
		});
	}, [products, remoteProducts, searchTerm, selectedCategory]);

	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const response = await fetch(baseApiUrl);
				if (!response.ok) {
					throw new Error(`API请求失败: ${response.status}`);
				}

				const data = await response.json();
				setProducts(data.products);
			} catch (error) {
				toast({
					title: "加载失败",
					description: "获取产品列表时出错，请稍后重试",
					variant: "destructive",
					duration: 3000,
				});
			}
		};
		fetchProducts();
	}, [organization, toast]);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const apiUrl = `/api/category_with_subs`;
				const response = await fetch(apiUrl);

				// 检查响应状态
				if (!response.ok) {
					throw new Error(`API请求失败: ${response.status}`);
				}

				const data = await response.json();
				setCategories(data);

			} catch (error) {
				toast({
					title: "加载失败",
					description: "获取类别列表时出错，请稍后重试",
					variant: "destructive",
					duration: 3000,
				});
			}
		};
		fetchCategories();
	}, [toast]);

	// 初始加载和滚动加载
	useEffect(() => {
		if (products.length > 0 && searchSource === 'local') {
			loadInitialProducts();
		}
	}, [products, searchSource]);

	const loadInitialProducts = () => {
		setPage(1);
		setHasMore(true);

		// 如果当前是远程数据源且已有数据，则保持现有数据
		if (searchSource === 'remote' && remoteProducts.length > 0) {
			return;
		}

		const initialItems = filteredProducts.slice(0, 8);
		setDisplayedProducts(initialItems);
		setHasMore(initialItems.length < filteredProducts.length);
	};

	const loadMoreProducts = useCallback(async () => {
		if (loadingMore) {
			return;
		}

		setLoadingMore(true);
		try {
			const nextPage = page + 1;

			// 确保使用正确的分类ID:
			// 1. 如果是子分类选择模式(selectedSubCategory不是"all")，使用selectedSubCategory
			// 2. 如果是活跃ID模式，使用activeCategroyId
			// 3. 最后才使用selectedCategory作为后备
			let categoryIdToUse = selectedCategory;

			if (selectedSubCategory !== "all") {
				// 用户明确选择了一个子分类
				categoryIdToUse = selectedSubCategory;
			} else if (activeCategroyId !== "all") {
				// 活跃分类ID不是"all"，说明有自动选择的子分类或特定分类
				categoryIdToUse = activeCategroyId;
			}

			const apiUrl = `${baseApiUrl}?category_id=${categoryIdToUse}&page=${nextPage}&page_size=12`;

			// 发起API请求
			const response = await fetch(apiUrl);

			// 检查响应状态
			if (!response.ok) {
				setHasMore(false);
				setLoadingMore(false);
				toast({
					title: "加载失败",
					description: "获取产品时出错，请稍后重试",
					variant: "destructive",
					duration: 3000,
				});
				return;
			}

			// 解析响应数据
			const data = await response.json();

			// 检查数据是否为空
			if (!data || (Array.isArray(data) && data.length === 0)) {
				setHasMore(false);
				setLoadingMore(false);
				return;
			}

			// 更新显示的产品列表，直接添加新产品
			setDisplayedProducts(prev => [...prev, ...data.products]);
			setPage(nextPage);

			// 如果返回的数据少于请求的数量，说明没有更多数据了
			setHasMore(data.length === 12);
		} catch (error) {
			toast({
				title: "加载失败",
				description: "获取更多产品时出错，请稍后重试",
				variant: "destructive",
			});
		} finally {
			setLoadingMore(false);
		}
	}, [page, loadingMore, hasMore, selectedCategory, selectedSubCategory, activeCategroyId, organization.name, toast]);

	// 修改添加到购物车功能以接收数量参数
	const addToCart = (product: Product, selectedProcessingFees: Record<string, boolean | string>, quantity: number = 1) => {
		// 确保数量不小于最小起订量
		const minQuantity = product.minOrderQuantity || 1;
		const actualQuantity = Math.max(quantity, minQuantity);

		// 生成附加服务列表
		const services = processingFees
			.filter(fee => selectedProcessingFees[fee.processingFeeId])
			.map(fee => ({
				type: fee.processingType,
				description: fee.description
			}));

		// 获取自定义备注
		const customNote = typeof selectedProcessingFees.note === 'string' ? selectedProcessingFees.note : undefined;

		// 为购物车项生成唯一ID - 基于产品ID和选择的服务
		// 用JSON字符串化服务列表和备注，然后生成一个hash作为唯一标识
		const servicesKey = JSON.stringify({ services, customNote });
		const uniqueCartItemId = `${product.id}_${servicesKey}`;

		// 确保价格是数字类型
		const price = Number(product.price ?? 0);
		const discountRate = Number(product.discountRate ?? 1);
		const discountedPrice = Number((price * discountRate).toFixed(2));

		// 查找具有相同产品ID和相同附加服务的项
		const existingItem = cartItems.find(item =>
			item.productId === product.id &&
			JSON.stringify({ services: item.processingServices, customNote: item.customNote }) === servicesKey
		);

		if (existingItem) {
			// 如果找到具有相同产品ID和附加服务的项，则更新数量
			setCartItems(cartItems.map(item =>
				JSON.stringify({ services: item.processingServices, customNote: item.customNote }) === servicesKey && item.productId === product.id
					? {
						...item,
						quantity: item.quantity + actualQuantity,
						total: Number((item.price * (item.quantity + actualQuantity)).toFixed(2)),
						originalTotal: Number((item.originalPrice * (item.quantity + actualQuantity)).toFixed(2))
					}
					: item
			));
		} else {
			// 如果没有找到匹配的项，则添加一个新项
			setCartItems([...cartItems, {
				productId: product.id,
				name: product.name,
				quantity: actualQuantity,
				discountRate: discountRate,
				originalPrice: price,
				price: discountedPrice,
				unit: product.unit,
				originalTotal: Number((price * actualQuantity).toFixed(2)),
				total: Number((discountedPrice * actualQuantity).toFixed(2)),
				category: product.category,
				categoryId: product.categoryId,
				processingServices: services,
				customNote,
				minOrderQuantity: product.minOrderQuantity,
				uniqueId: uniqueCartItemId
			}]);
		}

		toast({
			title: "添加成功",
			description: `已将 ${actualQuantity} ${product.unit} ${product.name} 添加到采购清单`,
			variant: "default",
			duration: 3000,
		});
	};

	// 计算购物车总金额
	const cartTotal = Number(cartItems.reduce((sum, item) => Number(sum) + Number(item.total), 0).toFixed(2));

	// 添加查看产品详情的函数
	const handleViewProductDetail = async (product: Product) => {
		setSelectedProduct(product);
		setProductDetail(null);
		setLoading(true);
		setShowDetail(true);

		try {
			const apiUrl = `${baseApiUrl}/${product.id}`;
			const response = await fetch(apiUrl);

			// 检查响应状态
			if (!response.ok) {
				throw new Error(`API请求失败: ${response.status}`);
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error(`API请求失败: ${data.status}`);
			}

			const detail: ProductDetailType = {
				...product,
				...data.data.product,
				tips: data.data.product.tips === '' ? [] : [data.data.product.tips],
			}

			setProductDetail(detail);
			setProcessingFees(data.data.processingFees);
		} catch (error) {
			toast({
				title: "加载失败",
				description: "获取产品详情时出错，请稍后重试",
				variant: "destructive",
				duration: 3000,
			});
		} finally {
			setLoading(false);
		}
	};

	// 处理类别变更
	const handleCategoryChange = async (category_id: string) => {
		setSelectedCategory(category_id);

		// 如果选择"全部"类别，使用本地数据
		if (category_id === "all") {
			setSelectedSubCategory("all");
			setActiveCategroyId("all");
			setSearchSource('local');
			loadInitialProducts();
			return;
		}

		// 查找当前选中分类的子分类
		const currentCategory = categories.find(cat => cat.id.toString() === category_id);

		if (currentCategory && currentCategory.subCategories && currentCategory.subCategories.length > 0) {
			// 自动选择第一个子分类
			const firstSubCategory = currentCategory.subCategories[0];
			const subCategoryId = firstSubCategory.id.toString();

			// 先设置选中的子分类和活跃ID
			setSelectedSubCategory(subCategoryId);
			setActiveCategroyId(subCategoryId); // 确保活跃ID是子分类ID

			// 然后使用该子分类ID加载产品数据
			try {
				// 由于API期望category_id参数，我们直接传入子分类ID
				const apiUrl = `${baseApiUrl}?category_id=${subCategoryId}&page=1&page_size=12`;
				setLoadingMore(true);

				const response = await fetch(apiUrl);

				if (!response.ok) {
					toast({
						title: "加载失败",
						description: "获取产品时出错，请稍后重试",
						variant: "destructive",
						duration: 3000,
					});
					return;
				}

				const data = await response.json();

				// 处理不同的API响应结构
				let products = [];
				if (data.products) {
					products = data.products;
				} else if (Array.isArray(data)) {
					products = data;
				}

				// 确保我们有数据并更新显示
				if (products.length > 0) {
					setSearchSource('remote');
					setRemoteProducts(products);
					setDisplayedProducts(products);
					setHasMore(products.length === 12);
					setPage(1);

					// 再次确认活跃ID为子分类ID
					setActiveCategroyId(subCategoryId);
				} else {
					// 没有产品数据时显示提示
					setRemoteProducts([]);
					setDisplayedProducts([]);
					setHasMore(false);
					toast({
						title: "无数据",
						description: "该子分类下暂无产品",
						variant: "default",
						duration: 3000,
					});
				}
			} catch (error) {
				toast({
					title: "加载失败",
					description: "获取产品时出错，请稍后重试",
					variant: "destructive",
					duration: 3000,
				});

				// 出错时尝试使用本地筛选
				setSearchSource('local');
				loadInitialProducts();
			} finally {
				setLoadingMore(false);
			}
		} else {
			// 如果没有子分类，直接加载一级分类的产品
			setSelectedSubCategory("all");
			// 设置活跃的分类ID为一级分类ID
			setActiveCategroyId(category_id);
			await loadCategoryProducts(category_id);
		}
	};

	// 加载分类产品的通用函数
	const loadCategoryProducts = async (category_id: string) => {
		setSearchSource('remote');
		setLoadingMore(true);

		try {
			// 构建API URL
			const apiUrl = `${baseApiUrl}?category_id=${category_id}&page=1&page_size=12`;

			// 从API获取特定类别的产品
			const response = await fetch(apiUrl);

			// 检查响应状态
			if (!response.ok) {
				throw new Error(`API请求失败: ${response.status}`);
			}

			// 解析响应数据
			const data = await response.json();

			// 检查数据是否为空
			if (!data || (Array.isArray(data.products) && data.products.length === 0)) {
				setRemoteProducts([]);
				setDisplayedProducts([]);
				setHasMore(false);
				toast({
					title: "无数据",
					description: "该分类下暂无产品",
					variant: "default",
					duration: 3000,
				});
			} else {
				// 重置分页状态
				setPage(1);

				// 直接使用返回的数据
				setDisplayedProducts(data.products);
				setRemoteProducts(data.products);

				// 如果返回的数据等于请求的数量，说明可能还有更多数据
				setHasMore(data.products.length === 12);
			}
		} catch (error) {
			toast({
				title: "加载失败",
				description: "获取分类产品时出错，请稍后重试",
				variant: "destructive",
				duration: 3000,
			});

			// 出错时恢复到本地数据
			setSearchSource('local');
			loadInitialProducts();
		} finally {
			setLoadingMore(false);
		}
	};

	// 处理子分类变更
	const handleSubCategoryChange = async (category_id: string) => {
		setSelectedSubCategory(category_id);

		// 如果选择"全部"类别，使用本地数据
		if (category_id === "all") {
			setActiveCategroyId(selectedCategory); // 使用一级分类作为活跃ID
			setSearchSource('local');
			// 重新加载初始产品
			loadInitialProducts();
			return;
		}

		// 设置活跃的分类ID为选中的子分类ID
		setActiveCategroyId(category_id);
		// 使用通用函数加载该子分类的产品
		await loadCategoryProducts(category_id);
	};

	// 从购物车移除商品
	const removeCartItem = (itemId: string) => {
		setCartItems(cartItems.filter(item => (item.uniqueId || item.productId) !== itemId));
	};

	// 处理结算
	const handleCheckout = () => {
		setShowConfirmDialog(true);
	};

	// 处理确认采购
	const handleConfirmCheckout = () => {
		if (cartItems.length === 0) return;

		// 确保每个购物车项都有唯一标识
		const itemsWithUniqueIds = cartItems.map(item => {
			if (!item.uniqueId) {
				// 为没有唯一ID的项生成唯一ID
				const servicesKey = JSON.stringify({
					services: item.processingServices || [],
					customNote: item.customNote || ""
				});
				return {
					...item,
					uniqueId: `${item.productId}_${servicesKey}`
				};
			}
			return item;
		});

		const pendingOrder = {
			items: itemsWithUniqueIds,
			totalAmount: itemsWithUniqueIds.reduce((sum, item) => sum + item.total, 0),
			date: new Date().toISOString(),
		};

		sessionStorage.setItem('pendingOrder', JSON.stringify(pendingOrder));
		router.push(`/workspace/customers/${organization.nameHash}/orders/create`);
		setShowConfirmDialog(false);
	};

	// 处理购物车数量对话框打开
	const handleOpenQuantityDialog = (itemId: string) => {
		setSelectedCartItemId(itemId);
		setShowQuantityDialog(true);
	};

	// 处理购物车数量确认
	const handleCartQuantityConfirm = (quantity: number) => {
		if (!selectedCartItemId) return;

		// 查找匹配的购物车项 - 使用唯一ID或产品ID
		const item = cartItems.find(item => (item.uniqueId || item.productId) === selectedCartItemId);
		if (!item) return;

		// 更新购物车
		setCartItems(cartItems.map(cartItem =>
			(cartItem.uniqueId || cartItem.productId) === selectedCartItemId
				? {
					...cartItem,
					quantity: quantity,
					total: Number((cartItem.price * quantity).toFixed(2)),
					originalTotal: Number((cartItem.originalPrice * quantity).toFixed(2))
				}
				: cartItem
		));

		setSelectedCartItemId(null);
	};

	// 更新购物车数量（增加/减少）
	const updateCartQuantity = (itemId: string, newQuantity: number) => {
		if (newQuantity <= 0) return;

		const item = cartItems.find(item => (item.uniqueId || item.productId) === itemId);
		if (!item || newQuantity < (item.minOrderQuantity || 1)) return;

		setCartItems(cartItems.map(cartItem =>
			(cartItem.uniqueId || cartItem.productId) === itemId
				? {
					...cartItem,
					quantity: newQuantity,
					total: Number((cartItem.price * newQuantity).toFixed(2)),
					originalTotal: Number((cartItem.originalPrice * newQuantity).toFixed(2))
				}
				: cartItem
		));
	};

	// 计算购物车商品的步长（根据单位类型）
	const getCartItemStepValue = (unit: string) => {
		const lowerUnit = unit.toLowerCase();
		if (lowerUnit === "kg" || lowerUnit === "g") {
			// kg和g单位按100g变化
			return lowerUnit === "kg" ? 0.1 : 100;
		}
		// 其他单位按1变化
		return 1;
	};

	// 渲染购物车内容 - 现代购物车 UI 设计
	const renderCartContent = () => {
		if (cartItems.length === 0) {
			return (
				<div className="flex flex-col items-center justify-center py-12 px-4">
					<div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
						<ShoppingCart className="w-8 h-8 text-slate-400" />
					</div>
					<h3 className="text-lg font-medium text-slate-900 mb-2">购物车是空的</h3>
					<p className="text-sm text-slate-500 text-center max-w-[200px]">
						添加一些商品到您的采购清单中
					</p>
				</div>
			);
		}

		return (
			<div className="space-y-6">
				{/* 购物车商品列表 */}
				<div className="max-h-[400px] overflow-auto space-y-4 pr-1">
					{cartItems.map((item) => (
						<div key={item.uniqueId || item.productId} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
							<div className="p-4">
								{/* 商品头部信息 */}
								<div className="flex items-start justify-between mb-3">
									<div className="flex-1 min-w-0">
										<h4 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-1">
											{item.name}
										</h4>
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-slate-900 font-mono">
												¥{item.price.toFixed(2)}
											</span>
											<span className="text-xs text-slate-500">/{item.unit}</span>
											{item.discountRate && item.discountRate < 1 && (
												<span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
													{Math.round((1 - item.discountRate) * 100)}% OFF
												</span>
											)}
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full flex-shrink-0"
										onClick={() => removeCartItem(item.uniqueId || item.productId)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>

								{/* 加工服务和备注 */}
								{((item.processingServices && item.processingServices.length > 0) || item.customNote) && (
									<div className="mb-3 space-y-1">
										{item.processingServices?.map((service, index) => (
											<div key={index} className="flex items-start gap-2">
												<div className="w-1 h-1 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
												<span className="text-xs text-slate-600">
													{service.type}
													{service.description && ` - ${service.description}`}
												</span>
											</div>
										))}
										{item.customNote && (
											<div className="flex items-start gap-2">
												<div className="w-1 h-1 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
												<span className="text-xs text-slate-600">
													备注: {item.customNote}
												</span>
											</div>
										)}
									</div>
								)}

								{/* 数量控制和价格 */}
								<div className="flex items-center justify-between">
									{/* 数量控制 */}
									<div className="flex items-center gap-3">
										<div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
											<Button
												variant="ghost"
												size="sm"
												className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-none"
												onClick={() => updateCartQuantity(item.uniqueId || item.productId, item.quantity - getCartItemStepValue(item.unit))}
												disabled={item.quantity - getCartItemStepValue(item.unit) < (item.minOrderQuantity || 1)}
											>
												-
											</Button>
											<div className="w-12 h-8 flex items-center justify-center text-sm font-medium border-x border-slate-200">
												{item.unit.toLowerCase() === "kg" || item.unit.toLowerCase() === "g"
													? item.quantity.toFixed(item.unit.toLowerCase() === "kg" ? 1 : 0)
													: item.quantity
												}
											</div>
											<Button
												variant="ghost"
												size="sm"
												className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-none"
												onClick={() => updateCartQuantity(item.uniqueId || item.productId, item.quantity + getCartItemStepValue(item.unit))}
											>
												+
											</Button>
										</div>
										<span className="text-xs text-slate-500">{item.unit}</span>
									</div>

									{/* 小计价格 */}
									<div className="text-right">
										<div className="text-sm font-semibold text-slate-900 font-mono">
											¥{item.total.toFixed(2)}
										</div>
										{item.discountRate && item.discountRate < 1 && (
											<div className="text-xs text-slate-500 line-through font-mono">
												¥{item.originalTotal?.toFixed(2)}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* 订单摘要和结账 */}
				<div className="bg-slate-50 rounded-xl p-4 space-y-4">
					{/* 订单摘要 */}
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span className="text-slate-600">商品总价</span>
							<span className="font-medium font-mono">¥{cartItems.reduce((sum, item) => sum + item.originalTotal, 0).toFixed(2)}</span>
						</div>
						{cartTotal < cartItems.reduce((sum, item) => sum + item.originalTotal, 0) && (
							<div className="flex justify-between text-sm">
								<span className="text-green-600">优惠金额</span>
								<span className="font-medium text-green-600 font-mono">
									-¥{(cartItems.reduce((sum, item) => sum + item.originalTotal, 0) - cartTotal).toFixed(2)}
								</span>
							</div>
						)}
						<div className="border-t border-slate-200 pt-2 flex justify-between">
							<span className="font-medium text-slate-900">总计</span>
							<span className="text-lg font-bold text-slate-900 font-mono">¥{cartTotal.toFixed(2)}</span>
						</div>
					</div>

					{/* 结账按钮 */}
					<Button
						className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/30"
						onClick={handleCheckout}
					>
						<ShoppingCart className="w-5 h-5 mr-2" />
						确认采购 ({cartItems.length} 件商品)
					</Button>

					{/* 安全提示 */}
					<p className="text-xs text-slate-500 text-center">
						您的订单将受到安全保护
					</p>
				</div>
			</div>
		);
	};

	// 初始化时从sessionStorage加载购物车数据
	useEffect(() => {
		try {
			const storedCart = sessionStorage.getItem(`cart_${organization.nameHash}`);
			if (storedCart) {
				const parsedCart = JSON.parse(storedCart);
				setCartItems(parsedCart);
			}
		} catch (error) {
			console.error("从sessionStorage恢复购物车数据失败", error);
		}
		return undefined;
	}, [organization]);

	// 购物车变更时保存到sessionStorage
	useEffect(() => {
		try {
			if (cartItems.length > 0) {
				sessionStorage.setItem(`cart_${organization.nameHash}`, JSON.stringify(cartItems));
			} else {
				sessionStorage.removeItem(`cart_${organization.nameHash}`);
			}
		} catch (error) {
			console.error("保存购物车数据到sessionStorage失败", error);
		}
		return undefined;
	}, [cartItems, organization.nameHash]);

	return (
		<div className="container mx-auto py-4 px-4 md:px-6">
			<div className="flex flex-col space-y-4">
				<div className="flex flex-col md:flex-row gap-4">
					<div className="flex-1 pb-20 md:pb-0">
						<SearchBar
							searchTerm={searchTerm}
							onSearchChange={handleSearchChange}
							onSearch={handleSearch}
							selectedCategory={selectedCategory}
							onCategoryChange={handleCategoryChange}
							selectedSubCategory={selectedSubCategory}
							onSubCategoryChange={handleSubCategoryChange}
							categories={categories}
							isSearching={isSearching}
						/>

						<ProductList
							products={displayedProducts}
							onAddToCart={addToCart}
							onViewDetail={handleViewProductDetail}
							loading={loadingMore}
							onLoadMore={loadMoreProducts}
						/>
					</div>

					{/* 采购清单 - 移动端底部浮动，桌面端右侧固定 */}
					{/* 移动端底部浮动按钮 - 始终显示 */}
					<div className="block md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-50 p-4 safe-area-inset-bottom">
						{cartItems.length > 0 ? (
							<div className="space-y-3">
								{/* 简要信息 */}
								<div className="flex items-center justify-between text-sm">
									<span className="text-slate-600">{cartItems.length} 件商品</span>
									<span className="font-bold text-slate-900 font-mono">¥{cartTotal.toFixed(2)}</span>
								</div>
								{/* 结账按钮 */}
								<Button
									className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg shadow-blue-600/20"
									onClick={() => setShowMobileCart(true)}>
									<ShoppingCart className="h-5 w-5 mr-2" />
									查看清单并结账
								</Button>
							</div>
						) : (
							<Button
								variant="outline"
								className="w-full h-12 text-base border-slate-200 rounded-xl"
								onClick={() => setShowMobileCart(true)}>
								<ShoppingCart className="h-5 w-5 mr-2" />
								采购清单
								<span className="text-xs text-slate-500 ml-2">空</span>
							</Button>
						)}
					</div>
					{/* 移动端购物车对话框 */}
					<AlertDialog open={showMobileCart} onOpenChange={setShowMobileCart}>
						<AlertDialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col rounded-2xl">
							<AlertDialogHeader className="border-b border-slate-100 pb-4">
								<AlertDialogTitle className="text-lg font-bold text-slate-900 flex items-center justify-between">
									<div className="flex items-center gap-2">
										<ShoppingCart className="w-5 h-5 text-blue-600" />
										<span>采购清单</span>
									</div>
									{cartItems.length > 0 && (
										<Badge className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1">
											{cartItems.length} 件
										</Badge>
									)}
								</AlertDialogTitle>
							</AlertDialogHeader>
							<div className="flex-1 overflow-y-auto -mx-6 px-6 py-2">
								{renderCartContent()}
							</div>
							{cartItems.length > 0 && (
								<AlertDialogFooter className="flex-col gap-3 sm:flex-row border-t border-slate-100 pt-4">
									<AlertDialogCancel className="w-full h-12 rounded-xl border-slate-200">继续选购</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => {
											setShowMobileCart(false);
											handleCheckout();
										}}
										className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20">
										确认采购 ¥{cartTotal.toFixed(2)}
									</AlertDialogAction>
								</AlertDialogFooter>
							)}
						</AlertDialogContent>
					</AlertDialog>

					{/* 桌面端右侧固定 */}
					<div className="hidden md:block w-[380px] shrink-0">
						<div className="bg-white rounded-2xl border border-slate-200 shadow-xl sticky top-4 overflow-hidden">
							<div className="p-6 border-b border-slate-100">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
											<ShoppingCart className="w-5 h-5 text-blue-600" />
										</div>
										<div>
											<h2 className="font-bold text-slate-900">采购清单</h2>
											<p className="text-xs text-slate-500">
												{cartItems.length > 0 ? `${cartItems.length} 件商品` : '暂无商品'}
											</p>
										</div>
									</div>
									{cartItems.length > 0 && (
										<Badge className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
											{cartItems.length}
										</Badge>
									)}
								</div>
							</div>
							<div className="p-6">
								{renderCartContent()}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* 产品详情侧边栏 */}
			<ProductDetailSheet
				isOpen={showDetail}
				onClose={() => setShowDetail(false)}
				product={productDetail}
				processingFees={processingFees}
				loading={loading}
				onAddToCart={addToCart}
			/>

			{/* 购物车数量编辑对话框 */}
			{selectedCartItemId && (
				<QuantityDialog
					isOpen={showQuantityDialog}
					onClose={() => setShowQuantityDialog(false)}
					onConfirm={handleCartQuantityConfirm}
					productName={cartItems.find(item => (item.uniqueId || item.productId) === selectedCartItemId)?.name || ""}
					unit={cartItems.find(item => (item.uniqueId || item.productId) === selectedCartItemId)?.unit || ""}
					initialQuantity={cartItems.find(item => (item.uniqueId || item.productId) === selectedCartItemId)?.quantity}
					minOrderQuantity={cartItems.find(item => (item.uniqueId || item.productId) === selectedCartItemId)?.minOrderQuantity || 1}
				/>
			)}

			<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base font-semibold">确认采购</AlertDialogTitle>
						<AlertDialogDescription className="text-sm">
							您确定要提交这份采购清单吗？共 {cartItems.length} 种商品，总金额 <span className="text-primary font-mono">¥{cartTotal.toFixed(2)}</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="text-xs">取消</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmCheckout} className="text-xs">
							确认
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
} 