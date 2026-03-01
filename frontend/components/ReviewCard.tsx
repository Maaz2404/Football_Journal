import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

export interface ReviewProps {
    id: string | number;
    username: string;
    focusLevel: "red" | "yellow" | "green";
    notes: string;
    motm?: string;
    likes: number;
    timeAgo: string;
}

export function ReviewCard({ review }: { review: ReviewProps }) {
    return (
        <Card className="mb-4 bg-white/50 border-gray-100 hover:bg-white transition-colors">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#06402B] flex items-center justify-center font-bold text-white text-sm shrink-0">
                            {review.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">{review.username}</p>
                            <p className="text-xs text-gray-400">{review.timeAgo}</p>
                        </div>
                    </div>
                    <div className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border",
                        review.focusLevel === 'green' ? "bg-green-50 text-green-700 border-green-200" :
                            review.focusLevel === 'yellow' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                "bg-red-50 text-red-700 border-red-200"
                    )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full",
                            review.focusLevel === 'green' ? "bg-green-500" :
                                review.focusLevel === 'yellow' ? "bg-yellow-500" : "bg-red-500"
                        )} />
                        {review.focusLevel === 'green' ? "High Focus" : review.focusLevel === 'yellow' ? "Medium Focus" : "Low Focus"}
                    </div>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    {review.notes}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-50">
                    <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2E8B57] transition-colors cursor-pointer group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:fill-[#2E8B57]/20"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                        <span className="font-medium">{review.likes}</span>
                    </button>

                    {review.motm && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1.5 rounded-md border min-w-0">
                            <span className="text-yellow-500 shrink-0">★</span>
                            <span className="truncate">MOTM: {review.motm}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
