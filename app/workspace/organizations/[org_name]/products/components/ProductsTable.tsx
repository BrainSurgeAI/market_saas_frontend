"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Archive, PlusCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import debounce from "lodash/debounce";
import { Product } from "@/app/workspace/types";

// 扩展Product接口，添加description和tips属性

interface Category {
  id: string;
  level_one_category: string;
}

interface ProductsTableProps {
  initialProducts: Product[];
  categories: Category[];
  userRole: string;
  totalProducts: number;
}

export default function ProductsTable({ 
  initialProducts, 
  categories, 
  userRole,
  totalProducts
}: ProductsTableProps) {
  const router = useRouter();
  const params = useParams();
  const org_name = params.org_name as string;
  const { toast } = useToast();
  
  // 状态
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    product: Product | null;
    action: 'archive' | 'edit';
  }>({
    isOpen: false,
    product: null,
    action: 'archive'
  });

  // 计算总页数
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  // 从服务端获取产品数据
  const fetchProducts = async (page: number, category: string = 'all', term: string = '') => {
    try {
      setIsLoading(true);
      
      // 构建查询参数
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', itemsPerPage.toString());
      
      if (category !== 'all') {
        queryParams.append('category', category);
      }
      
      if (term && term.length >= 2) {
        queryParams.append('term', term);
      }
      
      // 发送请求
      const response = await fetch(`/api/organizations/${org_name}/products?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`获取产品失败: ${response.status}`);
      }
      
      const data = await response.json();

      // 更新产品列表
      const products = data.data?.products || data.products || [];
      setProducts(products);
      setFilteredProducts(products);
    } catch (error) {
      console.error('获取产品出错:', error);
      toast({
        title: '获取产品失败',
        description: '无法获取产品列表，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    // 如果初始产品为空，从服务端获取
    if (initialProducts.length === 0) {
      fetchProducts(1);
    }
  }, []);

  // 防抖搜索
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      // 重置到第一页并获取数据
      setCurrentPage(1);
      fetchProducts(1, selectedCategory, term);
    }, 1500),
    [selectedCategory]
  );
  
  // 过滤产品
  // const filterProducts = (term: string, category: string, additionalProducts: Product[] = []) => {
  //   // 本地过滤仅用于初始数据展示
  //   // 实际搜索会调用fetchProducts进行服务端搜索
  //   const allProducts = [...products, ...additionalProducts];
    
  //   const filtered = allProducts.filter(product => {
  //     const matchesSearch = term === "" || 
  //       product.name.toLowerCase().includes(term.toLowerCase()) ||
  //       product.id.toLowerCase().includes(term.toLowerCase());
  //     const matchesCategory = category === "all" || product.categoryId.toString() === category;
  //     return matchesSearch && matchesCategory;
  //   });
    
  //   setFilteredProducts(filtered);
  // };
  
  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };
  
  // 处理类别选择
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
    fetchProducts(1, value, searchTerm);
  };
  
  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProducts(page, selectedCategory, searchTerm);
  };
  
  // 获取当前页的产品
  const getCurrentPageProducts = () => {
    // 直接返回当前过滤后的产品，因为已经是当前页的数据
    return filteredProducts;
  };
  
  // 处理编辑产品
  const handleEditProduct = (productId: string) => {
    router.push(`/workspace/organizations/${org_name}/products/${productId}/edit`);
  };
  
  // 处理上架/下架产品
  const handleArchiveProduct = async (productId: string) => {
    try {
      // 获取当前产品状态
      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error("产品不存在");
      }
      
      const isDisabled = product.isDisabled;
      
      const action = isDisabled ? "enable" : "archive";
      
      const method = isDisabled ? 'PATCH' : 'DELETE';
      const body = isDisabled ? {} : null;
      const response = await fetch(`/api/organizations/${org_name}/products/${productId}/${action}`, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`${isDisabled ? '上架' : '下架'}产品失败: ${response.status}`);
      }
      
      // 获取响应数据
      const responseData = await response.json();
      
      // 只有在远程接口调用成功后才更新本地状态
      const updatedProducts = products.map(p => 
        p.id === productId
          ? { ...p, isDisabled: !isDisabled } 
          : p
      );
      
      setProducts(updatedProducts);
      
      // 同时更新过滤后的产品列表
      setFilteredProducts(prevFiltered => 
        prevFiltered.map(p => 
          p.id === productId
            ? { ...p, isDisabled: !isDisabled } 
            : p
        )
      );
      
      toast({
        title: "操作成功",
        description: `产品已成功${isDisabled ? '上架' : '下架'}`,
        variant: "default",
      });
      
      setConfirmDialog({
        isOpen: false,
        product: null,
        action: 'archive'
      });
    } catch (error) {
      console.error("操作产品出错:", error);
      toast({
        title: "操作失败",
        description: "无法完成操作，请稍后重试",
        variant: "destructive",
      });
      // 关闭确认对话框，但不更新产品状态
      setConfirmDialog({
        isOpen: false,
        product: null,
        action: 'archive'
      });
    }
  };
  
  // 打开确认对话框
  const openConfirmDialog = (product: Product, action: 'archive' | 'edit') => { 
    setConfirmDialog({
      isOpen: true,
      product,
      action
    });
  };
  
  // 关闭确认对话框
  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      product: null,
      action: 'archive'
    });
  };
  
  // 确认操作
  const confirmAction = () => {
    if (confirmDialog.action === 'archive' && confirmDialog.product) {
      handleArchiveProduct(confirmDialog.product.id);
    } else if (confirmDialog.action === 'edit' && confirmDialog.product) {
      handleEditProduct(confirmDialog.product.id);
      closeConfirmDialog();
    }
  };
  
  // 获取类别名称
  // const getCategoryName = (categoryId: string) => {
  //   const category = categories.find(c => c.id === categoryId);
  //   return category ? category.level_one_category : "未分类";
  // };
  
  return (
    <div className="space-y-4">
      {/* 搜索、筛选和创建按钮 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div className="relative flex-1">
          {isLoading ? (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          )}
          <Input
            placeholder="搜索产品名称或编码..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.level_one_category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* 创建新品按钮 */}
        <Button 
          onClick={() => router.push(`/workspace/organizations/${org_name}/products/create`)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          创建新品
        </Button>
      </div>
      
      {/* 产品表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">产品编码</TableHead>
              <TableHead className="w-[200px]">产品名称</TableHead>
              
              <TableHead className="w-[180px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getCurrentPageProducts().map(product => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.id}</TableCell>
                <TableCell>{product.name}</TableCell>
               
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => openConfirmDialog(product, "edit")}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      编辑
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={product.isDisabled 
                        ? "h-8 px-2 text-green-600 border-green-200 hover:bg-green-50"
                        : "h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                      }
                      onClick={() => openConfirmDialog(product, "archive")}
                    >
                      <Archive className="h-3.5 w-3.5 mr-1" />
                      {product.isDisabled ? "上架" : "下架"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  没有找到匹配的产品
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* 分页 */}
      {filteredProducts.length > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {/* 生成页码 */}
              {(() => {
                const pageNumbers = [];
                const maxPagesToShow = 5;
                
                if (totalPages <= maxPagesToShow) {
                  // 如果总页数小于等于最大显示页数，显示所有页码
                  for (let i = 1; i <= totalPages; i++) {
                    pageNumbers.push(i);
                  }
                } else {
                  // 否则，显示当前页附近的页码
                  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                  let endPage = startPage + maxPagesToShow - 1;
                  
                  if (endPage > totalPages) {
                    endPage = totalPages;
                    startPage = Math.max(1, endPage - maxPagesToShow + 1);
                  }
                  
                  // 添加第一页
                  if (startPage > 1) {
                    pageNumbers.push(1);
                    if (startPage > 2) {
                      pageNumbers.push('ellipsis-start');
                    }
                  }
                  
                  // 添加中间页码
                  for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(i);
                  }
                  
                  // 添加最后一页
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pageNumbers.push('ellipsis-end');
                    }
                    pageNumbers.push(totalPages);
                  }
                }
                
                return pageNumbers.map((page, index) => {
                  if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                    return (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page as number)}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                });
              })()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          
          {/* 分页信息 */}
          <div className="text-xs text-gray-500 mt-2 text-center">
            显示第 {(currentPage - 1) * itemsPerPage + 1} 至 {Math.min(currentPage * itemsPerPage, totalProducts)} 条，共 {totalProducts} 条
          </div>
        </div>
      )}
      
      {/* 确认对话框 */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === "archive" && confirmDialog.product !== null
                ? (products.find(p => p.id === confirmDialog.product?.id)?.isDisabled 
                  ? "确认上架产品" 
                  : "确认下架产品")
                : "确认编辑产品"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === "archive" && confirmDialog.product !== null
                ? (products.find(p => p.id === confirmDialog.product?.id)?.isDisabled
                  ? `您确定要上架产品 "${confirmDialog.product?.name}" 吗？上架后，该产品将重新显示在产品列表中。`
                  : `您确定要下架产品 "${confirmDialog.product?.name}" 吗？下架后，该产品将不再显示在产品列表中。`)
                : confirmDialog.product !== null
                  ? `您确定要编辑产品 "${confirmDialog.product?.name}" 吗？`
                  : "您确定要执行此操作吗？"
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirmDialog}>
              取消
            </Button>
            <Button 
              variant={confirmDialog.action === "archive" && confirmDialog.product !== null
                ? (products.find(p => p.id === confirmDialog.product?.id)?.isDisabled ? "default" : "destructive")
                : "default"
              }
              onClick={confirmAction}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 