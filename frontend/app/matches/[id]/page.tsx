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
        const [reviewsResult, motmResult] = await Promise.allSettled([
            fetchFromApi(`/reviews/match/${id}`),
            fetchFromApi(`/stats/match/${id}/motm-leader`),
        ]);

        reviewsData = reviewsResult.status === "fulfilled" ? reviewsResult.value : [];
        motmLeaders = motmResult.status === "fulfilled" && Array.isArray(motmResult.value) ? motmResult.value : [];
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
