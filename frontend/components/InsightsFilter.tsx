"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

const MONTHS = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

interface InsightsFilterProps {
    range: string;
    month: string | null;
    year: string | null;
}

export function InsightsFilter({ range, month, year }: InsightsFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const navigate = useCallback(
        (updates: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(updates)) {
                if (value === null) {
                    params.delete(key);
                } else {
                    params.set(key, value);
                }
            }
            startTransition(() => {
                router.replace(`/insights?${params.toString()}`);
            });
        },
        [router, searchParams]
    );

    const isWeekly = range === "weekly";
    const isCustom = range === "custom";

    return (
        <div className="flex flex-wrap items-center gap-4 self-center justify-center w-full max-w-2xl mx-auto">
            <div className="flex items-center bg-black/40 backdrop-blur-md border border-brand/40 rounded-full p-1 shadow-[0_0_20px_rgba(6,64,43,0.3)]">
                {/* Weekly toggle */}
                <button
                    onClick={() => navigate({ range: "weekly", month: null, year: null })}
                    disabled={isPending}
                    className={`px-8 py-2 text-sm font-bold rounded-full transition-all duration-300 ${isWeekly
                        ? "bg-brand text-button-neon shadow-[0_0_15px_rgba(0,202,81,0.2)] border border-button-neon/30"
                        : "text-foreground/40 hover:text-foreground/70"
                        }`}
                >
                    Weekly
                </button>
                <button
                    onClick={() => navigate({ range: "custom", month: null, year: String(currentYear) })}
                    disabled={isPending}
                    className={`px-8 py-2 text-sm font-bold rounded-full transition-all duration-300 ${isCustom
                        ? "bg-brand text-button-neon shadow-[0_0_15px_rgba(0,202,81,0.2)] border border-button-neon/30"
                        : "text-foreground/40 hover:text-foreground/70"
                        }`}
                >
                    Custom
                </button>

                {/* Divider if Custom */}
                {isCustom && <div className="h-6 w-[1px] bg-brand/30 mx-2" />}

                {/* Month / Year pickers — only shown when custom is active */}
                {isCustom && (
                    <div className="flex items-center gap-1 pr-4">
                        <select
                            value={month ?? ""}
                            onChange={(e) =>
                                navigate({ month: e.target.value || null })
                            }
                            disabled={isPending}
                            className="text-sm font-semibold text-foreground bg-transparent outline-none cursor-pointer hover:text-button-neon transition-colors"
                        >
                            <option value="" className="bg-background text-foreground">All months</option>
                            {MONTHS.map((m) => (
                                <option key={m.value} value={m.value} className="bg-background text-foreground">
                                    {m.label}
                                </option>
                            ))}
                        </select>

                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/30"><path d="m6 9 6 6 6-6" /></svg>

                        <div className="h-4 w-[1px] bg-brand/20 mx-1" />

                        <select
                            value={year ?? String(currentYear)}
                            onChange={(e) =>
                                navigate({ year: e.target.value })
                            }
                            disabled={isPending}
                            className="text-sm font-semibold text-foreground bg-transparent outline-none cursor-pointer hover:text-button-neon transition-colors"
                        >
                            {YEARS.map((y) => (
                                <option key={y} value={String(y)} className="bg-background text-foreground">
                                    {y}
                                </option>
                            ))}
                        </select>

                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/30"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                )}
            </div>
            {isPending && (
                <div className="text-xs text-foreground/50 font-semibold animate-pulse">Updating insights...</div>
            )}
        </div>
    );
}
