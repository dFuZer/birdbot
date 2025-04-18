import { JSX } from "react";

type RecordsListLayoutProps = {
    Selectors: React.ReactNode;
    Rows: JSX.Element[];
    Cards: JSX.Element[];
};

export const gridColsTailwindClass = "grid-cols-[5rem_minmax(0,2fr)_minmax(0,1fr)]";

export default function RecordsListLayout({ Cards, Rows, Selectors }: RecordsListLayoutProps) {
    return (
        <div className="flex min-h-screen justify-center px-4 py-6 sm:py-10">
            <div className="flex-1 pb-6 sm:max-w-4xl sm:rounded-xl sm:bg-white/70 sm:p-4 sm:shadow-xl">
                {Selectors}
                {Cards.length > 0 ? (
                    <div className="mt-8 grid grid-cols-1 items-center gap-3 sm:grid-cols-2 md:grid-cols-3">{Cards}</div>
                ) : (
                    <div className="mt-8 text-center text-gray-600">No records available</div>
                )}
                {Rows.length > 0 && (
                    <div className="mt-12 space-y-2">
                        <div className={`grid w-full items-center gap-2 px-4 text-sm text-gray-600 ${gridColsTailwindClass}`}>
                            <div>Place</div>
                            <div>User</div>
                            <div>Score</div>
                        </div>
                        {Rows}
                    </div>
                )}
            </div>
        </div>
    );
}
