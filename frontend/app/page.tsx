import { DateSelector } from "@/components/DateSelector";
import { MatchCard, MatchProps } from "@/components/MatchCard";
import { fetchFromApi } from "@/lib/api";
import { format, addDays, subDays } from "date-fns";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const dateParam = params.date as string | undefined;

  const currentDate = dateParam ? new Date(dateParam) : new Date();

  if (isNaN(currentDate.getTime())) {
    redirect("/");
  }

  const dateStr = format(currentDate, "yyyy-MM-dd");
  const prevDate = format(subDays(currentDate, 1), "yyyy-MM-dd");
  const nextDate = format(addDays(currentDate, 1), "yyyy-MM-dd");

  let matches: MatchProps[] = [];
  let error = null;

  try {
    const data = await fetchFromApi(`/matches?date_from=${dateStr}&date_to=${dateStr}`);

    // Map backend data to frontend props. 
    // Uses fallback formatting until backend returns team and competition names.
    matches = (data.matches || []).map((m: any) => ({
      id: m.id,
      competition: "Match",
      homeTeam: m.home_team?.name || `Team ${m.home_team_id}`,
      awayTeam: m.away_team?.name || `Team ${m.away_team_id}`,
      homeScore: m.home_score,
      awayScore: m.away_score,
      status: m.status,
      utcDate: m.utc_date
    }));

  } catch (e) {
    error = "Failed to load matches. Check if the backend is running.";
    console.error(e);
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <DateSelector
        currentDate={currentDate}
        prevLink={`/?date=${prevDate}`}
        nextLink={`/?date=${nextDate}`}
      />

      <div className="max-w-xl mx-auto w-full">
        {error ? (
          <div className="text-center p-8 bg-red-50 text-red-600 rounded-xl border border-red-100">
            {error}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-2">No matches scheduled</h3>
            <p className="text-gray-500">Try selecting a different date.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
