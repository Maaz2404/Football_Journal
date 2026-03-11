export default function InsightsLoading() {
    return (
        <div className="max-w-6xl mx-auto w-full pt-8 pb-16 px-4 animate-pulse">
            <div className="mb-12 flex flex-col items-center gap-6">
                <div className="h-10 w-72 rounded-xl bg-card border border-border" />
                <div className="h-12 w-full max-w-2xl rounded-full bg-card border border-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="h-52 rounded-2xl bg-card border border-border" />
                <div className="h-52 rounded-2xl bg-card border border-border" />
                <div className="h-52 rounded-2xl bg-card border border-border" />
                <div className="h-52 rounded-2xl bg-card border border-border" />
            </div>

            <div className="space-y-4">
                <div className="h-6 w-56 rounded-md bg-card border border-border" />
                <div className="h-28 rounded-2xl bg-card border border-border" />
                <div className="h-28 rounded-2xl bg-card border border-border" />
            </div>
        </div>
    );
}
