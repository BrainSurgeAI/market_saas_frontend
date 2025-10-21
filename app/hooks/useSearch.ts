import { useState, useCallback, useEffect } from 'react'
import debounce from 'lodash/debounce'
import { PriceAnnouncement } from '@/app/workspace/types'

export function useSearch(localProducts: PriceAnnouncement[]) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchSource, setSearchSource] = useState<'local' | 'remote' | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<PriceAnnouncement[]>(localProducts)

  // 本地搜索函数
  const searchLocal = useCallback((term: string, category: string) => {
    if (!term && !category) {
      setSearchSource(null)
      return localProducts
    }

    const filtered = localProducts.filter(product => {
      const matchesSearch = !term || 
        product.productName.toLowerCase().includes(term.toLowerCase()) ||
        product.levelOneCategory.toLowerCase().includes(term.toLowerCase())

      const matchesCategory = !category || 
        product.levelOneCategory === category

      return matchesSearch && matchesCategory
    })

    setSearchSource('local')
    return filtered
  }, [localProducts])

  // 远程搜索函数
  const searchRemote = useCallback(async (term: string, category: string) => {
    try {
      setIsSearching(true)
      const response = await fetch(
        `/api/price_announcements/search?term=${encodeURIComponent(term)}&category=${encodeURIComponent(category)}`
      )
      
      if (!response.ok) throw new Error('搜索请求失败')
      
      const data = await response.json()
      if (data.code === 200) {
        //setRemoteProducts(data.data)
        setSearchSource('remote')
        return data.data
      }
      throw new Error(data.message)
    } catch (error) {
      console.error('远程搜索失败:', error)
      return []
    } finally {
      setIsSearching(false)
    }
  }, [])

  // 防抖的搜索处理函数
  const debouncedSearch = useCallback(
    debounce(async (term: string, category: string) => {
      const localResults = searchLocal(term, category)
      setFilteredProducts(localResults)
      
      if (localResults.length === 0 && (term || category)) {
        const remoteResults = await searchRemote(term, category)
        setFilteredProducts(remoteResults)
      }
    }, 300),
    [searchLocal, searchRemote]
  )

  // 使用 useEffect 处理搜索
  useEffect(() => {
    debouncedSearch(searchTerm, selectedCategory)
    return () => debouncedSearch.cancel()
  }, [searchTerm, selectedCategory, debouncedSearch])

  // 处理搜索输入
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  // 处理分类选择
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
  }, [])

  return {
    searchTerm,
    selectedCategory,
    isSearching,
    filteredProducts,
    handleSearch,
    handleCategoryChange,
    searchSource
  }
}