'use client'

import { memo, useEffect, useState, Suspense } from "react"
import dynamic from "next/dynamic"

// 动态导入 Lottie 组件，避免在服务器端导入
const Lottie = dynamic(() => import('lottie-react'), {
    ssr: false,
    loading: () => (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    )
})

const AnimationData = () => import('@/app/assets/lottie/truck.json').then(module => module.default)

export const LoadingOverlay = memo(function LoadingOverlay() {
    const [isClient, setIsClient] = useState(false);
    const [animationData, setAnimationData] = useState<any>(null);

    useEffect(() => {
        setIsClient(true);
        // 只在客户端加载动画数据
        AnimationData().then(data => setAnimationData(data));
    }, []);

    if (!isClient || !animationData) {
        // 在服务器端或动画数据未加载时显示一个简单的加载指示器
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="relative flex">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="relative flex">
                <div className="h-12 w-12">
                    <Suspense fallback={
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    }>
                        <Lottie
                            animationData={animationData}
                            loop={true}
                            autoplay={true}
                            rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
                            width={50}
                            height={50}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    )
})