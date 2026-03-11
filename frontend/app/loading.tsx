export default function Loading() {
    return (
        <div className="w-full max-w-5xl mx-auto py-8 animate-pulse">
            <div className="h-12 w-full max-w-xl mx-auto rounded-xl bg-card border border-border mb-6" />
            <div className="max-w-xl mx-auto space-y-4">
                <div className="h-28 rounded-xl bg-card border border-border" />
                <div className="h-28 rounded-xl bg-card border border-border" />
                <div className="h-28 rounded-xl bg-card border border-border" />
            </div>
        </div>
    );
}
