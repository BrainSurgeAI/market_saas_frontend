'use client'

import { Search, SlidersHorizontal, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/lib/components/DatePicker"
import { PriceAnnouncement } from "@/app/workspace/types"
import { useEffect, useState } from "react"
import { formatDateForApi } from "@/utils"
import { useToast } from "@/hooks/use-toast"

// 省市数据
const provinces = [
	{ id: "11", name: "新疆维吾尔自治区" },
	// { id: "31", name: "上海市" },
	// { id: "44", name: "广东省" },
	// { id: "33", name: "浙江省" },
	// 可以继续添加其他省份
]

const cities = {
	"11": [{ id: "1101", name: "乌鲁木齐" },
	{ id: "1102", name: "喀什" },
	{ id: "1103", name: "库尔勒" },
	{ id: "1104", name: "吐鲁番" },
	{ id: "1105", name: "克拉玛依" },
	{ id: "1106", name: "阿勒泰" },
	{ id: "1107", name: "阿拉尔" },
	{ id: "1108", name: "图木舒克" },
	{ id: "1109", name: "北屯" },
	{ id: "1110", name: "铁门关" },
	{ id: "1111", name: "阿克苏" },
	{ id: "1112", name: "博乐" },
	{ id: "1113", name: "阿图什" },
	{ id: "1114", name: "阿拉山口" },
	{ id: "1115", name: "昌吉" },
	{ id: "1116", name: "阜康" },
	{ id: "1117", name: "伊宁" },
	{ id: "1118", name: "奎屯" },
	{ id: "1119", name: "塔城" },
	{ id: "1120", name: "乌苏" },
	{ id: "1121", name: "石河子" },
	{ id: "1122", name: "哈密" },
	]
	// "31": [{ id: "3101", name: "上海市" }],
	// "44": [
	//     { id: "4401", name: "广州市" },
	//     { id: "4403", name: "深圳市" },
	//     { id: "4406", name: "佛山市" }
	// ],
	// "33": [
	//     { id: "3301", name: "杭州市" },
	//     { id: "3302", name: "宁波市" },
	//     { id: "3303", name: "温州市" }
	//],
	// 可以继续添加其他城市
}

type SearchTriggerSource = 'SEARCH' | 'CATEGORY' | 'DATE';

interface SearchSidebarProps {
	isMobileFilterOpen: boolean
	currentDate: string
	categories: Map<number, string>
	filteredProducts: PriceAnnouncement[]
	setIsMobileFilterOpen: (isOpen: boolean) => void
	searchTerm: string
	setSearchTerm: (value: string) => void
	handleCategoryChange: (value: number, date: string) => void
	selectedCategory: number
	setSelectedCategory: (value: number) => void
	setRemoteProducts: (products: PriceAnnouncement[]) => void
}

export function SearchSidebar({
	isMobileFilterOpen,
	setIsMobileFilterOpen,
	searchTerm,
	setSearchTerm,
	handleCategoryChange,
	currentDate,
	categories,
	filteredProducts,
	selectedCategory,
	setSelectedCategory,
	setRemoteProducts
}: SearchSidebarProps) {
	const { toast } = useToast();

	const [isLoading, setIsLoading] = useState(false);
	const [searchSource, setSearchSource] = useState<string | null>(null);

	const [selectedCity, setSelectedCity] = useState("");
	const [selectedDate, setSelectedDate] = useState(currentDate);
	const [selectedProvince, setSelectedProvince] = useState(provinces.length > 0 ? provinces[0].id : "");
	const availableCities = selectedProvince ? cities[selectedProvince as keyof typeof cities] || [] : [];

	const handleReset = () => {
		setSearchTerm("");
		setSelectedCategory(0);
		setSelectedProvince(provinces.length > 0 ? provinces[0].id : "");
		setSelectedCity("");
		setSelectedDate(currentDate);
	}

	const handleProvinceChange = (provinceId: string) => {
		setSelectedProvince(provinceId);
		const provinceCities = provinceId ? cities[provinceId as keyof typeof cities] || [] : [];
		setSelectedCity(provinceCities.length > 0 ? provinceCities[0].id : "");
	}

	// 初始化时设置默认城市
	useEffect(() => {
		if (selectedProvince && availableCities.length > 0 && !selectedCity) {
			setSelectedCity(availableCities[0].id);
		}
	}, [selectedProvince, availableCities, selectedCity]);


	const handleSearchError = (title: string, description: string) => {
		toast({
			title,
			description,
			variant: 'destructive',
		});
		setRemoteProducts([]);
	};

	const searchProducts = async (params: {
		searchTerm?: string;
		categoryId?: number;
		date?: string;
		triggerSource: SearchTriggerSource;
	}) => {

		const buildSearchUrl = () => {
			const query = new URLSearchParams();

			if (term) query.append('term', term);
			if (formattedDate) query.append('date', formattedDate);
			if (selectedCategory && selectedCategory > 0) query.append('category', selectedCategory.toString());
			return `/api/price_announcements?${query.toString()}`;
		};

		const { searchTerm: term, categoryId, date, triggerSource } = params;
		const formattedDate = formatDateForApi(date || '');
		//const searchTermLower = term?.toLowerCase().trim();

		// if (triggerSource === 'SEARCH') {
		// 	if (!term || term.length < 2) return;

		// 	const localResults = initialProducts.filter(product =>
		// 		product.productName.toLowerCase().includes(searchTermLower!) ||
		// 		product.levelOneCategory.toLowerCase().includes(searchTermLower!) ||
		// 		product.levelThreeCategory.toLowerCase().includes(searchTermLower!)
		// 	);

		// 	// If there are results, do not search remotely
		// 	if (localResults.length > 0) {
		// 		console.log('本地有数据，不搜索远程');
		// 		setSelectedCategory(0);
		// 		setRemoteProducts([]);
		// 		return;
		// 	}
		// }

		// Category trigger but no category ID, return
		if (triggerSource === 'CATEGORY' && !categoryId) return;
		// Date trigger but no valid date, return
		if (triggerSource === 'DATE' && !formattedDate) return;

		try {
			setIsLoading(true);
			setSearchSource('remote');

			const searchUrl = buildSearchUrl();
			const response = await fetch(searchUrl);
			const data = await response.json();
			if (data.code !== 200) {
				throw new Error(data.message);
			}

			const result = data.data;

			if (Array.isArray(result) && result.length > 0) {
				if (triggerSource === 'SEARCH' && selectedCategory) {
					setSelectedCategory(0); // 清除选中的分类
				}
				if (triggerSource === 'CATEGORY') {
					setSearchTerm(''); // 清除搜索词
				}
				setRemoteProducts(result);

			} else {
				handleSearchError('未找到结果', `没有找到符合条件的产品`);
			}
		} catch (error) {
			handleSearchError('搜索失败', error instanceof Error ? error.message : '请求失败，请稍后重试');
		} finally {
			setIsLoading(false);
		}
	};

	// 处理搜索条件变化时折叠面板，并根据不同的触发条件执行不同的逻辑
	const handleSearchChange = (callback: (...args: any[]) => void) => {
		return (...args: any[]) => {
			callback(...args);
			setIsMobileFilterOpen(false);

			// 确定触发源和参数
			let triggerSource: SearchTriggerSource = 'SEARCH';
			let searchParams: {
				searchTerm?: string;
				categoryId?: number;
				date?: string;
				triggerSource: SearchTriggerSource;
			} = { triggerSource: 'SEARCH' };

			// 根据回调函数判断触发源
			if (callback === setSearchTerm) {
				return;
			} else if (callback === setSelectedCategory) {
				return;
			} else if (callback === handleCategoryChange) {
				return;
			} else if (callback === setSelectedDate) {
				triggerSource = 'DATE';

				// 获取日期参数
				const dateParam = typeof args[0] === 'string' ? args[0] : selectedDate;
				searchParams = {
					date: dateParam,
					triggerSource: 'DATE'
				};

				// 日期选择直接搜索，不使用防抖
				searchProducts(searchParams);
			}
		};
	};

	// 处理搜索按钮点击
	const handleSearchButtonClick = () => {
		if (!searchTerm || searchTerm.length < 2) {
			toast({
				title: "搜索词太短",
				description: "请输入至少2个字符进行搜索",
				variant: "destructive",
			});
			return;
		}

		searchProducts({ searchTerm: searchTerm, date: selectedDate, categoryId: selectedCategory, triggerSource: 'SEARCH' });
	};

	// 处理输入框变化，只更新状态，不触发搜索
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchTerm(value);
		if (value.trim() === '') {
			setRemoteProducts([]);
		}
	};

	// 处理输入框按下回车键或输入法确定输入
	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleSearchButtonClick();
		}
	};

	// 处理日期选择
	const handleDateChange = (date: string) => {
		setSelectedDate(date);

		// 清空本地筛选后的产品，确保显示新日期的数据
		setRemoteProducts([]);

		// 始终触发日期筛选，不论是否有其他条件
		searchProducts({
			searchTerm: searchTerm,
			date: date,
			categoryId: selectedCategory, // 传入当前选中的分类ID
			triggerSource: 'DATE'
		});
	};

	return (
		<div className={`lg:w-80 bg-white rounded-xl shadow-sm border border-gray-100 h-fit lg:sticky lg:top-6 lg:ml-auto shrink-0
                        ${isMobileFilterOpen ? 'block' : 'hidden lg:block'}
                        fixed lg:relative top-0 left-0 right-0 z-40 lg:z-0
                        ${isMobileFilterOpen ? 'h-screen lg:h-fit overflow-auto' : ''}`}>
			<div className="p-5">
				{/* 移动端标题栏 */}
				<div className="flex items-center justify-between lg:hidden mb-4">
					<h3 className="font-semibold text-gray-500 text-sm">搜索与筛选</h3>
					<button onClick={() => setIsMobileFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
						<X className="h-5 w-5" />
					</button>
				</div>

				<h3 className="hidden lg:block font-semibold text-gray-500 text-sm mb-5">搜索与筛选</h3>
				<div className="mb-5">
					<label className="block text-xs font-semibold text-gray-500 mb-2">
						搜索产品
					</label>
					<div className="relative">
						<input
							type="text"
							value={searchTerm}
							onChange={handleInputChange}
							onKeyDown={handleInputKeyDown}
							className="w-full pl-10 pr-4 py-2.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="输入产品名称..."
						/>
						<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
							<Search className="h-5 w-5 text-gray-400" />
						</div>
						{searchTerm && (
							<button
								onClick={() => {
									setSearchTerm("");
									setRemoteProducts([]);
								}}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
								<X className="h-5 w-5" />
							</button>
						)}
					</div>

					{/* 搜索按钮 */}
					<div className="mt-2">
						<button
							onClick={handleSearchButtonClick}
							className="w-full px-4 py-2 text-xs bg-blue-900 text-white rounded-lg
							 hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
							搜索更多
						</button>
					</div>

					{/* 搜索结果计数 */}
					{(searchTerm || selectedCategory || selectedProvince || selectedCity) && (
						<div className="mt-2">
							<p className="text-gray-500 text-xs">
								找到 {filteredProducts.length} 个匹配项
							</p>
							<p className="text-gray-500 text-xs"> {filteredProducts.length === 0 ? `没有查到数据？点击"搜索更多"获取更多数据` : ''}</p>
						</div>
					)}
					{/* 加载状态和数据来源提示 */}
					{isLoading ? (
						<div className="mt-2">
							<p className="text-xs text-blue-600">
								<span className="inline-block animate-spin mr-1">⌛</span>
								正在加载更多数据...
							</p>
						</div>
					) : searchSource && (
						<div className="mt-2">
							<p className="text-xs text-gray-500">
								数据来源：
								<span className={`
                                                font-medium
                                                ${searchSource === 'local' ? 'text-green-600' : 'text-blue-600'}
                                            `}>
									{searchSource === 'local' ? '本地缓存' : '远程服务器'}
								</span>
							</p>
						</div>
					)}
				</div>
				{/* 分类筛选 */}
				<div className="mb-5">
					<label className="block text-xs font-semibold text-gray-500 mb-2">
						按分类筛选
					</label>
					<Select value={selectedCategory.toString()} onValueChange={(value) => handleCategoryChange(parseInt(value), selectedDate)}>
						<SelectTrigger className="w-full text-xs">
							<SelectValue placeholder="选择分类" />
						</SelectTrigger>
						<SelectContent>
							{Array.from(categories.entries()).map(([id, name]) => (
								<SelectItem key={id} value={id.toString()} className="text-xs">
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{/* 日期选择 */}
				<div className="mb-5">
					<label className="block text-xs font-semibold text-gray-500 mb-2">
						选择日期
					</label>
					<DatePicker
						value={selectedDate}
						onChange={handleDateChange}
						placeholder="选择日期"
						className="w-full"
					/>
				</div>

				{/* 地区选择 - 省份 */}
				<div className="mb-5">
					<label className="block text-xs font-semibold text-gray-500 mb-2">
						选择省份
					</label>
					<Select
						value={selectedProvince}
						onValueChange={(value) => handleSearchChange(handleProvinceChange)(value)}
					>
						<SelectTrigger className="w-full text-xs">
							<SelectValue placeholder="选择省份" />
						</SelectTrigger>
						<SelectContent>
							{provinces.map((province) => (
								<SelectItem key={province.id} value={province.id} className="text-xs">
									{province.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* 地区选择 - 城市 */}
				<div className="mb-5">
					<label className="block text-xs font-semibold text-gray-500 mb-2">
						选择城市
					</label>
					<Select
						value={selectedCity}
						onValueChange={(value) => handleSearchChange(setSelectedCity)(value)}
						disabled={!selectedProvince}
					>
						<SelectTrigger className="w-full text-xs">
							<SelectValue placeholder="选择城市" />
						</SelectTrigger>
						<SelectContent>
							{availableCities.map((city) => (
								<SelectItem key={city.id} value={city.id} className="text-xs">
									{city.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* 重置按钮 */}
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => {
							handleReset();
							setIsMobileFilterOpen(false);
						}}
						className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-blue-900 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					>
						<SlidersHorizontal className="h-4 w-4 text-white" />
						重置筛选
					</button>
				</div>
			</div>
		</div>
	)
}