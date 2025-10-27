'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from "@/app/context/permission-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckCircle,
  XCircle,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchRemoteData } from '@/lib/api-utils';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// 状态文本和样式映射
const STATUS_BADGES = {
  'PENDING': { label: '待审核', variant: 'warning' as const, icon: <Clock className="h-4 w-4 mr-1" /> },
  'PUBLISHED': { label: '已发布', variant: 'success' as const, icon: <CheckCircle className="h-4 w-4 mr-1" /> },
  'REJECTED': { label: '已拒绝', variant: 'destructive' as const, icon: <XCircle className="h-4 w-4 mr-1" /> },
};

interface PaginationData {
  total: number;
  page: number;
  page_size: number;
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

interface StatusProductListProps {
  products: Product[];
  status: string;
  orgName: string;
  pagination?: PaginationData;
  baseUrl?: string;
}

export default function StatusProductList({ products, status, orgName, pagination, baseUrl }: StatusProductListProps) {
  const router = useRouter();
  const { userRole, hasPermission } = usePermission();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // 单个产品审核状态
  const [singleRejectDialogOpen, setSingleRejectDialogOpen] = useState(false);
  const [singleRejectReason, setSingleRejectReason] = useState('');
  const [currentProductId, setCurrentProductId] = useState<number | null>(null);

  // 拒绝原因字符限制
  const MAX_REJECT_REASON_LENGTH = 32;
  const MIN_REJECT_REASON_LENGTH = 4;

  console.log('StatusProductList initialized:', {
    products,
    productsLength: Array.isArray(products) ? products.length : 'not array',
    status,
    orgName
  });

  // 只有 AUDITOR 角色才能看到操作列和批量选择
  const shouldShowActions = userRole === 'AUDITOR';
  const canBatchSelect = shouldShowActions && status === 'PENDING';
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Product | null;
    direction: 'ascending' | 'descending' | null;
  }>({
    key: 'publishDate',
    direction: 'descending',
  });

