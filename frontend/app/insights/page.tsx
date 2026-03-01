import { fetchFromApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchCard } from "@/components/MatchCard";

export const dynamic = "force-dynamic";

export default async function InsightsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const range = (params.range as string) || "monthly";
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let matches = [];
    let teams = [];
    let motm = null;
    let totalMatches = { total: 0 };
    let error = null;

    try {
        const qs = `?range=${range}&month=${month}&year=${year}`;
        matches = await fetchFromApi(`/stats/me/matches${qs}`);
        teams = await fetchFromApi(`/stats/me/teams${qs}`);
        try {
            motm = await fetchFromApi(`/stats/me/motm-player${qs}`);
        } catch { motm = null; }
        totalMatches = await fetchFromApi(`/stats/me/total-matches${qs}`);
    } catch (e) {
        console.error(e);
        error = "Failed to load insights. Make sure you are logged in and the backend is running.";
    }

    return (
        <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Insights</h1>
                    <p className="text-gray-500">Review your football journey and trends.</p>
                </div>
                <div className="flex bg-white rounded-lg p-1 border shadow-sm self-start sm:self-auto">
                    {["weekly", "monthly", "yearly"].map((r) => (
                        <a
                            key={r}
                            href={`/insights?range=${r}`}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${range === r ? "bg-[#2E8B57] text-white shadow" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
                        >
                            {r === 'yearly' ? 'Season' : r}
                        </a>
                    ))}
                </div>
            </div>

            {error ? (
                <div className="text-center p-8 bg-red-50 text-red-600 rounded-xl border border-red-100">
                    {error}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Top Stats Row */}
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Matches Watched</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end">
                                <span className="text-4xl font-bold text-gray-900">{totalMatches.total}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" /><path d="M12 12 5.5 8.5" /><path d="M12 12v7.5" /><path d="M12 12 18.5 8.5" /><path d="M5.5 8.5 2 12" /><path d="m18.5 8.5 3.5 3.5" /><path d="M5.5 15.5 2 12" /><path d="m18.5 15.5 3.5-3.5" /></svg>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Top MOTM</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {motm ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold border border-yellow-200">
                                        ★
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 border-b border-dashed pb-0.5">Player {motm.player_id}</p>
                                        <p className="text-xs text-[#2E8B57] font-medium mt-1">{motm.count} Awards</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm mt-2">No MOTM selected</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Teams Watched</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-24 overflow-y-auto">
                            {teams.length === 0 ? <p className="text-gray-400 text-sm">No teams</p> : (
                                <div className="flex flex-col gap-2">
                                    {teams.slice(0, 3).map((t: any) => (
                                        <div key={t.team_id} className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-gray-800">Team {t.team_id}</span>
                                            <span className="text-gray-500 bg-gray-50 px-2 rounded-full text-xs">{t.count} matches</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Matches Column */}
                    <div className="md:col-span-3 mt-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Recent Matches Logs</h2>
                        {matches.length === 0 ? (
                            <div className="text-center p-12 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <p className="text-gray-500">No logs found for this period.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {matches.map((m: any) => (
                                    <MatchCard key={m.id} match={{
                                        id: m.id,
                                        competition: "Match",
                                        homeTeam: m.home_team_id ? `Team ${m.home_team_id}` : "Home",
                                        awayTeam: m.away_team_id ? `Team ${m.away_team_id}` : "Away",
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
