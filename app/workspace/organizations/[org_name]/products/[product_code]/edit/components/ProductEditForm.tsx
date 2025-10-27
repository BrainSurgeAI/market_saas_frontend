"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ProcessingFee, ProductDetailResponse } from "@/app/workspace/types";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductImageUpload } from "./ProductImageUpload";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// 定义表单验证模式
const productFormSchema = z.object({
  name: z.string().min(2, {
    message: "产品名称至少需要2个字符",
  }).max(100, {
    message: "产品名称不能超过100个字符",
  }),
  unit: z.string().min(1, {
    message: "请输入计量单位",
  }).max(4, {
    message: "计量单位不能超过4个字符",
  }),
 
  description: z.string().optional().refine(
    val => !val || val.length <= 96, 
    { message: "产品描述不能超过96个字符" }
  ),
  specialNotes: z.string().optional().refine(
    val => !val || val.length <= 255, 
    { message: "特别说明不能超过255个字符" }
  ),
  tips: z.string().optional().refine(
    val => !val || val.length <= 96, 
    { message: "使用提示不能超过96个字符" }
  ),
  brand: z.string().optional(),
  storageConditions: z.string().optional().refine(
    val => !val || val.length <= 16, 
    { message: "存储条件不能超过16个字符" }
  ),
  shelfLife: z.string().optional().refine(
    val => !val || val.length <= 8, 
    { message: "保质期不能超过8个字符" }
  ),
  pricingMethod: z.string().optional().refine(
    val => !val || val.length <= 32, 
    { message: "计价方式不能超过32个字符" }
  ),
  spec: z.string().optional().refine(
    val => !val || val.length <= 64, 
    { message: "规格不能超过64个字符" }
  ),
  taxRate: z.coerce.number().optional().refine(
    val => !val || (Number.isFinite(val) && val.toFixed(2) === val.toString()), 
    { message: "税率必须保留两位小数" }
  ),
  minOrderQuantity: z.coerce.number().optional(),
  isDisabled: z.boolean().default(false),
  processingServices: z.array(z.number()).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductEditFormProps {
  product: ProductDetailResponse;
  processingFees: ProcessingFee[];
  orgName: string;
}

export default function ProductEditForm({
  product,
  processingFees,
  orgName,
}: ProductEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState(product.product.image || '');

  // 处理图片变更
  const handleImageChange = (url: string) => {
    setImageUrl(url);
    // 上传成功后直接更新本地显示，无需调用后端 API
    if (url) {
      product.product.image = url;
      setShowImageDialog(false);
    }
  };

  // 处理图片保存
  const handleSaveImage = () => {
    // 直接关闭对话框，handleImageChange 已经处理了图片更新
    setShowImageDialog(false);
  };

  // 将产品数据转换为表单默认值
  const defaultValues: Partial<ProductFormValues> = {
    name: product.product.name,
    unit: product.product.unit,
    description: product.product.description || "",
    specialNotes: product.product.specialNotes || "",
    tips: product.product.tips || "",
    brand: product.product.brand || "",
    storageConditions: product.product.storageConditions || "",
    shelfLife: product.product.shelfLife || "",
    pricingMethod: product.product.pricingMethod || "",
    spec: product.product.spec || "",
    taxRate: product.product.taxRate !== undefined ? product.product.taxRate : undefined,
    minOrderQuantity: product.product.minOrderQuantity,
    isDisabled: product.product.isDisabled,
    processingServices: product.processingFees.map(fee => fee.processingFeeId),
  };

  // 初始化表单
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  // 提交表单
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      // 处理数据格式化
      const formattedData = {
        ...data,
      };

      // 发送请求到API
      const response = await fetch(`/api/organizations/${orgName}/products/${product.product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        throw new Error(`更新产品失败: ${response.status}`);
      }

      const res = await response.json();
      if (res.success) {
        toast({
          title: "更新成功",
          description: "产品信息已成功更新",
          variant: "default",
        });
        router.push(`/workspace/organizations/${orgName}/products`);
        router.refresh();
      } else {
        toast({
          title: "更新失败",
          description: res.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("更新产品出错:", error);
      toast({
        title: "更新失败",
        description: "无法更新产品信息，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 图片上传对话框 */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>上传产品图片</DialogTitle>
            <DialogDescription>
              选择并上传产品图片，建议使用清晰、美观的图片展示您的产品
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-center">
              <ProductImageUpload
                value={imageUrl}
                onChange={handleImageChange}
                width={350}
                height={250}
                maxSize={2}
                productCode={product.product.id}
              />
            </div>
            <div className="text-center text-sm text-gray-500">
              仅支持 .webp 格式，最大2MB
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowImageDialog(false)}
            >
              取消
            </Button>
            <Button 
              onClick={handleSaveImage}
              disabled={isSubmitting}
            >
              {isSubmitting ? "保存中..." : "保存图片"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-2"
      >
        <ArrowLeft className="h-3 w-3 mr-1" />
        <span className="text-xs">返回</span>
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 基本信息 */}
                <div className="space-y-2 md:col-span-3">
                  <h3 className="text-sm font-medium">基本信息</h3>
                  <Separator />
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 cursor-pointer" onClick={() => setShowImageDialog(true)}>
                      {product.product.image ? (
                        <div className="relative h-32 w-32 rounded-md overflow-hidden border border-gray-200 group">
                          <Image
                            src={product.product.image}
                            alt={product.product.name}
                            fill
                            className="object-cover group-hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100">点击更改</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-32 w-32 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-colors">
                          <span className="text-xs text-gray-400">点击上传图片</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm mb-1">产品编码: {product.product.id}</p>
                      <p className="text-xs text-muted-foreground">点击图片区域可以上传或更改产品图片</p>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">产品名称</FormLabel>
                      <FormControl>
                        <Input placeholder="输入产品名称" {...field} className="h-8 text-xs" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">计量单位</FormLabel>
                      <FormControl>
                        <Input placeholder="如: 千克、个、箱" {...field} className="h-8 text-xs" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        不超过4个字符
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">品牌</FormLabel>
                      <FormControl>
                        <Input placeholder="输入品牌名称" {...field} value={field.value || ""} className="h-8 text-xs" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minOrderQuantity"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">最小订购量</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="输入最小订购量"
                          {...field}
                          value={field.value || ""}
                          className="h-8 text-xs"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spec"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">规格</FormLabel>
                      <FormControl>
                        <Input placeholder="输入产品规格" {...field} value={field.value || ""} className="h-8 text-xs" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        不超过64个字符
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">税率</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="输入税率，如: 13.00"
                          {...field}
                          value={field.value || ""}
                          className="h-8 text-xs"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        必须保留两位小数
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* 详细信息 */}
                <div className="space-y-2 md:col-span-3 mt-2">
                  <h3 className="text-sm font-medium">详细信息</h3>
                  <Separator />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-1 md:col-span-3">
                      <FormLabel className="text-xs">产品描述</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="输入产品详细描述"
                          className="min-h-[60px] text-xs resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        不超过96个字符
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialNotes"
                  render={({ field }) => (
                    <FormItem className="space-y-1 md:col-span-3">
                      <FormLabel className="text-xs">特别说明</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="输入特别说明"
                          className="min-h-[60px] text-xs resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        不超过255个字符
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tips"
                  render={({ field }) => (
                    <FormItem className="space-y-1 md:col-span-3">
                      <FormLabel className="text-xs">温馨提示</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="每行输入一条提示"
                          className="min-h-[60px] text-xs resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        每行输入一条提示，将自动分条显示，不超过96个字符
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storageConditions"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">存储条件</FormLabel>
                      <FormControl>
                        <Input placeholder="如: 冷藏、常温" {...field} value={field.value || ""} className="h-8 text-xs" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        不超过16个字符
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shelfLife"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">保质期</FormLabel>
                      <FormControl>
                        <Input placeholder="如: 7天、12个月" {...field} value={field.value || ""} className="h-8 text-xs" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        不超过8个字符
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricingMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">计价方式</FormLabel>
                      <FormControl>
                        <Input placeholder="如: 按重量、按件数" {...field} value={field.value || ""} className="h-8 text-xs" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        不超过32个字符
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* <FormField
                  control={form.control}
                  name="isDisabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-2 space-y-0 md:col-span-3 mt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-xs">下架产品</FormLabel>
                        <FormDescription className="text-xs">
                          勾选此项将使产品下架，不会在产品列表中显示
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                /> */}
              </div>
            </CardContent>
          </Card>

          {processingFees.length > 0 && (
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-2 md:col-span-3">
                  <h3 className="text-sm font-medium">加工服务</h3>
                  <Separator />
                  <p className="text-xs text-muted-foreground">为产品选择适用的加工服务</p>
                </div>

                <div className="mt-4">
                  <FormLabel className="text-xs font-medium mb-2 block">加工服务选择</FormLabel>
                  <div className="space-y-2">
                    {processingFees.map((fee) => (
                      <FormField
                        key={fee.processingFeeId}
                        control={form.control}
                        name="processingServices"
                        render={({ field }) => {
                          const isChecked = field.value?.includes(fee.processingFeeId) || false;
                          return (
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    const currentValues = field.value || [];
                                    const newValue = checked
                                      ? [...currentValues, fee.processingFeeId]
                                      : currentValues.filter(id => id !== fee.processingFeeId);
                                    field.onChange(newValue);
                                  }}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal">
                                {fee.processingType}{fee.description ? ` (${fee.description})` : ''}
                                {!fee.isCheckbox && <span className="text-xs text-muted-foreground ml-1"></span>}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              size="sm"
              className="h-8 text-xs"
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting} size="sm" className="h-8 text-xs">
              {isSubmitting ? "保存中..." : "保存产品"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 