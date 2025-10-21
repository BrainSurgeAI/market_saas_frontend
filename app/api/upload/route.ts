import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] 收到文件上传请求');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productCode = formData.get('productCode') as string;
    
    if (!file) {
      console.error('[API] 没有文件被上传');
      return NextResponse.json(
        { error: '没有文件' },
        { status: 400 }
      );
    }

    console.log('[API] 文件信息:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)}KB`,
      productCode
    });

    // 验证文件类型，仅允许 webp
    if (file.type !== 'image/webp') {
      console.error('[API] 文件类型错误:', file.type);
      return NextResponse.json(
        { error: '只能上传 .webp 格式的图片' },
        { status: 400 }
      );
    }
    
    // 确定文件名，优先使用 productCode
    const fileName = productCode ? `${productCode}.webp` : file.name;
    console.log('[API] 使用文件名:', fileName);

    try {
      // 获取华为云OBS的临时授权参数
      console.log('[API] 请求 OBS 签名 URL');
      const obsResponse = await fetch(`${request.nextUrl.origin}/api/obs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          contentType: 'image/webp',
        }),
        cache: 'no-store', // 避免缓存问题
      });
      
      if (!obsResponse.ok) {
        const errorText = await obsResponse.text();
        console.error('[API] 获取 OBS 签名失败:', obsResponse.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `获取上传URL失败: ${obsResponse.status}`);
        } catch (parseError) {
          throw new Error(`获取上传URL失败: ${obsResponse.status}, ${errorText.slice(0, 100)}`);
        }
      }
      
      const obsData = await obsResponse.json();
      console.log('[API] 获取 OBS 签名成功:', { objectKey: obsData.objectKey });
      const { signedUrl, method, headers, objectUrl } = obsData;
      
      // 从服务端上传文件到OBS
      console.log('[API] 准备上传文件到华为云 OBS');
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      // 服务端发起请求到华为云OBS
      try {
        console.log('[API] 开始上传文件到 OBS:', signedUrl);
        const uploadResponse = await fetch(signedUrl, {
          method,
          headers,
          body: fileBuffer,
        });
        
        if (!uploadResponse.ok) {
          const responseText = await uploadResponse.text();
          console.error('[API] 上传到 OBS 失败:', uploadResponse.status, responseText.slice(0, 200));
          throw new Error(`上传失败，状态码: ${uploadResponse.status}`);
        }
        
        console.log('[API] 文件上传成功:', objectUrl);
        return NextResponse.json({
          success: true,
          objectUrl
        });
      } catch (uploadError) {
        console.error('[API] 上传到 OBS 时出错:', uploadError);
        throw new Error(`上传到 OBS 服务失败: ${(uploadError as Error).message}`);
      }
    } catch (innerError) {
      console.error('[API] 上传处理过程中出错:', innerError);
      throw innerError;
    }
    
  } catch (error) {
    console.error('[API] 上传失败:', error);
    return NextResponse.json(
      { error: (error as Error).message || '上传失败' },
      { status: 500 }
    );
  }
} 