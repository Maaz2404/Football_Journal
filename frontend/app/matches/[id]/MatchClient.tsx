"use client";

import { useState } from "react";
import { FocusLevelSelector } from "@/components/FocusLevelSelector";
import { ReviewCard } from "@/components/ReviewCard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export function MatchClient({ matchData, initialReviews }: { matchData: any, initialReviews: any[] }) {
    const [focus, setFocus] = useState<"red" | "yellow" | "green">("green");
    const [notes, setNotes] = useState("");
    const [motm, setMotm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { match, home_team, away_team, home_squad_players, away_squad_players } = matchData;
    const isFinished = match.status === "FINISHED";
    const { getToken, isSignedIn } = useAuth();
    const router = useRouter();

    const allPlayers = [...(home_squad_players || []), ...(away_squad_players || [])];

    const onSubmit = async () => {
        if (!isSignedIn) {
            alert("Please log in to submit a review.");
            return;
        }
        try {
            setIsSubmitting(true);
            const token = await getToken();

            const payload: any = {
                match_id: match.id,
                focus_level: focus,
                notes: notes,
            };

            if (motm) {
                payload.motm_player_id = parseInt(motm, 10);
            }

            const res = await fetch(`http://127.0.0.1:8000/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                alert(errorData.detail || "Failed to submit review");
            } else {
                setNotes("");
                setMotm("");
                router.refresh(); // Refresh server state to get new review
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center sm:text-left bg-card p-6 sm:p-8 rounded-2xl shadow-sm border border-border">
                <span className="text-sm text-foreground/50 font-semibold tracking-wider mb-2 block uppercase">
                    Match Details • {new Date(match.utc_date).toLocaleDateString()}
                </span>
                <h1 className="text-2xl sm:text-4xl font-bold text-foreground flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2">
                    <span>{home_team.name}</span>
                    <span className="text-foreground/30 font-light text-xl sm:text-3xl">
                        {isFinished ? (
                            <span className="text-foreground font-bold bg-foreground/5 px-4 py-1 rounded-xl border border-border">
                                {match.home_score} - {match.away_score}
                            </span>
                        ) : 'vs'}
                    </span>
                    <span>{away_team.name}</span>
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (Review Form) */}
                <div className="lg:col-span-5">
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-7 sticky top-24">
                        <h2 className="text-xl font-bold text-accent mb-6 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                            Write Your Review
                        </h2>

                        <div className="mb-7">
                            <label className="block text-sm font-semibold text-foreground/80 mb-3">Focus Level</label>
                            <FocusLevelSelector value={focus} onChange={setFocus} />
                            <p className="text-xs text-foreground/50 mt-2.5">How intently did you watch this match?</p>
                        </div>

                        <div className="mb-7">
                            <label className="block text-sm font-semibold text-foreground/80 mb-3">Match Notes & Analysis</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Tactical observations, key moments, player performances..."
                                className="w-full min-h-[140px] p-4 border rounded-xl text-sm bg-foreground/5 focus:bg-card focus:ring-2 focus:ring-accent focus:outline-none transition-all border-border resize-y text-foreground"
                            />
                        </div>

                        <div className="mb-7">
                            <label className="block text-sm font-semibold text-foreground/80 mb-3">Man of the Match <span className="text-foreground/40 font-normal ml-1">(Optional)</span></label>
                            <select
                                value={motm}
                                onChange={(e) => setMotm(e.target.value)}
                                className="w-full p-3.5 border rounded-xl text-sm bg-foreground/5 focus:bg-card focus:ring-2 focus:ring-accent focus:border-accent focus:outline-none transition-all border-border text-foreground"
                            >
                                <option value="" className="bg-card">Search or select player...</option>
                                <optgroup label={home_team.name} className="bg-card">
                                    {home_squad_players?.map((p: any) => (
                                        <option key={p.id} value={p.id} className="bg-card">{p.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label={away_team.name} className="bg-card">
                                    {away_squad_players?.map((p: any) => (
                                        <option key={p.id} value={p.id} className="bg-card">{p.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <Button
                            className="w-full h-12 text-[15px] font-semibold rounded-xl bg-brand text-white hover:bg-brand/90 shadow-md transition-all flex items-center gap-2"
                            onClick={onSubmit}
                            disabled={isSubmitting || !isSignedIn || !isFinished}
                        >
                            {isSubmitting ? "Posting..." : !isFinished ? "Match not finished" : !isSignedIn ? "Login to Post Review" : "Post Review"}
                        </Button>
                    </div>
                </div>

                {/* Right Column (Community Reviews) */}
                <div className="lg:col-span-7">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h2 className="text-xl font-bold text-foreground">Community Reviews</h2>
                        <div className="bg-card border border-border text-sm text-foreground/70 rounded-lg px-3 py-2 font-medium shadow-sm hover:bg-foreground/5 cursor-pointer transition-colors">
                            Most Recent
                        </div>
                    </div>

                    <div className="flex flex-col">
                        {initialReviews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-16 bg-card rounded-2xl border border-border shadow-sm">
                                <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/30"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-1">No reviews yet</h3>
                                <p className="text-foreground/50 text-center max-w-[250px]">Be the first to share your thoughts and tactical analysis on this match!</p>
                            </div>
                        ) : (
                            initialReviews.map((r: any) => {
                                const motmPlayer = r.motm_player_id ? allPlayers.find((p: any) => p.id === r.motm_player_id) : null;
                                return (
                                    <ReviewCard
                                        key={r.id}
                                        review={{
                                            id: r.id,
                                            username: `User ${r.user_id}`,
                                            focusLevel: r.focus_level,
                                            notes: r.notes,
                                            motm: motmPlayer ? motmPlayer.name : undefined,
                                            likes: 0,
                                            timeAgo: new Date(r.created_at).toLocaleDateString()
                                        }}
                                    />
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
