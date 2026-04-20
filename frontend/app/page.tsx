import { DateSelector } from "@/components/DateSelector";
import { MatchCard, MatchProps } from "@/components/MatchCard";
import { fetchFromApi } from "@/lib/api";
import { addDaysToDateKey, getDateKeyForDate, getDateKeyForUtcDate, isValidDateKey } from "@/lib/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type ApiMatch = {
  id: number;
  competition_name?: string;
  home_team_id: number;
  home_team_name?: string;
  home_team_crest?: string;
  away_team_id: number;
  away_team_name?: string;
  away_team_crest?: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  utc_date: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const requestHeaders = await headers();
  const timezoneFromHeader = requestHeaders.get("x-vercel-ip-timezone") || undefined;

  const params = await searchParams;
  const dateParam = params.date as string | undefined;

  const currentDateKey = dateParam || getDateKeyForDate(new Date(), timezoneFromHeader);

  if (!isValidDateKey(currentDateKey)) {
    redirect("/");
  }

  const dateFrom = addDaysToDateKey(currentDateKey, -1);
  const dateTo = addDaysToDateKey(currentDateKey, 1);
  const prevDate = addDaysToDateKey(currentDateKey, -1);
  const nextDate = addDaysToDateKey(currentDateKey, 1);

  let matches: MatchProps[] = [];
  let error = null;

  try {
    const data = await fetchFromApi(`/matches?date_from=${dateFrom}&date_to=${dateTo}`, {
      skipAuth: true,
      next: { revalidate: 30 },
    });

    // Map backend data to frontend props. 
    // Uses fallback formatting until backend returns team and competition names.
    matches = (data.matches || []).map((m: ApiMatch) => ({
      id: m.id,
      competition: m.competition_name || "Match",
      homeTeam: m.home_team_name || `Team ${m.home_team_id}`,
      awayTeam: m.away_team_name || `Team ${m.away_team_id}`,
      homeTeamCrest: m.home_team_crest || `https://crests.football-data.org/${m.home_team_id}.svg`,
      awayTeamCrest: m.away_team_crest || `https://crests.football-data.org/${m.away_team_id}.svg`,
      homeScore: m.home_score,
      awayScore: m.away_score,
      status: m.status,
      utcDate: m.utc_date
    })).filter((m: MatchProps) => getDateKeyForUtcDate(m.utcDate, timezoneFromHeader) === currentDateKey);

  } catch (e) {
    error = "Failed to load matches. Check if the backend is running.";
    console.error(e);
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <DateSelector
        currentDateKey={currentDateKey}
        prevLink={`/?date=${prevDate}`}
        nextLink={`/?date=${nextDate}`}
        viewerTimezone={timezoneFromHeader}
      />

      <div className="max-w-xl mx-auto w-full">
        {error ? (
          <div className="text-center p-8 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
            {error}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-xl border border-border shadow-sm">
            <h3 className="text-lg font-medium text-foreground mb-2">No matches scheduled</h3>
            <p className="text-foreground/60">Try selecting a different date.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(
              matches
                .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
                .reduce((acc, match) => {
                  const comp = match.competition || "Other";
                  if (!acc[comp]) acc[comp] = [];
                  acc[comp].push(match);
                  return acc;
                }, {} as Record<string, MatchProps[]>)
            ).map(([competition, compMatches]) => (
              <details key={competition} open className="group">
                <summary className="flex items-center gap-2 cursor-pointer font-bold text-foreground/80 mb-3 select-none outline-none">
                  {/* Small triangular SVG that rotates when open */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-open:rotate-90 text-foreground/50">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  {competition}
                </summary>
                <div className="flex flex-col ml-6 pl-4">
                  {compMatches.map((m) => (
                    <MatchCard key={m.id} match={m} viewerTimezone={timezoneFromHeader} />
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
