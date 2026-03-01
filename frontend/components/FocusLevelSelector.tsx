import { cn } from "@/lib/utils";

type FocusLevel = "red" | "yellow" | "green";

interface FocusLevelSelectorProps {
    value: FocusLevel;
    onChange: (value: FocusLevel) => void;
}

export function FocusLevelSelector({ value, onChange }: FocusLevelSelectorProps) {
    const options: { color: FocusLevel; label: string; bgClass: string; activeClass: string; textClass: string }[] = [
        { color: "red", label: "Low", bgClass: "bg-red-50", activeClass: "bg-red-100 border-red-500", textClass: "text-red-700" },
        { color: "yellow", label: "Medium", bgClass: "bg-yellow-50", activeClass: "bg-yellow-100 border-yellow-500", textClass: "text-yellow-700" },
        { color: "green", label: "High", bgClass: "bg-green-50", activeClass: "bg-green-100 border-green-500", textClass: "text-green-700" },
    ];

    return (
        <div className="flex gap-2 w-full">
            {options.map((opt) => (
                <button
                    key={opt.color}
                    type="button"
                    onClick={() => onChange(opt.color)}
                    className={cn(
                        "flex-1 py-2 px-3 rounded-full border text-sm font-medium transition-all text-center flex items-center justify-center cursor-pointer",
                        value === opt.color
                            ? opt.activeClass
                            : "border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100"
                    )}
                >
                    <span className={cn("mr-2 inline-block w-2.5 h-2.5 rounded-full shrink-0",
                        opt.color === 'green' ? 'bg-green-500' :
                            opt.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
                    )} />
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
