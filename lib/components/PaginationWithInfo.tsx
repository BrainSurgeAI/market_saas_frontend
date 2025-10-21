'use client'

import React from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PaginationWithInfoProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  showInfo?: boolean
  className?: string
}

export function PaginationWithInfo({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  showInfo = true,
  className = '',
}: PaginationWithInfoProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // 生成页码
  const renderPageNumbers = () => {
    const maxVisiblePages = 5
    const pages = []
    
    if (totalPages <= maxVisiblePages) {
      // 显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink 
              onClick={() => onPageChange(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }
    } else {
      // 显示部分页码
      // 始终显示第一页
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink 
            onClick={() => onPageChange(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      )
      
      // 如果当前页靠近开始
      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) {
          if (i <= totalPages) {
            pages.push(
              <PaginationItem key={i}>
                <PaginationLink 
                  onClick={() => onPageChange(i)}
                  isActive={currentPage === i}
                >
                  {i}
                </PaginationLink>
              </PaginationItem>
            )
          }
        }
        if (totalPages > 5) {
          pages.push(
            <PaginationItem key="ellipsis1">
              <PaginationEllipsis />
            </PaginationItem>
          )
        }
      } 
      // 如果当前页靠近结束
      else if (currentPage >= totalPages - 2) {
        pages.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        )
        for (let i = totalPages - 3; i < totalPages; i++) {
          if (i > 1) {
            pages.push(
              <PaginationItem key={i}>
                <PaginationLink 
                  onClick={() => onPageChange(i)}
                  isActive={currentPage === i}
                >
                  {i}
                </PaginationLink>
              </PaginationItem>
            )
          }
        }
      } 
      // 如果当前页在中间
      else {
        pages.push(
          <PaginationItem key="ellipsis3">
            <PaginationEllipsis />
          </PaginationItem>
        )
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(
            <PaginationItem key={i}>
              <PaginationLink 
                onClick={() => onPageChange(i)}
                isActive={currentPage === i}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          )
        }
        pages.push(
          <PaginationItem key="ellipsis4">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
      
      // 始终显示最后一页（如果不是第一页）
      if (totalPages > 1) {
        pages.push(
          <PaginationItem key={totalPages}>
            <PaginationLink 
              onClick={() => onPageChange(totalPages)}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )
      }
    }
    
    return pages
  }

  return (
    <div className={`py-4 px-6 border-t border-gray-200 ${className}`}>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {renderPageNumbers()}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      
      {/* 分页信息 */}
      {showInfo && totalItems > 0 && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            显示第 {(currentPage - 1) * itemsPerPage + 1} 至 {Math.min(currentPage * itemsPerPage, totalItems)} 条，共 {totalItems} 条
          </p>
        </div>
      )}
    </div>
  )
} 