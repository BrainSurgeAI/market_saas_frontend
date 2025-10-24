/**
 * 分页工具函数
 */

export interface PaginationRange {
  start: number
  end: number
  pages: number[]
  showStartEllipsis: boolean
  showEndEllipsis: boolean
}

/**
 * 计算分页范围
 * @param currentPage 当前页
 * @param totalPages 总页数
 * @param maxVisiblePages 最大可见页数
 * @returns 分页范围对象
 */
export function calculatePaginationRange(
  currentPage: number,
  totalPages: number,
  maxVisiblePages: number = 5
): PaginationRange {
  const pages: number[] = []
  let showStartEllipsis = false
  let showEndEllipsis = false

  if (totalPages <= maxVisiblePages) {
    // 显示所有页码
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return {
      start: 1,
      end: totalPages,
      pages,
      showStartEllipsis: false,
      showEndEllipsis: false
    }
  }

  // 始终显示第一页
  pages.push(1)

  if (currentPage <= 3) {
    // 当前页靠近开始
    for (let i = 2; i <= 4; i++) {
      pages.push(i)
    }
    showEndEllipsis = true
  } else if (currentPage >= totalPages - 2) {
    // 当前页靠近结束
    showStartEllipsis = true
    for (let i = totalPages - 3; i < totalPages; i++) {
      pages.push(i)
    }
  } else {
    // 当前页在中间
    showStartEllipsis = true
    showEndEllipsis = true
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      pages.push(i)
    }
  }

  // 始终显示最后一页
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return {
    start: 1,
    end: totalPages,
    pages,
    showStartEllipsis,
    showEndEllipsis
  }
}

/**
 * 计算显示的项目范围
 * @param currentPage 当前页
 * @param itemsPerPage 每页项目数
 * @param totalItems 总项目数
 * @returns 显示范围 { start, end }
 */
export function calculateDisplayRange(
  currentPage: number,
  itemsPerPage: number,
  totalItems: number
): { start: number; end: number } {
  const start = (currentPage - 1) * itemsPerPage + 1
  const end = Math.min(currentPage * itemsPerPage, totalItems)
  return { start, end }
}