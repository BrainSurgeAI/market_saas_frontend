'use client'

import { useMemo } from "react"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis
} from "@/components/ui/pagination"
import { calculatePaginationRange, calculateDisplayRange } from "@/utils/pagination"

export interface CustomPaginationProps {
    currentPage: number
    setCurrentPage: (pageOrFn: number | ((prev: number) => number)) => void
    totalItems: number
    itemsPerPage: number
    maxVisiblePages?: number
}

export function CustomPagination({
    currentPage,
    setCurrentPage,
    totalItems,
    itemsPerPage,
    maxVisiblePages = 5
}: CustomPaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const paginationRange = useMemo(() => {
        return calculatePaginationRange(currentPage, totalPages, maxVisiblePages)
    }, [currentPage, totalPages, maxVisiblePages])

    const displayRange = useMemo(() => {
        return calculateDisplayRange(currentPage, itemsPerPage, totalItems)
    }, [currentPage, itemsPerPage, totalItems])

    const handlePrevious = () => {
        setCurrentPage((prev: number) => Math.max(1, prev - 1))
    }

    const handleNext = () => {
        setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))
    }

    const handlePageClick = (page: number) => {
        setCurrentPage(page)
    }

    if (totalPages <= 1) {
        return null
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={handlePrevious}
                            className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                    </PaginationItem>

                    {paginationRange.pages.map((page, index) => {
                        const prevPage = index > 0 ? paginationRange.pages[index - 1] : null
                        const showEllipsis = prevPage && page - prevPage > 1

                        return (
                            <div key={page} className="flex items-center">
                                {showEllipsis && (
                                    <PaginationItem>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                )}
                                <PaginationItem>
                                    <PaginationLink
                                        onClick={() => handlePageClick(page)}
                                        isActive={currentPage === page}
                                        className="cursor-pointer"
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            </div>
                        )
                    })}

                    <PaginationItem>
                        <PaginationNext
                            onClick={handleNext}
                            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>

            {/* 分页信息 */}
            <div className="text-center">
                <p className="text-xs text-gray-500">
                    显示第 {displayRange.start} 至 {displayRange.end} 条，共 {totalItems} 条
                </p>
            </div>
        </div>
    )
}