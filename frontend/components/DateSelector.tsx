import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import Link from "next/link";

interface DateSelectorProps {
    currentDate: Date;
    prevLink: string;
    nextLink: string;
}

export function DateSelector({ currentDate, prevLink, nextLink }: DateSelectorProps) {
    const getDisplayDate = (date: Date) => {
        if (isToday(date)) return "Today, " + format(date, "MMM d");
        if (isYesterday(date)) return "Yesterday, " + format(date, "MMM d");
        if (isTomorrow(date)) return "Tomorrow, " + format(date, "MMM d");
        return format(date, "EEEE, MMM d");
    };

    return (
        <div className="flex items-center justify-between bg-card text-card-foreground shadow-sm rounded-xl border p-2 mb-6 max-w-xl mx-auto w-full mt-4">
            <Link href={prevLink}>
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 hover:bg-[#F4F4F4] cursor-pointer" type="button">
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                    <span className="sr-only">Previous Day</span>
                </Button>
            </Link>
            <div className="flex-1 text-center font-semibold text-[15px] sm:text-base text-gray-800">
                {getDisplayDate(currentDate)}
            </div>
            <Link href={nextLink}>
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 hover:bg-[#F4F4F4] cursor-pointer" type="button">
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                    <span className="sr-only">Next Day</span>
                </Button>
            </Link>
        </div>
    );
}
