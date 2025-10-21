"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Percent, Plus, Loader2, AlertCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchRemoteData } from "@/lib/api-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// 定义类别接口
interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  level: number;
  level_one_category: string;
}

// 定义折扣信息接口
interface TenantDiscount {
  discountId: number;
  categoryId: number;
  categoryName: string;
  discountRate: string;
  startDate: string;
  endDate: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

// 表单验证模式 - 只验证折扣率
const formSchema = z.object({
  discountRate: z
    .string()
    .min(1, "折扣率不能为空")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0 && num <= 1;
      },
      { message: "折扣率必须是0到1之间的数字" }
    ),
});

interface AddDiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onDiscountAdded: () => void;
  existingDiscounts: TenantDiscount[];
}

export function AddDiscountDialog({
  isOpen,
  onClose,
  tenantId,
  onDiscountAdded,
  existingDiscounts,
}: AddDiscountDialogProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      discountRate: "0.9", // 默认折扣率90%
    },
  });

  // 当弹窗打开时，加载类别数据
  useEffect(() => {
    if (isOpen) {
      form.reset({
        discountRate: "0.9",
      });
      setSelectedCategories([]);
      setSearchTerm("");
      fetchCategories();
    }
  }, [isOpen, form]);

  // 获取商品类别列表
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await fetchRemoteData({
        endpoint: "/categories?level=1",
        method: "GET",
        tags: ["categories"],
      });

      if (response.success && response.data) {
        setCategories(response.data.data || []);
      } else {
        toast({
          title: "获取类别失败",
          description: response.error || "服务器返回错误，请稍后重试",
          variant: "destructive",
        });
        setCategories([]);
      }
    } catch (error) {
      console.error("获取类别出错:", error);
      toast({
        title: "获取类别失败",
        description: "请求过程中发生错误，请稍后重试",
        variant: "destructive",
      });
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // 获取已存在折扣的类别ID列表
  const existingCategoryIds = existingDiscounts.map(discount => discount.categoryId);

  // 过滤类别：1. 搜索词匹配 2. 不在已有折扣列表中
  const availableCategories = categories.filter((category) =>
    !existingCategoryIds.includes(category.id)
  );

  // 过滤显示的类别（基于搜索词）
  const filteredCategories = availableCategories.filter(category => 
    category.level_one_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 是否没有可选择的类别（所有类别都已添加折扣）
  const noAvailableCategories = categories.length > 0 && availableCategories.length === 0;

  // 切换类别选择
  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map(c => c.id));
    }
  };

  // 检查是否已全选
  const isAllSelected = selectedCategories.length === filteredCategories.length && filteredCategories.length > 0;

  // 格式化折扣率为百分比
  const formatDiscountRate = (rate: string): string => {
    const rateNum = parseFloat(rate);
    return `${(rateNum * 100).toFixed(0)}%`;
  };

  // 批量提交添加折扣
  const submitBatchDiscounts = async (values: z.infer<typeof formSchema>) => {
    if (selectedCategories.length === 0) return;

    setIsBatchSubmitting(true);

    const discountRate = values.discountRate;
    
    try {
      // 准备批量添加的折扣数据
      const discountData = selectedCategories.map(categoryId => ({
        categoryId,
        discountRate,
        startDate: new Date().toISOString().split('T')[0], // 只保留日期部分，格式为YYYY-MM-DD
        endDate: '9999-12-31'
      }));

      console.log(discountData);
      const response = await fetchRemoteData({
        endpoint: `/tenants/${tenantId}/discounts`,
        method: "POST",
        body: {
          createdBy: 'MARKET',
          discounts: discountData
        },
        tags: [`tenant-${tenantId}-discounts`],
        revalidate: 0,
      });

      if (response.success) {
        toast({
          title: "批量添加完成",
          description: `成功添加 ${selectedCategories.length} 个类别的折扣`,
          variant: "default",
        });
        onDiscountAdded();
        onClose();
      } else {
        toast({
          title: "添加失败",
          description: response.error || "批量添加折扣失败，请稍后重试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("批量添加折扣出错:", error);
      toast({
        title: "添加失败",
        description: "请求过程中发生错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>批量添加类别折扣</DialogTitle>
          <DialogDescription>
            选择多个商品类别并设置统一折扣率，一次性完成设置
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitBatchDiscounts)} className="space-y-6">
            {/* 无可用类别提示 */}
            {noAvailableCategories && (
              <Alert className="mb-4 bg-yellow-50 text-yellow-800 border-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  所有商品类别都已添加了折扣，无法添加新的类别折扣。
                </AlertDescription>
              </Alert>
            )}

            {!noAvailableCategories && (
              <>
                {/* 折扣率设置 */}
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <FormField
                      control={form.control}
                      name="discountRate"
                      render={({ field }) => (
                        <FormItem className="flex-grow max-w-xs">
                          <FormLabel>统一折扣率</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                placeholder="输入0-1之间的小数"
                                className="pl-8"
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                              />
                              <div className="absolute left-2 top-2 text-gray-500">
                                <Percent className="h-4 w-4" />
                              </div>
                            </div>
                          </FormControl>
                          <div className="text-xs text-gray-500 mt-1">
                            当前设置：{formatDiscountRate(field.value || "0")}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center space-x-6 mt-6">
                      <div className="flex items-center space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => form.setValue('discountRate', '0.95')}
                        >
                          95折
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => form.setValue('discountRate', '0.9')}
                        >
                          9折
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => form.setValue('discountRate', '0.8')}
                        >
                          8折
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 类别选择区域 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium">选择商品类别</div>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Input
                          placeholder="搜索类别..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-64 text-sm"
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={toggleSelectAll}
                      >
                        {isAllSelected ? "取消全选" : "全选"}
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-md">
                    {isLoadingCategories ? (
                      <div className="p-8 flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                        <p className="text-gray-500">加载商品类别中...</p>
                      </div>
                    ) : filteredCategories.length === 0 ? (
                      <div className="p-8 flex justify-center items-center">
                        <AlertCircle className="h-6 w-6 text-gray-400 mr-2" />
                        <p className="text-gray-500">
                          {searchTerm ? "未找到匹配的类别" : "没有可添加折扣的类别"}
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>类别名称</TableHead>
                              <TableHead>类别ID</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCategories.map((category) => (
                              <TableRow 
                                key={category.id} 
                                className={selectedCategories.includes(category.id) ? "bg-blue-50" : ""}
                              >
                                <TableCell>
                                  <Checkbox 
                                    checked={selectedCategories.includes(category.id)} 
                                    onCheckedChange={() => toggleCategory(category.id)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{category.level_one_category}</TableCell>
                                <TableCell>{category.id}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      已选择 {selectedCategories.length} / {filteredCategories.length} 个类别
                    </div>
                  </div>
                </div>

                {/* 进度显示 */}
                {isBatchSubmitting && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                    <div className="flex items-center mb-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-600" />
                      <p className="text-sm font-medium text-blue-700">
                        正在处理批量添加请求...
                      </p>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      正在为 {selectedCategories.length} 个类别添加折扣率
                    </div>
                  </div>
                )}
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isBatchSubmitting}
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={
                  isBatchSubmitting || 
                  noAvailableCategories || 
                  selectedCategories.length === 0
                }
              >
                {isBatchSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    添加中...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    批量添加折扣 ({selectedCategories.length})
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 