import PageSelector from "@/components/pages/common/PageSelector";
import { JSX } from "react";

type RecordsListLayoutProps = {
    Selectors: React.ReactNode;
    Rows: JSX.Element[];
    Cards: JSX.Element[];
    maxPage: number;
};

export const gridColsTailwindClass = "grid-cols-[5rem_minmax(0,2fr)_minmax(0,1fr)]";

export default function RecordsListLayout({ Cards, Rows, Selectors, maxPage }: RecordsListLayoutProps) {
    return (
        <div className="flex min-h-screen justify-center px-4 py-6 sm:py-10">
            <div className="flex flex-1 flex-col pb-6 sm:max-w-4xl sm:rounded-xl sm:bg-white/70 sm:p-4 sm:shadow-xl">
                {Selectors}
                {Cards.length === 0 && Rows.length === 0 && (
                    <div className="mt-8 flex flex-1 items-center justify-center text-center text-gray-600">
                        <p>No records available</p>
                    </div>
                )}
                {Cards.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 items-center gap-3 sm:grid-cols-2 md:grid-cols-3">{Cards}</div>
                )}
                {Rows.length > 0 && (
                    <div className="mt-12 flex-1 space-y-2">
                        <div className={`grid w-full items-center gap-2 px-4 text-sm text-gray-600 ${gridColsTailwindClass}`}>
                            <div>Place</div>
                            <div>User</div>
                            <div>Score</div>
                        </div>
                        {Rows}
                    </div>
                )}
                <PageSelector maxPage={maxPage} />
            </div>
        </div>
    );
}
