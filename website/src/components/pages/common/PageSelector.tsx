"use client";

import {
    Pagination,
    PaginationButton,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import useChangeSearchParam from "@/lib/hooks/useChangeSearchParam";
import { useSearchParams } from "next/navigation";

export default function PageSelector({ maxPage }: { maxPage: number }) {
    const changeSearchParam = useChangeSearchParam({ scroll: false });
    const searchParams = useSearchParams();
    const pageParam = searchParams.get("page");
    const currentPage = pageParam ? parseInt(pageParam) : 1;
    const shownPages = [currentPage - 1, currentPage, currentPage + 1].filter((page) => page > 0 && page <= maxPage);
    const previousButtonDisabled = currentPage <= 1;
    const nextButtonDisabled = currentPage >= maxPage;
    return (
        <Pagination className="mt-8">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        onClick={() => changeSearchParam({ page: (currentPage - 1).toString() })}
                        disabled={previousButtonDisabled}
                    />
                </PaginationItem>
                {shownPages[0] > 1 && (
                    <>
                        <PaginationItem>
                            <PaginationButton isActive={currentPage === 1} onClick={() => changeSearchParam({ page: "1" })}>
                                1
                            </PaginationButton>
                        </PaginationItem>
                        {shownPages[0] > 2 && (
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                        )}
                    </>
                )}
                {shownPages.map((page) => (
                    <PaginationItem key={page}>
                        <PaginationButton
                            isActive={currentPage === page}
                            onClick={() => changeSearchParam({ page: page.toString() })}
                        >
                            {page}
                        </PaginationButton>
                    </PaginationItem>
                ))}
                {shownPages[shownPages.length - 1] < maxPage && (
                    <>
                        {shownPages[shownPages.length - 1] < maxPage - 1 && (
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                        )}
                        <PaginationItem>
                            <PaginationButton
                                isActive={currentPage === maxPage}
                                onClick={() => changeSearchParam({ page: maxPage.toString() })}
                            >
                                {maxPage}
                            </PaginationButton>
                        </PaginationItem>
                    </>
                )}
                <PaginationItem>
                    <PaginationNext
                        onClick={() => changeSearchParam({ page: (currentPage + 1).toString() })}
                        disabled={nextButtonDisabled}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
