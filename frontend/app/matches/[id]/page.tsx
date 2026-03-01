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

    try {
        matchData = await fetchFromApi(`/matches/${id}`);
        try {
            reviewsData = await fetchFromApi(`/reviews/match/${id}`);
        } catch (e) {
            // It's possible reviews endpoint might fail if empty, or we ignore
            reviewsData = [];
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
            <MatchClient matchData={matchData} initialReviews={reviewsData} />
        </div>
    );
}
