import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

function datePartsFormatter(timeZone?: string) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...(timeZone ? { timeZone } : {}),
    });
}

function getYmdParts(date: Date, timeZone?: string) {
    const parts = datePartsFormatter(timeZone).formatToParts(date);

    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;

    if (!year || !month || !day) {
        throw new Error("Could not derive date parts.");
    }

    return { year, month, day };
}

export function getDateKeyForDate(date: Date, timeZone?: string) {
    const { year, month, day } = getYmdParts(date, timeZone);
    return `${year}-${month}-${day}`;
}

export function getDateKeyForUtcDate(utcDateString: string, timeZone?: string) {
    return getDateKeyForDate(new Date(utcDateString), timeZone);
}

export function isValidDateKey(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [y, m, d] = value.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function addDaysToDateKey(dateKey: string, days: number) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    return getDateKeyForDate(dt, "UTC");
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
