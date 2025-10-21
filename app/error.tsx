'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 可以将错误发送到日志服务
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 py-16 space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold text-gray-900">数据加载失败</h2>
        <p className="text-gray-600 max-w-md">
          很抱歉，我们无法加载所需数据。请稍后再试或联系支持团队。
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 mt-4 bg-gray-100 rounded-md text-left overflow-auto max-w-md mx-auto">
            <p className="text-red-500 font-mono text-sm">{error.message}</p>
          </div>
        )}
      </div>
      <Button 
        onClick={reset}
        variant="default"
      >
        重试
      </Button>
    </div>
  )
}