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

    return (
        <Link href={`/matches/${match.id}`} className="block group mb-3">
            <Card className="hover:border-[#06402B] hover:shadow-md transition-all bg-card border-gray-100">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex flex-col gap-1 w-full max-w-[220px] sm:max-w-sm">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{match.competition}</span>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between font-medium sm:text-lg">
                                <span className="truncate text-gray-800">{match.homeTeam}</span>
                                <span className={cn("ml-4", isFinished ? "font-bold text-gray-900" : "text-gray-400 font-normal")}>
                                    {isFinished ? match.homeScore : "-"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between font-medium sm:text-lg">
                                <span className="truncate text-gray-800">{match.awayTeam}</span>
                                <span className={cn("ml-4", isFinished ? "font-bold text-gray-900" : "text-gray-400 font-normal")}>
                                    {isFinished ? match.awayScore : "-"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0 border-l border-gray-100 pl-4 sm:pl-6 ml-2">
                        <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
                            {isFinished ? "FT" : new Date(match.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="mt-2 text-[#2E8B57] group-hover:bg-[#2E8B57]/10 p-2 rounded-full transition-colors hidden sm:block">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
