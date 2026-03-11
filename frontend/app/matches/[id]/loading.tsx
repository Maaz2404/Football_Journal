export default function MatchLoading() {
    return (
        <div className="max-w-5xl mx-auto py-8 animate-pulse">
            <div className="h-40 rounded-2xl bg-card border border-border mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 h-[480px] rounded-2xl bg-card border border-border" />
                <div className="lg:col-span-7 space-y-4">
                    <div className="h-12 rounded-xl bg-card border border-border" />
                    <div className="h-40 rounded-xl bg-card border border-border" />
                    <div className="h-40 rounded-xl bg-card border border-border" />
                </div>
            </div>
        </div>
    );
}
