import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Server-safe formatter. If a timezone is provided, both SSR and client use the same timezone.
export function formatMatchDateTimeWithTimezone(utcDateString: string, timeZone?: string) {
    const date = new Date(utcDateString);
    const formatOptions = timeZone ? { timeZone } : undefined;

    return {
        date: new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            ...formatOptions,
        }).format(date),
        time: new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            ...formatOptions,
        }).format(date),
    };
}
