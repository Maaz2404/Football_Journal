import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const datePartsFormatterCache = new Map<string, Intl.DateTimeFormat>();
const matchDateTimeFormatterCache = new Map<string, { date: Intl.DateTimeFormat; time: Intl.DateTimeFormat }>();

function datePartsFormatter(timeZone?: string) {
    const cacheKey = timeZone || "__default__";
    const cached = datePartsFormatterCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const formatter = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...(timeZone ? { timeZone } : {}),
    });
    datePartsFormatterCache.set(cacheKey, formatter);
    return formatter;
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
    const cacheKey = timeZone || "__default__";
    let formatters = matchDateTimeFormatterCache.get(cacheKey);

    if (!formatters) {
        const formatOptions = timeZone ? { timeZone } : undefined;
        formatters = {
            date: new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                ...formatOptions,
            }),
            time: new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                ...formatOptions,
            }),
        };
        matchDateTimeFormatterCache.set(cacheKey, formatters);
    }

    return {
        date: formatters.date.format(date),
        time: formatters.time.format(date),
    };
}
