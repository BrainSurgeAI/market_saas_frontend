'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/app/components/ImageUpload';

export default function UploadProductImagePage() {
  const router = useRouter();
  const params = useParams();
  const org_name = params.org_name as string;
  const product_code = params.product_id as string;
  const { toast } = useToast();
  
  const [productName, setProductName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 加载产品信息
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/organizations/${org_name}/products/${product_code}`);
        
        if (!response.ok) {
          throw new Error('获取产品信息失败');
        }
        
        const data = await response.json();
        setProductName(data.name || '未命名产品');
        setImageUrl(data.image || '');
        
      } catch (error) {
        console.error('获取产品信息出错:', error);
        toast({
          title: '获取产品信息失败',
          description: '无法加载产品信息，请返回产品列表重试',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (product_code) {
      fetchProductDetails();
    }
  }, [product_code, org_name, toast]);

  // 处理图片变化
  const handleImageChange = (url: string) => {
    setImageUrl(url);
  };

  // 保存产品图片
  const handleSaveImage = async () => {
    // 如果没有图片，提示错误
    if (!imageUrl) {
      toast({
        title: '请上传图片',
        description: '请先上传产品图片再保存',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 发送请求更新产品图片
      const response = await fetch(`/api/organizations/${org_name}/products/${product_code}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageUrl
        }),
      });
      
      if (!response.ok) {
        throw new Error('保存产品图片失败');
      }
      
      toast({
        title: '保存成功',
        description: '产品图片已成功保存',
      });
      
      // 导航回产品列表
      router.push(`/workspace/organizations/${org_name}/products`);
      
    } catch (error) {
      console.error('保存产品图片出错:', error);
      toast({
        title: '保存失败',
        description: '无法保存产品图片，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 跳过图片上传
  const handleSkip = () => {
    toast({
      title: '已跳过',
      description: '您没有上传产品图片，已创建产品',
    });
    router.push(`/workspace/organizations/${org_name}/products`);
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
          返回产品列表
        </Button>
        <h1 className="text-2xl font-bold">上传产品图片</h1>
      </div>
      
      {isLoading ? (
        <div className="w-full p-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="h-5 w-5 mr-2" />
                为"{productName}"上传图片
              </CardTitle>
              <CardDescription>
                选择并上传产品图片，建议使用清晰、美观的图片展示您的产品
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <ImageUpload
                  value={imageUrl}
                  onChange={handleImageChange}
                  width={400}
                  height={300}
                  maxSize={2}
                />
              </div>
              
              <div className="text-center text-sm text-gray-500">
                支持JPG、PNG等图片格式，建议尺寸至少800x600像素，最大2MB
              </div>
              
              <div className="flex justify-between mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSkip}
                >
                  跳过
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveImage}
                  disabled={isSubmitting || !imageUrl}
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      保存图片并完成
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 