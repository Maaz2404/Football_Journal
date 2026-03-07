import { fetchFromApi } from "@/lib/api";
import { MatchClient } from "./MatchClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MatchPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    let matchData = null;
    let reviewsData = [];
    let motmLeaders = [];

    try {
        matchData = await fetchFromApi(`/matches/${id}`);
        try {
            reviewsData = await fetchFromApi(`/reviews/match/${id}`);
        } catch (e) {
            reviewsData = [];
        }
        try {
            motmLeaders = await fetchFromApi(`/stats/match/${id}/motm-leader`);
            // Ensure motmLeaders behaves robustly if empty or wrapped incorrectly
            if (!Array.isArray(motmLeaders)) {
                motmLeaders = [];
            }
        } catch (e) {
            motmLeaders = [];
        }
    } catch (e) {
        console.error(e);
        notFound();
    }

    if (!matchData?.match) {
        notFound();
    }

    return (
        <div className="w-full animate-in fade-in duration-500">
            <MatchClient matchData={matchData} initialReviews={reviewsData} motmLeaders={motmLeaders} />
        </div>
    );
}
