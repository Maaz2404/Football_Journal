import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import { cn, formatMatchDateTimeWithTimezone } from "@/lib/utils";

export interface MatchProps {
    id: string | number;
    competition: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    status: "SCHEDULED" | "FINISHED" | string;
    utcDate: string;
    homeTeamCrest?: string;
    awayTeamCrest?: string;
}

export function MatchCard({ match, viewerTimezone }: { match: MatchProps; viewerTimezone?: string }) {
    const isFinished = match.status === "FINISHED";
    const dateTime = formatMatchDateTimeWithTimezone(match.utcDate, viewerTimezone);

    const content = (
        <Card className={cn("transition-all bg-card dark:bg-white/[0.08] border-border/50",
            isFinished ? "hover:border-accent/40 hover:shadow-md cursor-pointer" : "opacity-90")}>
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div className="flex flex-col gap-1 w-full max-w-[220px] sm:max-w-sm">
                    <span className="text-xs text-foreground/50 font-semibold uppercase tracking-wider mb-1">{match.competition}</span>
                    <div className="flex flex-col gap-3 mt-2">
                        <div className="flex items-center justify-between font-medium sm:text-lg">
                            <div className="flex items-center gap-3 truncate pr-2">
                                {match.homeTeamCrest ? (
                                    <img src={match.homeTeamCrest} alt={match.homeTeam} className="w-5 h-5 object-contain" />
                                ) : (
                                    <div className="w-5 h-5 bg-foreground/10 rounded-full" />
                                )}
                                <span className="truncate text-foreground/90">{match.homeTeam}</span>
                            </div>
                            <span className={cn("ml-4 shrink-0", isFinished ? "font-bold text-foreground" : "text-foreground/40 font-normal")}>
                                {isFinished ? (match.homeScore ?? 0) : "-"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between font-medium sm:text-lg">
                            <div className="flex items-center gap-3 truncate pr-2">
                                {match.awayTeamCrest ? (
                                    <img src={match.awayTeamCrest} alt={match.awayTeam} className="w-5 h-5 object-contain" />
                                ) : (
                                    <div className="w-5 h-5 bg-foreground/10 rounded-full" />
                                )}
                                <span className="truncate text-foreground/90">{match.awayTeam}</span>
                            </div>
                            <span className={cn("ml-4 shrink-0", isFinished ? "font-bold text-foreground" : "text-foreground/40 font-normal")}>
                                {isFinished ? (match.awayScore ?? 0) : "-"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0 border-l border-border pl-4 sm:pl-6 ml-2 min-w-[60px]">
                    {match.status !== "TIMED" && match.status !== "SCHEDULED" && (
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded",
                            isFinished ? "text-foreground/40" : "bg-accent/20 text-accent font-semibold")}>
                            {isFinished ? "FT" : match.status.replace(/_/g, " ")}
                        </span>
                    )}
                    <span className="text-xs text-foreground/50 whitespace-nowrap text-right flex flex-col items-end">
                        <span>{dateTime.date}</span>
                        <span>{dateTime.time}</span>
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
