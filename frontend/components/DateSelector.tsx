import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { addDaysToDateKey, getDateKeyForDate } from "@/lib/utils";

interface DateSelectorProps {
    currentDateKey: string;
    prevLink: string;
    nextLink: string;
    viewerTimezone?: string;
}

function formatDateKey(dateKey: string, style: "short" | "long") {
    const [y, m, d] = dateKey.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat("en-US", {
        weekday: style === "long" ? "long" : undefined,
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    }).format(date);
}

export function DateSelector({ currentDateKey, prevLink, nextLink, viewerTimezone }: DateSelectorProps) {
    const getDisplayDate = (dateKey: string) => {
        const todayKey = getDateKeyForDate(new Date(), viewerTimezone);

        if (dateKey === todayKey) return "Today, " + formatDateKey(dateKey, "short");
        if (dateKey === addDaysToDateKey(todayKey, -1)) return "Yesterday, " + formatDateKey(dateKey, "short");
        if (dateKey === addDaysToDateKey(todayKey, 1)) return "Tomorrow, " + formatDateKey(dateKey, "short");

        return formatDateKey(dateKey, "long");
    };

    return (
        <div className="flex items-center justify-between bg-card text-card-foreground shadow-sm rounded-xl border p-2 mb-6 max-w-xl mx-auto w-full mt-4">
            <Link href={prevLink}>
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 hover:bg-foreground/5 cursor-pointer" type="button">
                    <ChevronLeft className="h-5 w-5 text-foreground/70" />
                    <span className="sr-only">Previous Day</span>
                </Button>
            </Link>
            <div className="flex-1 text-center font-semibold text-[15px] sm:text-base text-foreground">
                {getDisplayDate(currentDateKey)}
            </div>
            <Link href={nextLink}>
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 hover:bg-foreground/5 cursor-pointer" type="button">
                    <ChevronRight className="h-5 w-5 text-foreground/70" />
                    <span className="sr-only">Next Day</span>
                </Button>
            </Link>
        </div>
    );
}
