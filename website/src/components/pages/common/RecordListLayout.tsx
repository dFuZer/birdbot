type RecordsListLayoutProps = {
    Selectors: React.ReactNode;
    Rows: React.ReactNode;
    Cards: React.ReactNode;
};

export default function RecordsListLayout({ Cards, Rows, Selectors }: RecordsListLayoutProps) {
    return (
        <div className="flex min-h-screen justify-center px-4 py-10">
            <div className="max-w-4xl flex-1 rounded-xl bg-white/70 p-4 pb-6 shadow-xl">
                {Selectors}
                <div className="mt-8 grid grid-cols-1 items-center gap-3 sm:grid-cols-2 md:grid-cols-3">{Cards}</div>
                <div className="mt-12 space-y-2">
                    <div className="grid w-full grid-cols-3 items-center gap-2 px-4 text-sm text-gray-600">
                        <div>Place</div>
                        <div>User</div>
                        <div>Score</div>
                    </div>
                    {Rows}
                </div>
            </div>
        </div>
    );
}
