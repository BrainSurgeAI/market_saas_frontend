'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  maxSize?: number; // MB
  width?: number;
  height?: number;
  disabled?: boolean;
}

/**
 * 图片上传组件，支持上传到华为云OBS
 */
export function ImageUpload({
  value,
  onChange,
  className = '',
  maxSize = 5, // 默认最大5MB
  width = 300,
  height = 200,
  disabled = false,
}: ImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);

  // 当文件输入发生变化时触发上传
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`文件大小不能超过${maxSize}MB`);
      toast({
        title: '文件过大',
        description: `文件大小不能超过${maxSize}MB`,
        variant: 'destructive',
      });
      return;
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError('只能上传图片文件');
      toast({
        title: '文件类型错误',
        description: '只能上传图片文件',
        variant: 'destructive',
      });
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // 创建本地预览
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);

      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);

      // 使用代理API上传
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }

      const { objectUrl } = await response.json();

      // 上传成功，更新值
      onChange(objectUrl);
      toast({
        title: '上传成功',
        description: '图片已成功上传',
      });

      // 清理本地预览
      URL.revokeObjectURL(localPreviewUrl);
    } catch (error) {
      console.error('上传图片失败:', error);
      setError((error as Error).message || '上传失败，请重试');
      toast({
        title: '上传失败',
        description: (error as Error).message || '上传图片失败，请重试',
        variant: 'destructive',
      });

      // 如果有value，恢复预览
      if (value) {
        setPreviewUrl(value);
      } else {
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
      // 清空文件输入，允许重新上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 打开文件选择器
  const handleClickUpload = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  // 移除图片
  const handleRemove = () => {
    if (disabled) return;
    setPreviewUrl(null);
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`border border-dashed rounded-md overflow-hidden 
          ${previewUrl ? 'border-transparent' : 'border-gray-300'} 
          ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ width, height }}
      >
        {previewUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={previewUrl}
              alt="已上传图片"
              fill
              className="object-cover"
              onError={() => setError('图片加载失败')}
            />
            {!disabled && (
              <div className="absolute top-2 right-2 flex space-x-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="bg-white bg-opacity-75 hover:bg-opacity-100 h-8 w-8 rounded-full"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center w-full h-full"
            onClick={handleClickUpload}
          >
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 font-medium">
                  点击上传图片
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  支持JPG, PNG等图片格式，最大{maxSize}MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
    </div>
  );
} 