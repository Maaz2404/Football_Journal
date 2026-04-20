import Image from "next/image";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { memo } from "react";

export interface ReviewProps {
    id: string | number;
    username: string;
    focusLevel: "red" | "yellow" | "green";
    notes: string;
    motm?: string;
    likes: number;
    timeAgo: string;
}

function ReviewCardComponent({ review }: { review: ReviewProps }) {
    return (
        <Card className="mb-4 bg-card dark:bg-[#151a17] border-border dark:border-white/5 hover:bg-foreground/5 dark:hover:bg-[#1a201c] transition-colors overflow-hidden">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand dark:bg-brand/40 flex items-center justify-center font-bold text-white dark:text-brand-100 text-sm shrink-0 border border-brand/20 dark:border-brand">
                            {review.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{review.username}</p>
                            <p className="text-xs text-foreground/40 font-medium">{review.timeAgo}</p>
                        </div>
                    </div>
                    {/* Focus Level pill moved to Top Right */}
                    <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold inline-flex",
                        review.focusLevel === 'green' ? "bg-green-500/10 text-green-600 dark:text-green-500" :
                            review.focusLevel === 'yellow' ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500" :
                                "bg-red-500/10 text-red-600 dark:text-red-500"
                    )}>
                        {review.focusLevel === 'green' ? "High Focus" : review.focusLevel === 'yellow' ? "Medium Focus" : "Low Focus"}
                    </div>
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed mb-5 pl-1">
                    {review.notes}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-4 border-t border-border dark:border-white/5">
                    {/* MOTM bottom-left styling with gold border */}
                    <div className="flex-1 min-w-0">
                        {review.motm && (
                            <div className="inline-flex items-center gap-2 text-xs font-semibold text-foreground/90 bg-foreground/5 dark:bg-black/40 px-3 py-1.5 rounded-full border border-yellow-500/20 dark:border-[var(--color-border-gold)] shadow-sm dark:shadow-[0_0_10px_rgba(209,161,42,0.1)]">
                                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-border-gold/30">
                                    <Image
                                        src={`https://ui-avatars.com/api/?name=${review.motm.replace(' ', '+')}&background=random`}
                                        alt=""
                                        width={16}
                                        height={16}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="truncate">MOTM: {review.motm}</span>
                            </div>
                        )}
                    </div>

                    {/* Like button styled like the image with green neon border */}
                    <button className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-[var(--color-button-neon)] bg-green-500/10 dark:bg-transparent px-3 py-1.5 rounded-full border border-green-500/30 dark:border-[var(--color-button-neon)] transition-all hover:bg-green-500/20 dark:hover:shadow-[0_0_10px_rgba(0,202,81,0.2)] cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                        {review.likes}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}

export const ReviewCard = memo(ReviewCardComponent);
