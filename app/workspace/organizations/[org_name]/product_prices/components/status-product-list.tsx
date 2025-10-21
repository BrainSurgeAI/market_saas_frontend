'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Eye 
} from 'lucide-react';

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

// 状态文本和样式映射
const STATUS_BADGES = {
  'PENDING': { label: '待审核', variant: 'warning' as const, icon: <Clock className="h-4 w-4 mr-1" /> },
  'PUBLISHED': { label: '已发布', variant: 'success' as const, icon: <CheckCircle className="h-4 w-4 mr-1" /> },
  'REJECTED': { label: '已拒绝', variant: 'destructive' as const, icon: <XCircle className="h-4 w-4 mr-1" /> },
};

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
}

export default function StatusProductList({ products, status, orgName }: StatusProductListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
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
  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
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
  const handleApprove = (productId: number) => {
    // TODO: 实现审核通过逻辑
    console.log(`Approve product ${productId}`);
  };

  // 审核拒绝
  const handleReject = (productId: number) => {
    // TODO: 实现审核拒绝逻辑
    console.log(`Reject product ${productId}`);
  };

  // 导出数据
  const handleExport = () => {
    // TODO: 实现导出逻辑
    console.log('Export data');
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
          {status === 'PENDING' && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              导出
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
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
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={status === 'REJECTED' ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  暂无{STATUS_BADGES[status as keyof typeof STATUS_BADGES]?.label || ''}产品
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">¥{product.maxPrice}</TableCell>
                  <TableCell className="text-right">¥{product.avgPrice}</TableCell>
                  <TableCell className="text-right">¥{product.minPrice}</TableCell>
                  <TableCell>{product.publishDate || '-'}</TableCell>
                  <TableCell>
                    {product.publishDate 
                      ? format(new Date(product.publishDate), 'yyyy-MM-dd HH:mm') 
                      : '-'}
                  </TableCell>
                  {status === 'REJECTED' && (
                    <TableCell>
                        <span className="text-sm text-red-500">{product.priceSource || '无'}</span>
                    </TableCell>
                  )}
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="p-4 border-t">
        <p className="text-sm text-muted-foreground">
          共 {filteredProducts.length} 条记录
        </p>
      </div>
    </Card>
  );
} 