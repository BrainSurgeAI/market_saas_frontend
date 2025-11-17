import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // 服务器端和客户端首次渲染都返回 false，避免 hydration mismatch
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    setHasMounted(true)
    // 只在客户端 hydration 完成后才设置实际值
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    checkMobile()
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      checkMobile()
    }
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // 在 hydration 完成前返回 false，确保服务器端和客户端首次渲染一致
  if (!hasMounted) {
    return false
  }

  return isMobile
}
