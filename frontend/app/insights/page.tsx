import { fetchFromApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchCard } from "@/components/MatchCard";
import { InsightsFilter } from "@/components/InsightsFilter";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function buildQueryString(range: string, month: string | null, year: string | null): string {
    if (range === "weekly") {
        return "?range=weekly";
    }
    // custom range
    const parts: string[] = ["range=custom"];
    if (year) parts.push(`year=${year}`);
    if (month) parts.push(`month=${month}`);
    return `?${parts.join("&")}`;
}

export default async function InsightsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const range = (params.range as string) || "custom";
    const month = (params.month as string) || null;
    const year = (params.year as string) || String(new Date().getFullYear());

    let matches: any[] = [];
    let teams: any[] = [];
    let motm: any = null;
    let totalMatches = { total: 0 };
    let mostWatchedComp: any = null;
    let error: string | null = null;

    try {
        const qs = buildQueryString(range, month, year);
        const [matchesRes, teamsRes, motmRes, topCompRes, totalMatchesRes] = await Promise.all([
            fetchFromApi(`/stats/me/matches${qs}`).catch((e) => { console.error(e); return []; }),
            fetchFromApi(`/stats/me/teams${qs}`).catch((e) => { console.error(e); return []; }),
            fetchFromApi(`/stats/me/motm-player${qs}`).catch((e) => { console.error(e); return null; }),
            fetchFromApi(`/stats/me/most-watched-competition${qs}`).catch((e) => { console.error(e); return null; }),
            fetchFromApi(`/stats/me/total-matches${qs}`).catch((e) => { console.error(e); return { total: 0 }; }),
        ]);

        matches = Array.isArray(matchesRes) ? matchesRes : [];
        teams = Array.isArray(teamsRes) ? teamsRes : [];
        motm = motmRes;
        mostWatchedComp = topCompRes;
        totalMatches =
            totalMatchesRes && typeof totalMatchesRes === "object" && "total" in totalMatchesRes
                ? totalMatchesRes
                : { total: 0 };
    } catch (e) {
        console.error("Critical error in insights:", e);
        error = "Failed to load insights. Make sure you are logged in and the backend is running.";
    }

    return (
        <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Personal Insights</h1>
                    <p className="text-foreground/60">Review your football journey and trends.</p>
                </div>
                <Suspense fallback={null}>
                    <InsightsFilter range={range} month={month} year={year} />
                </Suspense>
            </div>

            {error ? (
                <div className="text-center p-8 bg-red-50 text-red-600 rounded-xl border border-red-100">
                    {error}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* Top Stats Row */}
                    <Card className="shadow-sm border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-foreground/50 uppercase tracking-wider font-semibold">Matches Watched</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end">
                                <span className="text-4xl font-bold text-foreground">{totalMatches.total}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/10"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" /><path d="M12 12 5.5 8.5" /><path d="M12 12v7.5" /><path d="M12 12 18.5 8.5" /><path d="M5.5 8.5 2 12" /><path d="m18.5 8.5 3.5 3.5" /><path d="M5.5 15.5 2 12" /><path d="m18.5 15.5 3.5-3.5" /></svg>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-foreground/50 uppercase tracking-wider font-semibold">Top MOTM</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {motm ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold border border-accent/30">
                                        ★
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground border-b border-dashed border-border pb-0.5">{motm.player_name || `Player ${motm.player_id}`}</p>
                                        <p className="text-xs text-accent font-medium mt-1">{motm.count} Awards</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-foreground/40 text-sm mt-2">No MOTM selected</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-foreground/50 uppercase tracking-wider font-semibold">Teams Watched</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-24 overflow-y-auto">
                            {teams.length === 0 ? <p className="text-foreground/40 text-sm">No teams</p> : (
                                <div className="flex flex-col gap-2">
                                    {teams.slice(0, 3).map((t: any) => (
                                        <div key={t.team_id} className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-foreground">{t.team_name || `Team ${t.team_id}`}</span>
                                            <span className="text-foreground/60 bg-foreground/5 px-2 rounded-full text-xs">{t.count} matches</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-foreground/50 uppercase tracking-wider font-semibold">Top Competition</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {mostWatchedComp ? (
                                <div>
                                    <p className="font-bold text-foreground border-b border-dashed border-border pb-0.5">{mostWatchedComp.competition_name || `Competition ${mostWatchedComp.competition_id}`}</p>
                                    <p className="text-xs text-accent font-medium mt-1">{mostWatchedComp.count} matches</p>
                                </div>
                            ) : (
                                <p className="text-foreground/40 text-sm mt-2">No competition data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Matches Column */}
                    <div className="md:col-span-4 mt-4">
                        <h2 className="text-lg font-bold text-foreground mb-4 px-1">Recent Matches Logs</h2>
                        {matches.length === 0 ? (
                            <div className="text-center p-12 bg-card rounded-xl border border-border shadow-sm">
                                <p className="text-foreground/50">No logs found for this period.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {matches.map((m: any) => (
                                    <MatchCard key={m.id} match={{
                                        id: m.id,
                                        competition: m.competition_name || "Match",
                                        homeTeam: m.home_team_name || `Team ${m.home_team_id}`,
                                        awayTeam: m.away_team_name || `Team ${m.away_team_id}`,
                                        homeScore: m.home_score,
                                        awayScore: m.away_score,
                                        status: m.status,
                                        utcDate: m.utc_date
                                    }} />
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
