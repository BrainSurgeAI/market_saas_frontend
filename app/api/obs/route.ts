import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// OBS配置（这些信息应该存储在环境变量中）
const OBS_AK = process.env.OBS_ACCESS_KEY_ID || '';
const OBS_SK = process.env.OBS_SECRET_ACCESS_KEY || '';
const OBS_ENDPOINT = process.env.OBS_ENDPOINT || 'obs.cn-north-4.myhuaweicloud.com';
const OBS_BUCKET = process.env.OBS_BUCKET || 'market-saas';

/**
 * 生成华为云OBS临时上传URL
 */
export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType = 'image/jpeg' } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: '文件名不能为空' },
        { status: 400 }
      );
    }
    
    if (!OBS_AK || !OBS_SK) {
      return NextResponse.json(
        { error: '系统配置错误: 缺少OBS访问密钥' },
        { status: 500 }
      );
    }

    // 检查是否是产品图片上传（文件名为产品编码.webp格式）
    const isProductImage = /^\d+\.webp$/.test(fileName);
    
    // 确定对象键路径
    let objectKey;
    if (isProductImage) {
      // 产品图片直接使用产品编码作为文件名，放在 products 目录下
      objectKey = `products/${fileName}`;
    } else {
      // 其他图片按年月日组织
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      // 生成唯一的文件名，防止覆盖
      const timestamp = now.getTime();
      const randomStr = Math.random().toString(36).substring(2, 10);
      objectKey = `uploads/${year}/${month}/${day}/${timestamp}-${randomStr}-${fileName}`;
    }
    
    // 构建临时签名URL
    const method = 'PUT';
    
    // 请求有效期（10分钟）
    const expires = Math.floor(Date.now() / 1000) + 600;
    
    // 构建标准化请求
    const canonicalizedResource = `/${OBS_BUCKET}/${objectKey}`;
    
    // 构建待签名字符串
    // 根据华为云OBS API文档，临时授权的签名字符串结构为：
    // Method + "\n" + Content-MD5 + "\n" + Content-Type + "\n" + Expires + "\n" + CanonicalizedHeaders + CanonicalizedResource
    const stringToSign = `${method}\n\n${contentType}\n${expires}\n${canonicalizedResource}`;
    
    // 计算签名
    const signature = crypto.createHmac('sha1', OBS_SK)
      .update(stringToSign)
      .digest('base64');
    
    // 构建带签名的URL
    const signedUrl = `https://${OBS_BUCKET}.${OBS_ENDPOINT}/${objectKey}?` +
      `AWSAccessKeyId=${OBS_AK}&` +
      `Expires=${expires}&` +
      `Signature=${encodeURIComponent(signature)}`;
    
    // 返回可以直接用于上传的信息
    return NextResponse.json({
      signedUrl,
      method,
      headers: {
        'Content-Type': contentType
      },
      objectUrl: `https://${OBS_BUCKET}.${OBS_ENDPOINT}/${objectKey}`,
      objectKey
    });
    
  } catch (error) {
    console.error('生成OBS临时上传URL失败:', error);
    return NextResponse.json(
      { error: '生成OBS临时上传URL失败' },
      { status: 500 }
    );
  }
} 