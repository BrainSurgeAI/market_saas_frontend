'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

// 定义分类接口
interface Category {
  id: string;
  code: string;
  level_one_category: string;
  level_two_categories?: LevelTwoCategory[];
}

interface LevelTwoCategory {
  id: string;
  code: string;
  name: string;
  level_three_categories?: LevelThreeCategory[];
}

interface LevelThreeCategory {
  id: string;
  code: string;
  name: string;
}

// 定义产品接口
interface ProductFormData {
  name: string;
  description: string;
  price: string;
  unit: string;
  stock: string;
  categoryId: string; // 这将存储三级分类的code
  image: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const params = useParams();
  const org_name = params.org_name as string;
  const { toast } = useToast();
  
  // 分类状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedLevelOne, setSelectedLevelOne] = useState<string>('');
  const [selectedLevelTwo, setSelectedLevelTwo] = useState<string>('');
  const [selectedLevelThree, setSelectedLevelThree] = useState<string>('');
  const [levelTwoOptions, setLevelTwoOptions] = useState<LevelTwoCategory[]>([]);
  const [levelThreeOptions, setLevelThreeOptions] = useState<LevelThreeCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  
  // 表单状态
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    unit: '个',
    stock: '',
    categoryId: '',
    image: 'https://placeholder.pics/svg/300x200/DEDEDE/555555/产品图片'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 加载分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('获取分类失败');
        }
        const data = await response.json();
        
        // 调试输出API返回的数据结构
        console.log('API返回的分类数据:', data);
        
        // 确保data.data是一个数组
        if (data && data.data && Array.isArray(data.data)) {
          setCategories(data.data);
        } else if (data && Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error('分类数据格式不正确:', data);
          toast({
            title: '数据格式错误',
            description: '分类数据格式不正确，请联系管理员',
            variant: 'destructive',
          });
          // 设置为空数组，避免map错误
          setCategories([]);
        }
      } catch (error) {
        console.error('获取分类出错:', error);
        toast({
          title: '获取分类失败',
          description: '无法加载分类数据，请刷新页面重试',
          variant: 'destructive',
        });
        // 设置为空数组，避免map错误
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, [toast]);
  
  // 处理一级分类变化
  const handleLevelOneChange = (value: string) => {
    setSelectedLevelOne(value);
    setSelectedLevelTwo('');
    setSelectedLevelThree('');
    setFormData({ ...formData, categoryId: '' });
    
    const selectedCategory = categories.find(c => c.id === value);
    setLevelTwoOptions(selectedCategory?.level_two_categories || []);
    setLevelThreeOptions([]);
  };
  
  // 处理二级分类变化
  const handleLevelTwoChange = (value: string) => {
    setSelectedLevelTwo(value);
    setSelectedLevelThree('');
    setFormData({ ...formData, categoryId: '' });
    
    const selectedLevelTwoCategory = levelTwoOptions.find(c => c.id === value);
    setLevelThreeOptions(selectedLevelTwoCategory?.level_three_categories || []);
  };
  
  // 处理三级分类变化
  const handleLevelThreeChange = (value: string) => {
    setSelectedLevelThree(value);
    
    // 找到选中的三级分类，获取其code作为categoryId
    const selectedLevelThreeCategory = levelThreeOptions.find(c => c.id === value);
    if (selectedLevelThreeCategory) {
      console.log(`已选择三级分类: ${selectedLevelThreeCategory.name}, code: ${selectedLevelThreeCategory.code}`);
      setFormData({ ...formData, categoryId: selectedLevelThreeCategory.code });
    }
  };
  
  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!formData.name || !formData.unit) {
      toast({
        title: '表单不完整',
        description: '请填写所有必填字段',
        variant: 'destructive',
      });
      return;
    }
    
    // 验证是否选择了三级分类
    if (!formData.categoryId || !selectedLevelThree) {
      toast({
        title: '分类选择不完整',
        description: '请选择到第三级分类',
        variant: 'destructive',
      });
      return;
    }
    
    // 验证价格和库存为数字
    if (formData.price && isNaN(Number(formData.price))) {
      toast({
        title: '价格格式错误',
        description: '价格必须是有效的数字',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.stock && isNaN(Number(formData.stock))) {
      toast({
        title: '库存格式错误',
        description: '库存必须是有效的数字',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 准备请求体
      const requestBody = {
        ...formData,
        price: formData.price ? Number(formData.price) : undefined,
        stock: formData.stock ? Number(formData.stock) : undefined,
      };
      
      // 发送创建产品请求
      const response = await fetch(`/api/organizations/${org_name}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error('创建产品失败');
      }
      
      toast({
        title: '创建成功',
        description: '产品已成功创建',
      });
      
      // 返回产品列表页
      router.push(`/workspace/organizations/${org_name}/products`);
    } catch (error) {
      console.error('创建产品出错:', error);
      toast({
        title: '创建失败',
        description: '无法创建产品，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/workspace/organizations/${org_name}/products`)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">创建新产品</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 基本信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>填写产品的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">产品名称 <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="输入产品名称"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">产品描述</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="输入产品描述"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">价格</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="输入价格"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unit">单位 <span className="text-red-500">*</span></Label>
                  <Input
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    placeholder="如：个、箱、kg"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock">库存</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="输入库存数量"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* 分类信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>分类信息</CardTitle>
              <CardDescription>选择产品所属的分类（必须选择到第三级分类）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="level-one">一级分类 <span className="text-red-500">*</span></Label>
                <Select value={selectedLevelOne} onValueChange={handleLevelOneChange}>
                  <SelectTrigger id="level-one" className={isLoadingCategories ? "opacity-70" : ""}>
                    {isLoadingCategories ? (
                      <div className="flex items-center">
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <span>加载中...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="选择一级分类" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCategories ? (
                      <SelectItem value="loading" disabled>
                        加载中...
                      </SelectItem>
                    ) : Array.isArray(categories) && categories.length > 0 ? (
                      categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.level_one_category}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        无可用分类
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level-two">二级分类 <span className="text-red-500">*</span></Label>
                <Select 
                  value={selectedLevelTwo} 
                  onValueChange={handleLevelTwoChange}
                  disabled={!selectedLevelOne}
                >
                  <SelectTrigger id="level-two">
                    <SelectValue placeholder={selectedLevelOne ? "选择二级分类" : "请先选择一级分类"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(levelTwoOptions) && levelTwoOptions.length > 0 ? (
                      levelTwoOptions.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        {selectedLevelOne ? "无可用二级分类" : "请先选择一级分类"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level-three">三级分类 <span className="text-red-500">*</span></Label>
                <Select 
                  value={selectedLevelThree} 
                  onValueChange={handleLevelThreeChange}
                  disabled={!selectedLevelTwo}
                >
                  <SelectTrigger id="level-three">
                    <SelectValue placeholder={selectedLevelTwo ? "选择三级分类" : "请先选择二级分类"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(levelThreeOptions) && levelThreeOptions.length > 0 ? (
                      levelThreeOptions.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        {selectedLevelTwo ? "无可用三级分类" : "请先选择二级分类"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                {/* 显示分类路径和分类代码 */}
                {formData.categoryId && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm font-medium text-gray-700">已选择分类路径:</p>
                    <p className="text-sm text-gray-600">
                      {Array.isArray(categories) && selectedLevelOne ? 
                        categories.find(c => c.id === selectedLevelOne)?.level_one_category || "未知一级分类" 
                        : "未选择"} &gt; 
                      {Array.isArray(levelTwoOptions) && selectedLevelTwo ? 
                        levelTwoOptions.find(c => c.id === selectedLevelTwo)?.name || "未知二级分类" 
                        : "未选择"} &gt; 
                      {Array.isArray(levelThreeOptions) && selectedLevelThree ? 
                        levelThreeOptions.find(c => c.id === selectedLevelThree)?.name || "未知三级分类" 
                        : "未选择"}
                    </p>
                    <p className="text-sm font-medium text-gray-700 mt-1">分类代码:</p>
                    <p className="text-sm text-blue-600 font-mono">{formData.categoryId}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      此代码将用于产品分类，请确保选择正确的三级分类
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">产品图片URL</Label>
                <Input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="输入产品图片URL"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/workspace/organizations/${org_name}/products`)}
            className="mr-2"
          >
            取消
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !formData.categoryId || !selectedLevelThree}
            className={!formData.categoryId || !selectedLevelThree ? "opacity-70" : ""}
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存产品
              </>
            )}
          </Button>
        </div>
        
        {/* 提示信息 */}
        {(!formData.categoryId || !selectedLevelThree) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              请选择到第三级分类后才能提交
            </p>
          </div>
        )}
      </form>
    </div>
  );
} 