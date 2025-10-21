"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Percent } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

// 表单验证模式
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

// 折扣信息接口
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

interface EditDiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  discount: TenantDiscount | null;
  tenantId: string;
  onDiscountUpdated: () => void;
}

export function EditDiscountDialog({
  isOpen,
  onClose,
  discount,
  tenantId,
  onDiscountUpdated,
}: EditDiscountDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 格式化折扣率，从小数转为百分比显示
  const formatDiscountRate = (rate: string): string => {
    const rateNum = parseFloat(rate);
    return `${(rateNum * 100).toFixed(0)}%`;
  };

  // 初始化表单，预填充当前折扣值
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      discountRate: discount?.discountRate || "",
    },
  });

  // 当弹窗打开或关闭时，重置表单
  useEffect(() => {
    if (isOpen && discount) {
      form.reset({
        discountRate: discount.discountRate,
      });
    }
  }, [isOpen, discount, form]);

  // 提交表单处理
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!discount) return;

    setIsSubmitting(true);
    try {
      const response = await fetchRemoteData({
        endpoint: `/tenants/${tenantId}/discounts/${discount.discountId}`,
        method: "PATCH",
        body: {
          discountRate: values.discountRate,
          changedBy: 'MARKET',
        },
        tags: [`tenant-${tenantId}-discounts`],
      });

      if (response.success) {
        toast({
          title: "更新成功",
          description: `${discount.categoryName} 的折扣率已更新为 ${formatDiscountRate(values.discountRate)}`,
          variant: "default",
        });
        onDiscountUpdated();
        onClose();
      } else {
        toast({
          title: "更新失败",
          description: response.error || "无法更新折扣率，请稍后重试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("更新折扣率出错:", error);
      toast({
        title: "更新失败",
        description: "请求过程中发生错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑折扣率</DialogTitle>
          {discount ? (
            <>
              <DialogDescription>
                调整选定类别的折扣率
              </DialogDescription>
              <div className="mt-2 text-sm">
                为类别 <Badge className="font-semibold">{discount.categoryName}</Badge> 设置新的折扣率
              </div>
            </>
          ) : (
            <DialogDescription>
              调整选定类别的折扣率
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="discountRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>折扣率</FormLabel>
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
                  <div className="text-xs text-gray-500">
                    当前折扣率：{discount ? formatDiscountRate(discount.discountRate) : "-"}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "更新中..." : "保存更改"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 