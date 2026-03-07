import { cn } from "@/lib/utils";

type FocusLevel = "red" | "yellow" | "green";

interface FocusLevelSelectorProps {
    value: FocusLevel;
    onChange: (value: FocusLevel) => void;
}

export function FocusLevelSelector({ value, onChange }: FocusLevelSelectorProps) {
    const options: { color: FocusLevel; label: string; activeClass: string }[] = [
        { color: "red", label: "Low", activeClass: "bg-red-500/10 border-red-500 text-red-500" },
        { color: "yellow", label: "Medium", activeClass: "bg-yellow-500/10 border-yellow-500 text-yellow-500" },
        { color: "green", label: "High", activeClass: "bg-green-500/10 border-green-500 text-green-500" },
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
                            : "border-border bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
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
