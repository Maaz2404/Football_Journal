import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

export interface MatchProps {
    id: string | number;
    competition: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    status: "SCHEDULED" | "FINISHED" | string;
    utcDate: string;
}

export function MatchCard({ match }: { match: MatchProps }) {
    const isFinished = match.status === "FINISHED";

    const content = (
        <Card className={cn("transition-all bg-card border-border",
            isFinished ? "hover:border-accent hover:shadow-md cursor-pointer" : "opacity-80 grayscale-[0.2]")}>
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div className="flex flex-col gap-1 w-full max-w-[220px] sm:max-w-sm">
                    <span className="text-xs text-foreground/50 font-semibold uppercase tracking-wider mb-1">{match.competition}</span>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between font-medium sm:text-lg">
                            <span className="truncate text-foreground/90">{match.homeTeam}</span>
                            <span className={cn("ml-4", isFinished ? "font-bold text-foreground" : "text-foreground/40 font-normal")}>
                                {isFinished ? (match.homeScore ?? 0) : "-"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between font-medium sm:text-lg">
                            <span className="truncate text-foreground/90">{match.awayTeam}</span>
                            <span className={cn("ml-4", isFinished ? "font-bold text-foreground" : "text-foreground/40 font-normal")}>
                                {isFinished ? (match.awayScore ?? 0) : "-"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0 border-l border-border pl-4 sm:pl-6 ml-2 min-w-[60px]">
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded",
                        isFinished ? "text-foreground/40" : "bg-accent/20 text-accent font-semibold")}>
                        {isFinished ? "FT" : match.status === "SCHEDULED" ? "SOON" : match.status}
                    </span>
                    <span className="text-xs text-foreground/50 whitespace-nowrap text-right flex flex-col items-end">
                        <span>{new Date(match.utcDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <span>{new Date(match.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    {isFinished && (
                        <div className="mt-1 text-accent p-1 rounded-full transition-colors hidden sm:block">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    if (!isFinished) {
        return <div className="block mb-3">{content}</div>;
    }

    return (
        <Link href={`/matches/${match.id}`} className="block group mb-3">
            {content}
        </Link>
    );
}
