type RecordsPageProps = {
    language: string;
    mode: string;
    record: string;
};

export default function RecordsPage({ language, mode, record }: RecordsPageProps) {
    return (
        <>
            RecordsPage {language} {mode} {record}
        </>
    );
}
