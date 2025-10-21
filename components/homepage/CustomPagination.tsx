import { PriceAnnouncement } from "@/app/workspace/types"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis
} from "@/components/ui/pagination"

interface CustomPaginationProps {
    currentPage: number
    setCurrentPage: (pageOrFn: number | ((prev: number) => number)) => void
    filteredProducts: PriceAnnouncement[]
    itemsPerPage: number
}

export function CustomPagination({
    setCurrentPage,
    filteredProducts,
    itemsPerPage,
    currentPage
}: CustomPaginationProps) {
    return (
        <>
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>

                    {(() => {
                        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
                        const maxVisiblePages = 5;
                        const pages = [];

                        if (totalPages <= maxVisiblePages) {
                            // 显示所有页码
                            for (let i = 1; i <= totalPages; i++) {
                                pages.push(
                                    <PaginationItem key={i}>
                                        <PaginationLink
                                            onClick={() => setCurrentPage(i)}
                                            isActive={currentPage === i}
                                        >
                                            {i}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            }
                        } else {
                            // 显示部分页码
                            // 始终显示第一页
                            pages.push(
                                <PaginationItem key={1}>
                                    <PaginationLink
                                        onClick={() => setCurrentPage(1)}
                                        isActive={currentPage === 1}
                                    >
                                        1
                                    </PaginationLink>
                                </PaginationItem>
                            );

                            // 如果当前页靠近开始
                            if (currentPage <= 3) {
                                for (let i = 2; i <= 4; i++) {
                                    pages.push(
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                onClick={() => setCurrentPage(i)}
                                                isActive={currentPage === i}
                                            >
                                                {i}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                }
                                pages.push(
                                    <PaginationItem key="ellipsis1">
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                );
                            }
                            // 如果当前页靠近结束
                            else if (currentPage >= totalPages - 2) {
                                pages.push(
                                    <PaginationItem key="ellipsis2">
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                );
                                for (let i = totalPages - 3; i < totalPages; i++) {
                                    pages.push(
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                onClick={() => setCurrentPage(i)}
                                                isActive={currentPage === i}
                                            >
                                                {i}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                }
                            }
                            // 如果当前页在中间
                            else {
                                pages.push(
                                    <PaginationItem key="ellipsis3">
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                );
                                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                                    pages.push(
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                onClick={() => setCurrentPage(i)}
                                                isActive={currentPage === i}
                                            >
                                                {i}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                }
                                pages.push(
                                    <PaginationItem key="ellipsis4">
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                );
                            }

                            // 始终显示最后一页
                            pages.push(
                                <PaginationItem key={totalPages}>
                                    <PaginationLink
                                        onClick={() => setCurrentPage(totalPages)}
                                        isActive={currentPage === totalPages}
                                    >
                                        {totalPages}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        }

                        return pages;
                    })()}

                    <PaginationItem>
                        <PaginationNext
                            onClick={() => setCurrentPage((prev: number) => {
                                const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
                                return Math.min(totalPages, prev + 1);
                            })}
                            className={currentPage >= Math.ceil(filteredProducts.length / itemsPerPage) ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
            {/* 分页信息 */}
            <div className="mt-2 text-center">
                <p className="text-xs text-gray-500">
                    显示第 {(currentPage - 1) * itemsPerPage + 1} 至 {Math.min(currentPage * itemsPerPage, filteredProducts.length)} 条，共 {filteredProducts.length} 条
                </p>
            </div>
        </>

    )
}