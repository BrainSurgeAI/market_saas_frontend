import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useState } from "react"


interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    categories: string[];
    onSearch: () => void;
    loading?: boolean;
}


export default function SearchBar({
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    onSearch,
    loading = false
}: SearchBarProps) {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

    const handleSearchClick = () => {
        setSearchTerm(localSearchTerm);
        onSearch();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearchClick();
        }
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        // 延迟调用搜索，确保状态已更新
        setTimeout(() => {
            onSearch();
        }, 0);
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="搜索产品名称..."
                    className="pl-8 pr-20"
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                />
                <Button
                    size="sm"
                    className="absolute right-1 top-1 h-7"
                    onClick={handleSearchClick}
                    disabled={loading}
                >
                    搜索
                </Button>
            </div>
            <Select
                value={selectedCategory}
                onValueChange={handleCategoryChange}
                disabled={loading}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {categories.map(category => (
                        <SelectItem key={category} value={category}>
                            {category}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
