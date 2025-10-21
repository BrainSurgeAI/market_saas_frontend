"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Loader2, ListFilter } from "lucide-react";
import { CategoryWithSubCategories, SubCategory } from "../../types";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	onSearch: () => void;
	selectedCategory: string;
	onCategoryChange: (value: string) => void;
	selectedSubCategory?: string;
	onSubCategoryChange?: (value: string) => void;
	categories: CategoryWithSubCategories[];
	isSearching?: boolean;
}

export function SearchBar({
	searchTerm,
	onSearchChange,
	onSearch,
	selectedCategory,
	onCategoryChange,
	selectedSubCategory = "all",
	onSubCategoryChange,
	categories,
	isSearching = false
}: SearchBarProps) {
	const categoriesMap = new Map(categories.map(category => [category.id.toString(), category.category]));

	const getSubCategories = (): SubCategory[] => {
		if (selectedCategory === "all") return [];

		const selectedCategoryObj = categories.find(cat => cat.id.toString() === selectedCategory);
		return selectedCategoryObj?.subCategories || [];
	};

	const subCategories = getSubCategories();
	const hasSubCategories = subCategories.length > 0;

	// 处理回车键搜索
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			onSearch();
		}
	};

	return (
		<div className="flex items-center gap-2">
			<div className="relative flex-1 text-xs">
				{isSearching ? (
					<Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
				) : (
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
				)}
				<Input
					placeholder="搜索产品..."
					value={searchTerm}
					onChange={(e) => onSearchChange(e.target.value)}
					onKeyDown={handleKeyDown}
					className="pl-10 h-9 text-xs"
				/>
			</div>
			<Button onClick={onSearch} className="h-9 text-xs" disabled={isSearching} size="sm">
				搜索
			</Button>
			<Select value={selectedCategory} onValueChange={(value) => {
				onCategoryChange(value);
				if (onSubCategoryChange) {
					onSubCategoryChange("all");
				}}}>
				<SelectTrigger className="w-[140px] h-9 text-xs">
					<div className="flex items-center">
						<Filter className="h-3.5 w-3.5 mr-2 text-gray-500" />
						<SelectValue placeholder="全部分类" className="text-xs" />
					</div>
				</SelectTrigger>
				<SelectContent className="text-xs">
					<SelectItem value="all" className="text-xs">全部分类</SelectItem>
					{Array.from(categoriesMap.entries()).map(([id, name]) => (
						<SelectItem key={id} value={id} className="text-xs">
							{name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{onSubCategoryChange && (
				<Select
					value={selectedSubCategory}
					onValueChange={onSubCategoryChange}
					disabled={!hasSubCategories || selectedCategory === "all"}
				>
					<SelectTrigger className="w-[140px] h-9 text-xs">
						<div className="flex items-center">
							<ListFilter className="h-3.5 w-3.5 mr-2 text-gray-500" />
							<SelectValue placeholder="全部子类别" className="text-xs" />
						</div>
					</SelectTrigger>
					<SelectContent className="text-xs">
						<SelectItem value="all" className="text-xs">全部子类别</SelectItem>
						{subCategories.map((subCat) => (
							<SelectItem key={subCat.id} value={subCat.id.toString()} className="text-xs">
								{subCat.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		</div>
	);
} 