  // 处理排序
  const handleSort = (key: keyof Product) => {
    let direction: 'ascending' | 'descending' | null = 'ascending';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') {
        direction = 'descending';
      } else if (sortConfig.direction === 'descending') {
        direction = null;
      }
    }
    
    setSortConfig({ key, direction });
  };
  
  // 应用搜索和排序
  const filteredProducts = (Array.isArray(products) ? products : [])
    .filter(product =>
      product &&
      typeof product === 'object' &&
      product.name &&
      product.category &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (!sortConfig.key || !sortConfig.direction) return 0;
      
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // 处理可能为undefined的值
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      // 比较字符串
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // 比较数字
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending' 
          ? aValue - bValue 
          : bValue - aValue;
      }
      
      // 比较日期
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // 检查字符串是否是日期格式
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return sortConfig.direction === 'ascending' 
            ? aDate.getTime() - bDate.getTime() 
            : bDate.getTime() - aDate.getTime();
        }
      }
      
      // 将不同类型转为字符串比较
      const aString = String(aValue);
      const bString = String(bValue);
      
      return sortConfig.direction === 'ascending' 
        ? aString.localeCompare(bString) 
        : bString.localeCompare(aString);
    });

  // 查看产品详情
  const handleViewProduct = (productId: number) => {
    router.push(`/workspace/organizations/${orgName}/product_prices/detail/${productId}`);
  };

  // 审核通过
  const handleApprove = async (productId: number) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await fetchRemoteData({
        endpoint: `/tenants/${orgName}/prices/approve-price`,
        method: 'PATCH',
        body: {
          status: 'approved',
          products: [productId], // 将单个产品ID放入数组
          remark: '审核通过'
        },
        needToken: true
      });

      if (response.success) {
        console.log(`产品 ${productId} 审核通过成功:`, response.data);
        // 刷新页面数据
        window.location.reload();
      } else {
        console.error(`产品 ${productId} 审核通过失败:`, response.error);
      }
    } catch (error) {
      console.error(`产品 ${productId} 审核通过出错:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 审核拒绝 - 打开单个产品拒绝对话框
  const handleReject = (productId: number) => {
    if (isProcessing) return;

    setCurrentProductId(productId);
    setSingleRejectDialogOpen(true);
  };

  // 导出数据
  const handleExport = () => {
    // TODO: 实现导出逻辑
    console.log('Export data');
  };

  // 处理产品选择
  const handleProductSelect = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(product => product.id));
    } else {
      setSelectedProducts([]);
    }
  };

  // 批量审核通过
  const handleBatchApprove = async () => {
    if (selectedProducts.length === 0) {
      console.log('No products selected for approval');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetchRemoteData({
        endpoint: `/tenants/${orgName}/prices/approve-price`,
        method: 'PATCH',
        body: {
          status: 'approved',
          products: selectedProducts,
          remark: '批量审核通过'
        },
        needToken: true
      });

      if (response.success) {
        console.log('批量审核通过成功:', response.data);
        setSelectedProducts([]);
        // 刷新页面数据
        window.location.reload();
      } else {
        console.error('批量审核通过失败:', response.error);
      }
    } catch (error) {
      console.error('批量审核通过出错:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 批量审核拒绝
  const handleBatchReject = async () => {
    if (selectedProducts.length === 0) {
      console.log('No products selected for rejection');
      return;
    }

    // 打开拒绝原因对话框
    setRejectDialogOpen(true);
  };

  // 执行批量拒绝
  const executeBatchReject = async () => {
    const trimmedReason = rejectReason.trim();

    if (!trimmedReason) {
      return;
    }

    if (trimmedReason.length < MIN_REJECT_REASON_LENGTH) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetchRemoteData({
        endpoint: `/tenants/${orgName}/prices/approve-price`,
        method: 'PATCH',
        body: {
          status: 'rejected',
          products: selectedProducts,
          remark: trimmedReason
        },
        needToken: true
      });

      if (response.success) {
        console.log('批量审核拒绝成功:', response.data);
        setSelectedProducts([]);
        setRejectReason('');
        setRejectDialogOpen(false);
        // 刷新页面数据
        window.location.reload();
      } else {
        console.error('批量审核拒绝失败:', response.error);
      }
    } catch (error) {
      console.error('批量审核拒绝出错:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理拒绝原因输入变化
  const handleRejectReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_REJECT_REASON_LENGTH) {
      setRejectReason(value);
    }
  };

  // 检查拒绝原因是否有效
  const isRejectReasonValid = () => {
    const trimmedReason = rejectReason.trim();
    return trimmedReason.length >= MIN_REJECT_REASON_LENGTH &&
           trimmedReason.length <= MAX_REJECT_REASON_LENGTH;
  };

  // 获取字符计数显示文本
  const getCharacterCountText = () => {
    const currentLength = rejectReason.trim().length;
    return `${currentLength}/${MAX_REJECT_REASON_LENGTH} 字`;
  };

  // 获取字符计数样式
  const getCharacterCountClassName = () => {
    const currentLength = rejectReason.trim().length;
    if (currentLength < MIN_REJECT_REASON_LENGTH) {
      return 'text-xs text-red-500 text-right';
    } else if (currentLength >= MAX_REJECT_REASON_LENGTH) {
      return 'text-xs text-orange-500 text-right';
    }
    return 'text-xs text-muted-foreground text-right';
  };

  // 关闭批量拒绝对话框
  const handleRejectDialogClose = () => {
    setRejectDialogOpen(false);
    setRejectReason('');
  };

  // 执行单个产品拒绝
  const executeSingleReject = async () => {
    const trimmedReason = singleRejectReason.trim();

    if (!trimmedReason) {
      return;
    }

    if (trimmedReason.length < MIN_REJECT_REASON_LENGTH) {
      return;
    }

    if (currentProductId === null) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetchRemoteData({
        endpoint: `/tenants/${orgName}/prices/approve-price`,
        method: 'PATCH',
        body: {
          status: 'rejected',
          products: [currentProductId], // 将单个产品ID放入数组
          remark: trimmedReason
        },
        needToken: true
      });

      if (response.success) {
        console.log(`产品 ${currentProductId} 审核拒绝成功:`, response.data);
        setSingleRejectReason('');
        setSingleRejectDialogOpen(false);
        setCurrentProductId(null);
        // 刷新页面数据
        window.location.reload();
      } else {
        console.error(`产品 ${currentProductId} 审核拒绝失败:`, response.error);
      }
    } catch (error) {
      console.error(`产品 ${currentProductId} 审核拒绝出错:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理单个产品拒绝原因输入变化
  const handleSingleRejectReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_REJECT_REASON_LENGTH) {
      setSingleRejectReason(value);
    }
  };

  // 检查单个产品拒绝原因是否有效
  const isSingleRejectReasonValid = () => {
    const trimmedReason = singleRejectReason.trim();
    return trimmedReason.length >= MIN_REJECT_REASON_LENGTH &&
           trimmedReason.length <= MAX_REJECT_REASON_LENGTH;
  };

  // 获取单个产品字符计数显示文本
  const getSingleCharacterCountText = () => {
    const currentLength = singleRejectReason.trim().length;
    return `${currentLength}/${MAX_REJECT_REASON_LENGTH} 字`;
  };

  // 获取单个产品字符计数样式
  const getSingleCharacterCountClassName = () => {
    const currentLength = singleRejectReason.trim().length;
    if (currentLength < MIN_REJECT_REASON_LENGTH) {
      return 'text-xs text-red-500 text-right';
    } else if (currentLength >= MAX_REJECT_REASON_LENGTH) {
      return 'text-xs text-orange-500 text-right';
    }
    return 'text-xs text-muted-foreground text-right';
  };

  // 关闭单个产品拒绝对话框
  const handleSingleRejectDialogClose = () => {
    setSingleRejectDialogOpen(false);
    setSingleRejectReason('');
    setCurrentProductId(null);
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-white border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索产品..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          {canBatchSelect && selectedProducts.length > 0 && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleBatchApprove}
                disabled={isProcessing}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                批量通过 ({selectedProducts.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchReject}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-1" />
                批量拒绝 ({selectedProducts.length})
              </Button>
            </>
          )}
          {/* {status === 'PENDING' && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              导出
            </Button>
          )} */}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {canBatchSelect && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="全选"
                  />
                </TableHead>
              )}
              <TableHead className="w-[250px]">
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  产品名称
                  {sortConfig.key === 'name' && (
                    sortConfig.direction === 'ascending' ?
                      <ChevronUp className="ml-1 h-4 w-4" /> :
                      <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('category')}
                >
                  类别
                  {sortConfig.key === 'category' && (
                    sortConfig.direction === 'ascending' ? 
                      <ChevronUp className="ml-1 h-4 w-4" /> : 
                      <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div 
                  className="flex items-center justify-end cursor-pointer"
                  onClick={() => handleSort('avgPrice')}
                >
                  最高价
                  {sortConfig.key === 'avgPrice' && (
                    sortConfig.direction === 'ascending' ? 
                      <ChevronUp className="ml-1 h-4 w-4" /> : 
                      <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div 
                  className="flex items-center justify-end cursor-pointer"
                  onClick={() => handleSort('avgPrice')}
                >
                  中间价
                  {sortConfig.key === 'avgPrice' && (
                    sortConfig.direction === 'ascending' ? 
                      <ChevronUp className="ml-1 h-4 w-4" /> : 
                      <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div 
                  className="flex items-center justify-end cursor-pointer"
                  onClick={() => handleSort('avgPrice')}
                >
                  最低价
                  {sortConfig.key === 'avgPrice' && (
                    sortConfig.direction === 'ascending' ? 
                      <ChevronUp className="ml-1 h-4 w-4" /> : 
                      <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('publishDate')}
                >
                  发布日期
                  {sortConfig.key === 'publishDate' && (
                    sortConfig.direction === 'ascending' ? 
                      <ChevronUp className="ml-1 h-4 w-4" /> : 
                      <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort('publishDate')}
                >
                  更新时间
                  {sortConfig.key === 'publishDate' && (
                    sortConfig.direction === 'ascending' ? 
                      <ChevronUp className="ml-1 h-4 w-4" /> : 
                      <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              {status === 'REJECTED' && (
                <TableHead>
                  拒绝原因
                </TableHead>
              )}
              {shouldShowActions && <TableHead className="text-center">操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    (status === 'REJECTED' ? 7 : 6) + (shouldShowActions ? 1 : 0) + (canBatchSelect ? 1 : 0)
                  }
                  className="text-center py-8 text-muted-foreground"
                >
                  暂无{STATUS_BADGES[status as keyof typeof STATUS_BADGES]?.label || ''}产品
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  {canBatchSelect && (
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleProductSelect(product.id, checked as boolean)}
                        aria-label={`选择产品 ${product.name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-sm">{product.name}</TableCell>
                  <TableCell className='font-sm'>{product.category}</TableCell>
                  <TableCell className="text-right font-mono">{product.maxPrice}</TableCell>
                  <TableCell className="text-right font-mono">{product.avgPrice}</TableCell>
                  <TableCell className="text-right font-mono">{product.minPrice}</TableCell>
                  <TableCell className='text-left font-mono'>{product.publishDate || '-'}</TableCell>
                  <TableCell className='text-left font-mono'>
                    {product.publishDate 
                      ? format(new Date(product.publishDate), 'yyyy-MM-dd HH:mm') 
                      : '-'}
                  </TableCell>
                  {status === 'REJECTED' && (
                    <TableCell>
                        <span className="text-sm text-red-500">{product.priceSource || '无'}</span>
                    </TableCell>
                  )}
                  {shouldShowActions && (
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewProduct(product.id)}
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {status === 'PENDING' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleApprove(product.id)}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                审核通过
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(product.id)}>
                                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                拒绝
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页组件 */}
      {pagination && pagination.total > pagination.page_size && (
        <div className="p-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (pagination.page > 1 && baseUrl) {
                      router.push(`${baseUrl}?page=${pagination.page - 1}`);
                    }
                  }}
                  className={pagination.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {/* 生成页码 */}
              {(() => {
                const totalPages = Math.ceil(pagination.total / pagination.page_size);
                const pageNumbers = [];
                const maxPagesToShow = 5;

                if (totalPages <= maxPagesToShow) {
                  for (let i = 1; i <= totalPages; i++) {
                    pageNumbers.push(i);
                  }
                } else {
                  if (pagination.page <= 3) {
                    for (let i = 1; i <= 4; i++) {
                      pageNumbers.push(i);
                    }
                    pageNumbers.push('ellipsis');
                    pageNumbers.push(totalPages);
                  } else if (pagination.page >= totalPages - 2) {
                    pageNumbers.push(1);
                    pageNumbers.push('ellipsis');
                    for (let i = totalPages - 3; i <= totalPages; i++) {
                      pageNumbers.push(i);
                    }
                  } else {
                    pageNumbers.push(1);
                    pageNumbers.push('ellipsis');
                    for (let i = pagination.page - 1; i <= pagination.page + 1; i++) {
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
                        onClick={() => {
                          if (baseUrl) {
                            router.push(`${baseUrl}?page=${page}`);
                          }
                        }}
                        isActive={pagination.page === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                });
              })()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    const totalPages = Math.ceil(pagination.total / pagination.page_size);
                    if (pagination.page < totalPages && baseUrl) {
                      router.push(`${baseUrl}?page=${pagination.page + 1}`);
                    }
                  }}
                  className={pagination.page === Math.ceil(pagination.total / pagination.page_size) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {/* 分页信息 */}
          <div className="text-xs text-gray-500 mt-2 text-center">
            显示第 {(pagination.page - 1) * pagination.page_size + 1} 至 {Math.min(pagination.page * pagination.page_size, pagination.total)} 条，共 {pagination.total} 条
          </div>
        </div>
      )}

      <div className="p-4 border-t">
        <p className="text-sm text-muted-foreground">
          当前页显示 {filteredProducts.length} 条记录
          {pagination && `，总共 ${pagination.total} 条`}
        </p>
      </div>

      {/* 拒绝原因对话框 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>批量审核拒绝</DialogTitle>
            <DialogDescription>
              您选择了 {selectedProducts.length} 个产品进行拒绝操作。请输入拒绝原因（{MIN_REJECT_REASON_LENGTH}-{MAX_REJECT_REASON_LENGTH}字）。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="rejectReason" className="text-right mt-2">
                拒绝原因
              </Label>
              <div className="col-span-3 space-y-2">
                <Textarea
                  id="rejectReason"
                  placeholder="请输入拒绝原因..."
                  value={rejectReason}
                  onChange={handleRejectReasonChange}
                  className="min-h-[100px] resize-none"
                  disabled={isProcessing}
                  maxLength={MAX_REJECT_REASON_LENGTH}
                />
                <div className={getCharacterCountClassName()}>
                  {getCharacterCountText()}
                  {rejectReason.trim().length < MIN_REJECT_REASON_LENGTH && (
                    <span className="ml-1">（最少{MIN_REJECT_REASON_LENGTH}字）</span>
                  )}
                </div>
                {rejectReason.trim().length > 0 && rejectReason.trim().length < MIN_REJECT_REASON_LENGTH && (
                  <div className="text-xs text-red-500">
                    拒绝原因至少需要{MIN_REJECT_REASON_LENGTH}个字
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleRejectDialogClose}
              disabled={isProcessing}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={executeBatchReject}
              disabled={!isRejectReasonValid() || isProcessing}
            >
              {isProcessing ? '处理中...' : '确认拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 单个产品拒绝原因对话框 */}
      <Dialog open={singleRejectDialogOpen} onOpenChange={setSingleRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>审核拒绝</DialogTitle>
            <DialogDescription>
              请输入拒绝原因（{MIN_REJECT_REASON_LENGTH}-{MAX_REJECT_REASON_LENGTH}字）。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="singleRejectReason" className="text-right mt-2">
                拒绝原因
              </Label>
              <div className="col-span-3 space-y-2">
                <Textarea
                  id="singleRejectReason"
                  placeholder="请输入拒绝原因..."
                  value={singleRejectReason}
                  onChange={handleSingleRejectReasonChange}
                  className="min-h-[100px] resize-none"
                  disabled={isProcessing}
                  maxLength={MAX_REJECT_REASON_LENGTH}
                />
                <div className={getSingleCharacterCountClassName()}>
                  {getSingleCharacterCountText()}
                  {singleRejectReason.trim().length < MIN_REJECT_REASON_LENGTH && (
                    <span className="ml-1">（最少{MIN_REJECT_REASON_LENGTH}字）</span>
                  )}
                </div>
                {singleRejectReason.trim().length > 0 && singleRejectReason.trim().length < MIN_REJECT_REASON_LENGTH && (
                  <div className="text-xs text-red-500">
                    拒绝原因至少需要{MIN_REJECT_REASON_LENGTH}个字
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleSingleRejectDialogClose}
              disabled={isProcessing}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={executeSingleReject}
              disabled={!isSingleRejectReasonValid() || isProcessing}
            >
              {isProcessing ? '处理中...' : '确认拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 