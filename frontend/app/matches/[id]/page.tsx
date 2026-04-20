import { fetchFromApi } from "@/lib/api";
import { MatchClient } from "./MatchClient";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MatchPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const requestHeaders = await headers();
    const timezoneFromHeader = requestHeaders.get("x-vercel-ip-timezone") || undefined;
    const { userId, getToken } = await auth();

    let currentDbUserId: number | null = null;
    if (userId) {
        try {
            const token = await getToken({ template: "fastapi" });
            if (token) {
                const me = await fetchFromApi("/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                    skipAuth: true,
                    cache: "no-store",
                });
                currentDbUserId = typeof me?.id === "number" ? me.id : null;
            }
        } catch (_e) {
            currentDbUserId = null;
        }
    }

    const { id } = await params;
    let matchData = null;
    let reviewsData = [];
    let motmLeaders = [];

    try {
        const [matchResult, reviewsResult, motmResult] = await Promise.allSettled([
            fetchFromApi(`/matches/${id}`, { skipAuth: true, next: { revalidate: 30 } }),
            fetchFromApi(`/reviews/match/${id}`, { skipAuth: true, next: { revalidate: 10 } }),
            fetchFromApi(`/stats/match/${id}/motm-leader`, { skipAuth: true, next: { revalidate: 10 } }),
        ]);

        if (matchResult.status === "fulfilled") {
            matchData = matchResult.value;
        } else {
            throw new Error("Failed to fetch match data");
        }

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
            <MatchClient
                matchData={matchData}
                initialReviews={reviewsData}
                motmLeaders={motmLeaders}
                viewerTimezone={timezoneFromHeader}
                currentUserId={currentDbUserId}
            />
        </div>
    );
}
