"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

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
            router.push(`/insights?${params.toString()}`);
        },
        [router, searchParams]
    );

    const isWeekly = range === "weekly";
    const isCustom = range === "custom";

    return (
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Weekly toggle */}
            <div className="flex bg-card rounded-lg p-1 border border-border shadow-sm">
                <button
                    onClick={() => navigate({ range: "weekly", month: null, year: null })}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${isWeekly
                        ? "bg-accent text-white shadow"
                        : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                        }`}
                >
                    Weekly
                </button>
                <button
                    onClick={() => navigate({ range: "custom", month: null, year: String(currentYear) })}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${isCustom
                        ? "bg-accent text-white shadow"
                        : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                        }`}
                >
                    Custom
                </button>
            </div>

            {/* Month / Year pickers — only shown when custom is active */}
            {isCustom && (
                <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shadow-sm">
                    <select
                        value={month ?? ""}
                        onChange={(e) =>
                            navigate({ month: e.target.value || null })
                        }
                        className="text-sm text-foreground bg-transparent outline-none cursor-pointer pr-1"
                    >
                        <option value="" className="bg-card">All months</option>
                        {MONTHS.map((m) => (
                            <option key={m.value} value={m.value} className="bg-card">
                                {m.label}
                            </option>
                        ))}
                    </select>

                    <span className="text-border select-none">|</span>

                    <select
                        value={year ?? String(currentYear)}
                        onChange={(e) =>
                            navigate({ year: e.target.value })
                        }
                        className="text-sm text-foreground bg-transparent outline-none cursor-pointer"
                    >
                        {YEARS.map((y) => (
                            <option key={y} value={String(y)} className="bg-card">
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
