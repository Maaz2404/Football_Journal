"use client";

import { useMemo, useEffect, useState } from "react";
import { FocusLevelSelector } from "@/components/FocusLevelSelector";
import { ReviewCard } from "@/components/ReviewCard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { cn, formatMatchDateTimeWithTimezone } from "@/lib/utils";
import { MotmSelector } from "@/components/MotmSelector";
import Image from "next/image";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");



export function MatchClient({
    matchData,
    initialReviews,
    motmLeaders = [],
    viewerTimezone,
    currentUserId,
}: {
    matchData: any,
    initialReviews: any[],
    motmLeaders?: any[],
    viewerTimezone?: string,
    currentUserId?: string | number | null,
}) {
    const [focus, setFocus] = useState<"red" | "yellow" | "green">("green");
    const [notes, setNotes] = useState("");
    const [motm, setMotm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showAllMotm, setShowAllMotm] = useState(false);

    const { match, home_team, away_team, home_squad_players, away_squad_players } = matchData;
    const isFinished = match.status === "FINISHED";
    const kickoffDateTime = formatMatchDateTimeWithTimezone(match.utc_date, viewerTimezone);
    const { getToken, isSignedIn } = useAuth();
    const router = useRouter();

    const allPlayers = useMemo(() => [...(home_squad_players || []), ...(away_squad_players || [])], [home_squad_players, away_squad_players]);
    const playersById = useMemo(() => new Map(allPlayers.map((player: any) => [player.id, player])), [allPlayers]);
    const userReview = useMemo(
        () => (currentUserId ? initialReviews.find((review) => String(review.user_id) === String(currentUserId)) : null),
        [currentUserId, initialReviews]
    );
    const allReviewsList = useMemo(
        () => initialReviews.filter((review) => review.notes == null || String(review.notes).trim() !== ""),
        [initialReviews]
    );
    const reviewCards = useMemo(
        () => allReviewsList.map((r: any) => {
            const motmPlayer = r.motm_player_id ? playersById.get(r.motm_player_id) : null;
            const isCurrentUser = currentUserId && String(r.user_id) === String(currentUserId);
            const reviewDate = formatMatchDateTimeWithTimezone(r.created_at, viewerTimezone);

            return (
                <ReviewCard
                    key={r.id}
                    review={{
                        id: r.id,
                        username: isCurrentUser ? "You" : (r.username || "Anonymous"),
                        focusLevel: r.focus_level,
                        notes: r.notes,
                        motm: motmPlayer ? motmPlayer.name : undefined,
                        likes: 0,
                        timeAgo: reviewDate.date,
                    }}
                />
            );
        }),
        [allReviewsList, currentUserId, playersById, viewerTimezone]
    );

    useEffect(() => {
        if (focus === 'red') setMotm("");
    }, [focus]);

    const onSubmit = async () => {
        if (!isSignedIn) {
            alert("Please log in to submit a review.");
            return;
        }
        if (!API_URL) {
            alert("App configuration error: NEXT_PUBLIC_API_URL is not set.");
            return;
        }
        try {
            setIsSubmitting(true);
            const token = await getToken({ template: 'fastapi' });

            const payload: any = {
                match_id: match.id,
                focus_level: focus,
                notes: notes,
            };

            if (focus === 'red') {
                payload.motm_player_id = null;
            } else if (motm) {
                payload.motm_player_id = parseInt(motm, 10);
            } else {
                payload.motm_player_id = null;
            }

            const url = userReview && isEditing ? `${API_URL}/reviews/${userReview.id}` : `${API_URL}/reviews`;
            const method = userReview && isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                let message = "Failed to submit review";
                try {
                    const errorData = await res.json();
                    message = errorData.detail || message;
                } catch {
                    const text = await res.text();
                    if (text) message = text;
                }
                alert(message);
            } else {
                if (!isEditing) {
                    setNotes("");
                    setMotm("");
                }
                setIsEditing(false);
                router.refresh();
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDelete = async () => {
        if (!userReview || !confirm("Are you sure you want to delete your review?")) return;
        if (!API_URL) {
            alert("App configuration error: NEXT_PUBLIC_API_URL is not set.");
            return;
        }
        try {
            setIsSubmitting(true);
            const token = await getToken({ template: 'fastapi' });
            const res = await fetch(`${API_URL}/reviews/${userReview.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) {
                let message = "Failed to delete review";
                try {
                    const errorData = await res.json();
                    message = errorData.detail || message;
                } catch {
                    const text = await res.text();
                    if (text) message = text;
                }
                alert(message);
            } else {
                router.refresh();
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
            {/* Header */}
            <div className="mb-14 flex flex-col items-center justify-center pt-8">
                {/* Community MOTM Top 3 Card (Moved above score) */}
                {motmLeaders && motmLeaders.length > 0 && (
                    <div className="mb-8 relative z-10 flex flex-col items-center">
                        <div
                            className="bg-card/40 backdrop-blur-md border border-[var(--color-border-gold)] rounded-full px-5 py-2 cursor-pointer hover:bg-foreground/5 shadow-[0_0_20px_rgba(209,161,42,0.15)] transition-all flex items-center gap-3"
                            onClick={() => setShowAllMotm(!showAllMotm)}
                        >
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-foreground/10 shrink-0 border border-border-gold/30">
                                <Image
                                    src={`https://ui-avatars.com/api/?name=${motmLeaders[0].player_name.replace(' ', '+')}&background=random`}
                                    alt=""
                                    width={28}
                                    height={28}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-sm font-semibold text-foreground/80">
                                Community MOTM: <span className="text-foreground">{motmLeaders[0].player_name}</span>
                            </span>
                            <div className="text-[var(--color-border-gold)] flex gap-1.5 items-center text-sm font-bold pl-3 border-l border-foreground/20">
                                {motmLeaders[0].count} votes
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                {motmLeaders.length > 1 && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform text-foreground/50 ml-1", showAllMotm ? "rotate-180" : "rotate-0")}><path d="m6 9 6 6 6-6" /></svg>
                                )}
                            </div>
                        </div>

                        {showAllMotm && motmLeaders.length > 1 && (
                            <div className="absolute top-full mt-3 w-64 bg-card border border-border rounded-xl p-3 flex flex-col gap-2 shadow-xl animate-in fade-in slide-in-from-top-2">
                                {motmLeaders.slice(1, 3).map((leader: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs font-bold text-foreground/50">#{idx + 2}</div>
                                            <div className="text-sm font-semibold text-foreground truncate">{leader.player_name}</div>
                                        </div>
                                        <div className="text-xs font-medium text-foreground/50">
                                            {leader.count} v
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <h1 className="text-base sm:text-3xl lg:text-5xl font-extrabold text-foreground flex flex-row items-center justify-center gap-6 sm:gap-12 md:gap-16 w-full px-3 sm:px-6">
                    <div className="flex items-center justify-end flex-1">
                        {home_team.crest_url && <img src={home_team.crest_url} alt={home_team.short_name} className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 object-contain drop-shadow-2xl" />}
                    </div>

                    <div className="flex items-center justify-center tracking-widest px-1 sm:px-2 drop-shadow-[0_0_15px_rgba(209,161,42,0.4)] shrink-0">
                        {isFinished ? (
                            <span className="text-[var(--color-border-gold)] text-2xl sm:text-6xl md:text-7xl whitespace-nowrap">
                                {match.home_score} <span className="opacity-70 text-xl sm:text-5xl">-</span> {match.away_score}
                            </span>
                        ) : (
                            <span className="text-foreground/30 font-light text-xl sm:text-3xl">vs</span>
                        )}
                    </div>

                    <div className="flex items-center justify-start flex-1">
                        {away_team.crest_url && <img src={away_team.crest_url} alt={away_team.short_name} className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 object-contain drop-shadow-2xl" />}
                    </div>
                </h1>

                <p className="mt-4 text-sm font-semibold text-foreground/60 uppercase tracking-wide">
                    Kickoff: {kickoffDateTime.date} • {kickoffDateTime.time}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (Review Form) */}
                <div className="lg:col-span-5">
                    <div className="bg-card dark:bg-[var(--color-card-glow)] rounded-2xl shadow-lg border border-border dark:border-brand/30 p-6 sm:p-7 sticky top-24 dark:shadow-[0_0_30px_rgba(6,64,43,0.15)] relative overflow-hidden">
                        {/* Subtle top inner glow for dark mode */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand/50 to-transparent opacity-0 dark:opacity-100"></div>

                        <h2 className="text-xl font-bold text-foreground mb-6">
                            {userReview && !isEditing ? "Your Review" : userReview && isEditing ? "Edit Your Review" : "Your Review"}
                        </h2>

                        {userReview && !isEditing ? (
                            <div className="flex flex-col h-full">
                                <div className="mb-5">
                                    <div className="text-xs text-foreground/50 mb-1.5 uppercase tracking-wider font-semibold">Focus Level</div>
                                    <div className={cn("inline-flex px-3 py-1.5 rounded-full text-xs font-bold border",
                                        userReview.focus_level === 'green' ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" :
                                            userReview.focus_level === 'yellow' ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" :
                                                "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                                    )}>
                                        {userReview.focus_level === 'green' ? "High Focus" : userReview.focus_level === 'yellow' ? "Medium Focus" : "Low Focus"}
                                    </div>
                                </div>
                                <div className="mb-6 flex-1">
                                    <div className="text-xs text-foreground/50 mb-1.5 uppercase tracking-wider font-semibold">Notes</div>
                                    <div className="text-sm text-foreground/90 whitespace-pre-wrap p-4 bg-foreground/5 dark:bg-black/30 rounded-xl border border-border dark:border-white/5 min-h-[120px] leading-relaxed">
                                        {userReview.notes}
                                    </div>
                                </div>
                                {userReview.motm_player_id && (
                                    <div className="mb-8">
                                        <div className="text-sm px-3.5 py-2 min-h-10 bg-foreground/5 dark:bg-black/40 text-foreground/90 inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-border-gold)] dark:shadow-[0_0_10px_rgba(209,161,42,0.1)]">
                                            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-border-gold/30">
                                                <Image
                                                    src={`https://ui-avatars.com/api/?name=${playersById.get(userReview.motm_player_id)?.name.replace(' ', '+')}&background=random`}
                                                    alt=""
                                                    width={20}
                                                    height={20}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className="font-semibold text-xs tracking-wide">MOTM: {playersById.get(userReview.motm_player_id)?.name}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-3 mt-auto pt-4">
                                    <Button className="flex-1 bg-[var(--color-button-neon)] hover:bg-[#00b348] text-black font-bold border-none shadow-[0_0_15px_rgba(0,202,81,0.3)] cursor-pointer rounded-xl h-11" onClick={() => {
                                        setFocus(userReview.focus_level);
                                        setNotes(userReview.notes);
                                        setMotm(userReview.motm_player_id ? String(userReview.motm_player_id) : "");
                                        setIsEditing(true);
                                    }}>
                                        Edit
                                    </Button>
                                    <Button variant="outline" className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold bg-transparent cursor-pointer rounded-xl h-11" onClick={onDelete} disabled={isSubmitting}>
                                        {isSubmitting ? "Deleting..." : "Delete"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <label className="text-xs text-foreground/50 mb-2 uppercase tracking-wider font-semibold block">Focus Level</label>
                                    <FocusLevelSelector value={focus} onChange={setFocus} />
                                </div>

                                <div className="mb-6">
                                    <label className="text-xs text-foreground/50 mb-2 uppercase tracking-wider font-semibold block">Match Notes & Analysis</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Tactical observations, key moments, player performances..."
                                        className="w-full min-h-[140px] p-4 border rounded-xl text-sm bg-foreground/5 dark:bg-black/30 focus:bg-card dark:focus:bg-black/50 focus:ring-1 focus:ring-brand focus:outline-none transition-all border-border dark:border-white/10 resize-y text-foreground"
                                    />
                                </div>

                                <div className="mb-8">
                                    <label className="text-xs text-foreground/50 mb-2 uppercase tracking-wider font-semibold block">
                                        Man of the Match <span className="text-foreground/40 font-normal normal-case ml-1">({focus === 'red' ? 'Not available for low focus' : 'Optional'})</span>
                                    </label>
                                    <MotmSelector
                                        homeTeam={home_team}
                                        awayTeam={away_team}
                                        homePlayers={home_squad_players || []}
                                        awayPlayers={away_squad_players || []}
                                        value={motm}
                                        onChange={setMotm}
                                        disabled={focus === 'red'}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    {isEditing && (
                                        <Button variant="outline" className="flex-1 border-border dark:border-white/20 text-foreground hover:bg-foreground/5 cursor-pointer rounded-xl h-11 font-bold" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                                            Cancel
                                        </Button>
                                    )}
                                    <Button
                                        className="flex-1 h-11 text-sm font-bold rounded-xl bg-[var(--color-button-neon)] text-black hover:bg-[#00b348] border-none shadow-[0_0_15px_rgba(0,202,81,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                                        onClick={onSubmit}
                                        disabled={isSubmitting || !isSignedIn || !isFinished}
                                    >
                                        {isSubmitting ? (isEditing ? "Updating..." : "Posting...") : !isFinished ? "Match not finished" : !isSignedIn ? "Login to Post Review" : (isEditing ? "Save Changes" : "Post Review")}
                                    </Button>
                                </div>
                            </>
                        )}
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
                        {allReviewsList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-16 bg-card rounded-2xl border border-border shadow-sm">
                                <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/30"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-1">No reviews yet</h3>
                                <p className="text-foreground/50 text-center max-w-[250px]">Be the first to share your thoughts and tactical analysis on this match!</p>
                            </div>
                        ) : (
                            reviewCards
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
