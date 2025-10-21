import { useState } from "react"
import { PriceAnnouncement } from "@/app/workspace/types"

export function usePriceSort(products: PriceAnnouncement[]) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: '', direction: null })

  const handleSort = (key: string) => {
    setSortConfig(prevSort => ({
      key,
      direction: 
        prevSort.key === key && prevSort.direction === 'asc' 
          ? 'desc' 
          : prevSort.direction === 'desc' 
            ? null
            : 'asc'
    }))
  }

  const sortedProducts = [...products].sort((a, b) => {
    if (!sortConfig.direction) return 0
    
    const getValue = (product: PriceAnnouncement, key: string) => {
      const value = product[key as keyof PriceAnnouncement]
      return key.includes('price') ? parseFloat(value) : value
    }

    const aValue = getValue(a, sortConfig.key)
    const bValue = getValue(b, sortConfig.key)

    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1
    }
    return aValue < bValue ? 1 : -1
  })

  return { sortedProducts, sortConfig, handleSort }
}