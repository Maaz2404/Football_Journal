import { fetchFromApi } from "@/lib/api";
import { InsightsFilter } from "@/components/InsightsFilter";
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { formatMatchDateTimeWithTimezone, getDateKeyForDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MATCHES_PAGE_SIZE = 10;

type PaginatedMatchesResponse = {
    items: any[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
};

function buildQueryString(
    range: string,
    month: string | null,
    year: string | null,
    page: number,
    viewerTimezone?: string
): string {
    const offset = Math.max(0, (page - 1) * MATCHES_PAGE_SIZE);

    if (range === "weekly") {
        const parts: string[] = ["range=weekly", `limit=${MATCHES_PAGE_SIZE}`, `offset=${offset}`];
        if (viewerTimezone) parts.push(`viewer_tz=${encodeURIComponent(viewerTimezone)}`);
        return `?${parts.join("&")}`;
    }

    // custom range
    const parts: string[] = ["range=custom", `limit=${MATCHES_PAGE_SIZE}`, `offset=${offset}`];
    if (year) parts.push(`year=${year}`);
    if (month) parts.push(`month=${month}`);
    if (viewerTimezone) parts.push(`viewer_tz=${encodeURIComponent(viewerTimezone)}`);
    return `?${parts.join("&")}`;
}

function buildInsightsHref(range: string, month: string | null, year: string | null, page: number): string {
    const params = new URLSearchParams();
    params.set("range", range);

    if (range === "custom") {
        if (month) params.set("month", month);
        if (year) params.set("year", year);
    }

    if (page > 1) {
        params.set("page", String(page));
    }

    return `/insights?${params.toString()}`;
}

export default async function InsightsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const requestHeaders = await headers();
    const timezoneFromHeader = requestHeaders.get("x-vercel-ip-timezone") || undefined;

    const params = await searchParams;
    const range = (params.range as string) || "weekly";
    const currentDateKey = getDateKeyForDate(new Date(), timezoneFromHeader);
    const currentYear = currentDateKey.slice(0, 4);
    const month = (params.month as string) || null;
    const year = (params.year as string) || currentYear;

    const pageParam = Number(params.page as string);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

    let error: string | null = null;
    let matchesPage: PaginatedMatchesResponse = {
        items: [],
        total: 0,
        limit: MATCHES_PAGE_SIZE,
        offset: 0,
        has_more: false,
    };
    let teams: any[] = [];
    let motm: any = null;
    let totalMatches = { total: 0 };
    let mostWatchedComp: any = null;

    try {
        const qs = buildQueryString(range, month, year, page, timezoneFromHeader);
        const { getToken } = await auth();
        const token = await getToken();
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [mRes, tRes, moRes, compRes, totRes] = await Promise.all([
            fetchFromApi(`/stats/me/matches${qs}`, { headers: authHeaders, skipAuth: true, cache: "no-store" }).catch(() => ({
                items: [],
                total: 0,
                limit: MATCHES_PAGE_SIZE,
                offset: 0,
                has_more: false,
            })),
            fetchFromApi(`/stats/me/teams${qs}`, { headers: authHeaders, skipAuth: true, cache: "no-store" }).catch(() => []),
            fetchFromApi(`/stats/me/motm-player${qs}`, { headers: authHeaders, skipAuth: true, cache: "no-store" }).catch(() => null),
            fetchFromApi(`/stats/me/most-watched-competition${qs}`, { headers: authHeaders, skipAuth: true, cache: "no-store" }).catch(() => null),
            fetchFromApi(`/stats/me/total-matches${qs}`, { headers: authHeaders, skipAuth: true, cache: "no-store" }).catch(() => ({ total: 0 })),
        ]);

        if (Array.isArray(mRes)) {
            // Backward compatibility with older API shape.
            matchesPage = {
                items: mRes,
                total: mRes.length,
                limit: MATCHES_PAGE_SIZE,
                offset: Math.max(0, (page - 1) * MATCHES_PAGE_SIZE),
                has_more: mRes.length === MATCHES_PAGE_SIZE,
            };
        } else if (mRes && typeof mRes === "object" && "items" in mRes) {
            matchesPage = {
                items: Array.isArray((mRes as PaginatedMatchesResponse).items) ? (mRes as PaginatedMatchesResponse).items : [],
                total: Number((mRes as PaginatedMatchesResponse).total) || 0,
                limit: Number((mRes as PaginatedMatchesResponse).limit) || MATCHES_PAGE_SIZE,
                offset: Number((mRes as PaginatedMatchesResponse).offset) || 0,
                has_more: Boolean((mRes as PaginatedMatchesResponse).has_more),
            };
        }
        teams = Array.isArray(tRes) ? tRes : [];
        motm = moRes;
        mostWatchedComp = compRes;
        totalMatches = (totRes && typeof totRes === "object" && "total" in totRes) ? totRes : { total: 0 };
    } catch (_err) {
        console.error("Critical error in insights:", _err);
        error = "Failed to load insights. Make sure you are logged in and the backend is running.";
    }

    const hasPrevPage = page > 1;
    const hasNextPage = matchesPage.has_more;
    const currentPageStart = matchesPage.total === 0 ? 0 : matchesPage.offset + 1;
    const currentPageEnd = matchesPage.offset + matchesPage.items.length;

    return (
        <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8 pb-16 px-4">
            <div className="flex flex-col items-center justify-center text-center mb-12 gap-6">
                <div>
                    <h1 className="text-5xl md:text-6xl font-black text-foreground mb-4 tracking-tighter drop-shadow-[0_0_25px_rgba(0,250,154,0.4)]">
                        Personal <span className="text-button-neon">Insights</span>
                    </h1>
                    <p className="text-foreground/50 text-lg font-medium">Review your football journey and trends.</p>
                </div>

                <Suspense fallback={<div className="h-14 w-full max-w-xl bg-card/20 rounded-full animate-pulse" />}>
                    <InsightsFilter range={range} month={month} year={year} />
                </Suspense>
            </div>

            {error ? (
                <div className="text-center p-10 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 backdrop-blur-sm">
                    {error}
                </div>
            ) : (
                <div className="space-y-16">
                    {/* Top Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Matches Watched */}
                        <div className="bg-[var(--color-card-glow)] border border-button-neon/20 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_rgba(0,202,81,0.05)] hover:border-button-neon/40 transition-all flex flex-col justify-between group min-h-[220px]">
                            <h3 className="text-xs font-bold text-foreground/60 dark:text-foreground/40 uppercase tracking-widest">Matches Watched</h3>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-7xl font-black text-button-neon drop-shadow-[0_0_15px_rgba(0,202,81,0.4)]">
                                    {totalMatches.total}
                                </span>
                                <div className="text-button-neon/20 group-hover:text-button-neon/40 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_10px_rgba(0,202,81,0.1)]">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 2v20" /><path d="M2 12h20" /><path d="m15.5 15.5-7-7" /><path d="m15.5 8.5-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Top MOTM */}
                        <div className="bg-[var(--color-card-glow)] border border-button-neon/20 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_rgba(0,202,81,0.05)] hover:border-button-neon/40 transition-all flex flex-col min-h-[220px]">
                            <h3 className="text-xs font-bold text-foreground/60 dark:text-foreground/40 uppercase tracking-widest mb-4">Top MOTM</h3>
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                {motm ? (
                                    <>
                                        <h4 className="text-xl font-black text-foreground truncate w-full mb-1">{motm.player_name || `Player ${motm.player_id}`}</h4>
                                        <span className="text-button-neon font-black text-lg uppercase tracking-tight drop-shadow-[0_0_8px_rgba(0,202,81,0.3)]">{motm.count} Awards</span>
                                    </>
                                ) : (
                                    <p className="text-foreground/20 text-sm font-bold">NO DATA</p>
                                )}
                            </div>
                        </div>

                        {/* Teams Watched */}
                        <div className="bg-[var(--color-card-glow)] border border-button-neon/20 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_rgba(0,202,81,0.05)] hover:border-button-neon/40 transition-all flex flex-col min-h-[220px]">
                            <h3 className="text-xs font-bold text-foreground/60 dark:text-foreground/40 uppercase tracking-widest mb-4">Teams Watched</h3>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                                {teams.length === 0 ? (
                                    <div className="h-full flex items-center justify-center">
                                        <p className="text-foreground/20 text-sm font-bold">NO DATA</p>
                                    </div>
                                ) : (
                                    teams.slice(0, 3).map((t: any) => (
                                        <div key={t.team_id} className="flex flex-col gap-1 border-b border-white/5 pb-3 last:border-0 group/item">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0">
                                                    {t.crest_url ? (
                                                        <img src={t.crest_url} alt="" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <div className="w-full h-full bg-brand/40 flex items-center justify-center text-[10px] font-bold text-foreground/60">{t.team_name?.substring(0, 1)}</div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-base text-foreground truncate group-hover/item:text-button-neon transition-colors">{t.team_name}</span>
                                            </div>
                                            <span className="text-[10px] text-foreground/30 font-black pl-10 uppercase tracking-widest">{t.count} MATCHES</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Top Competition */}
                        <div className="bg-[var(--color-card-glow)] border border-button-neon/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,202,81,0.05)] hover:border-button-neon/40 transition-all flex flex-col min-h-[220px]">
                            <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-4">Top Competition</h3>
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                {mostWatchedComp ? (
                                    <>
                                        <div className="text-button-neon/30 mb-4 drop-shadow-[0_0_15px_rgba(0,202,81,0.2)]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                                <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-xl font-bold text-foreground truncate w-full">{mostWatchedComp.competition_name}</h4>
                                        <span className="text-button-neon font-bold text-sm mt-1 uppercase tracking-tight">{mostWatchedComp.count} matches</span>
                                    </>
                                ) : (
                                    <p className="text-foreground/20 text-sm font-bold">NO DATA</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Matches Column */}
                    <div>
                        <div className="flex items-center justify-between gap-4 mb-8 px-1 flex-wrap">
                            <h2 className="text-3xl font-black text-foreground tracking-tight">Recent Matches Logs</h2>
                            <div className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
                                {currentPageStart}-{currentPageEnd} of {matchesPage.total}
                            </div>
                        </div>

                        {matchesPage.items.length === 0 ? (
                            <div className="text-center p-20 bg-[var(--color-card-glow)] rounded-3xl border border-white/5 shadow-inner">
                                <p className="text-foreground/30 font-bold text-lg">No logs found for this period.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {matchesPage.items.map((m: any) => {
                                    const dateTime = formatMatchDateTimeWithTimezone(m.utc_date, timezoneFromHeader);

                                    return (
                                    <Link key={m.id} href={`/matches/${m.id}`} className="bg-[var(--color-card-glow)] border border-white/5 rounded-2xl overflow-hidden hover:border-button-neon/30 transition-all group block shadow-md hover:shadow-button-neon/5">
                                        <div className="p-5 flex items-center justify-between">
                                            <div className="flex-1 space-y-3">
                                                <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] block">
                                                    {m.competition_name || "Match"}
                                                </span>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between pr-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                                                {m.home_team_crest ? (
                                                                    <img src={m.home_team_crest} alt="" className="w-full h-full object-contain" />
                                                                ) : (
                                                                    <div className="w-full h-full rounded-full bg-foreground/10 flex items-center justify-center"><span className="text-[10px] font-bold text-foreground/40">{m.home_team_name?.substring(0, 1)}</span></div>
                                                                )}
                                                            </div>
                                                            <span className="font-bold text-foreground text-sm truncate max-w-[120px] group-hover:text-button-neon transition-colors">{m.home_team_name}</span>
                                                        </div>
                                                        <span className="font-black text-foreground text-lg">{m.home_score}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between pr-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                                                {m.away_team_crest ? (
                                                                    <img src={m.away_team_crest} alt="" className="w-full h-full object-contain" />
                                                                ) : (
                                                                    <div className="w-full h-full rounded-full bg-foreground/10 flex items-center justify-center"><span className="text-[10px] font-bold text-foreground/40">{m.away_team_name?.substring(0, 1)}</span></div>
                                                                )}
                                                            </div>
                                                            <span className="font-bold text-foreground text-sm truncate max-w-[120px] group-hover:text-button-neon transition-colors">{m.away_team_name}</span>
                                                        </div>
                                                        <span className="font-black text-foreground text-lg">{m.away_score}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center justify-center pl-6 border-l border-white/5 min-w-[120px] gap-1">
                                                <div className="text-button-neon font-black text-2xl drop-shadow-[0_0_10px_rgba(0,202,81,0.5)]">
                                                    FT
                                                </div>
                                                <div className="text-[10px] font-bold text-foreground/40 text-center uppercase tracking-tighter">
                                                    {dateTime.date} • {dateTime.time}
                                                </div>
                                            </div>

                                            <div className="pl-4 text-foreground/20 group-hover:text-button-neon transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                            </div>
                                        </div>
                                    </Link>
                                    );
                                })}
                                </div>

                                <div className="flex items-center justify-end gap-3 mt-8">
                                    {hasPrevPage ? (
                                        <Link
                                            href={buildInsightsHref(range, month, year, page - 1)}
                                            className="px-4 py-2 rounded-xl border border-white/10 text-foreground/80 font-semibold text-sm hover:border-button-neon/40 hover:text-button-neon transition-colors"
                                        >
                                            Previous
                                        </Link>
                                    ) : (
                                        <span className="px-4 py-2 rounded-xl border border-white/5 text-foreground/30 font-semibold text-sm cursor-not-allowed">
                                            Previous
                                        </span>
                                    )}

                                    {hasNextPage ? (
                                        <Link
                                            href={buildInsightsHref(range, month, year, page + 1)}
                                            className="px-4 py-2 rounded-xl border border-button-neon/40 text-button-neon font-semibold text-sm hover:bg-button-neon/10 transition-colors"
                                        >
                                            Next
                                        </Link>
                                    ) : (
                                        <span className="px-4 py-2 rounded-xl border border-white/5 text-foreground/30 font-semibold text-sm cursor-not-allowed">
                                            Next
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
