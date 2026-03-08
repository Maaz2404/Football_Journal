"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Player {
    id: number;
    name: string;
}

interface Team {
    name: string;
    short_name?: string;
    crest_url?: string;
}

interface MotmSelectorProps {
    homeTeam: Team;
    awayTeam: Team;
    homePlayers: Player[];
    awayPlayers: Player[];
    value: string; // selected player id as string
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function MotmSelector({
    homeTeam,
    awayTeam,
    homePlayers,
    awayPlayers,
    value,
    onChange,
    disabled = false,
}: MotmSelectorProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"home" | "away">("home");
    const [homeSearch, setHomeSearch] = useState("");
    const [awaySearch, setAwaySearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const allPlayers = [...homePlayers, ...awayPlayers];
    const selectedPlayer = value ? allPlayers.find((p) => String(p.id) === value) : null;

    const filteredHome = homePlayers.filter((p) =>
        p.name.toLowerCase().includes(homeSearch.toLowerCase())
    );
    const filteredAway = awayPlayers.filter((p) =>
        p.name.toLowerCase().includes(awaySearch.toLowerCase())
    );

    const handleSelect = (playerId: number) => {
        onChange(String(playerId));
        setOpen(false);
        setHomeSearch("");
        setAwaySearch("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => !disabled && setOpen((o) => !o)}
                disabled={disabled}
                className={cn(
                    "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-sm transition-all",
                    "border-border dark:border-white/10 text-foreground",
                    disabled
                        ? "bg-card dark:bg-background opacity-50 cursor-not-allowed"
                        : "bg-foreground/5 dark:bg-black/30 hover:bg-foreground/10 dark:hover:bg-black/40 cursor-pointer",
                    open && "ring-1 ring-brand border-brand/50"
                )}
            >
                {selectedPlayer ? (
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-brand/20 flex items-center justify-center text-[10px] font-bold text-brand shrink-0">
                            ★
                        </div>
                        <span className="truncate font-medium">{selectedPlayer.name}</span>
                        {/* Show which team they're from */}
                        <span className="text-xs text-foreground/40 shrink-0">
                            {homePlayers.find((p) => String(p.id) === value)
                                ? homeTeam.short_name || homeTeam.name
                                : awayTeam.short_name || awayTeam.name}
                        </span>
                    </div>
                ) : (
                    <span className="text-foreground/40">Select player...</span>
                )}

                <div className="flex items-center gap-1 shrink-0">
                    {selectedPlayer && !disabled && (
                        <span
                            onClick={handleClear}
                            className="text-foreground/30 hover:text-foreground/70 transition-colors p-0.5 rounded cursor-pointer"
                            title="Clear selection"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </span>
                    )}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn("text-foreground/40 transition-transform duration-200", open && "rotate-180")}
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </div>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute z-50 bottom-full mb-2 left-0 right-0 bg-card dark:bg-[#0e1612] border border-border dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">

                    {/* Tab headers */}
                    <div className="flex border-b border-border dark:border-white/10">
                        {(["home", "away"] as const).map((tab) => {
                            const team = tab === "home" ? homeTeam : awayTeam;
                            const isActive = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold transition-all",
                                        isActive
                                            ? "text-foreground bg-brand/10 dark:bg-brand/15 border-b-2 border-brand"
                                            : "text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5"
                                    )}
                                >
                                    {team.crest_url && (
                                        <img
                                            src={team.crest_url}
                                            alt={team.short_name || team.name}
                                            className="w-5 h-5 object-contain"
                                        />
                                    )}
                                    <span className="truncate">{team.short_name || team.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search input */}
                    <div className="px-3 pt-3 pb-2">
                        <div className="relative">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none"
                            >
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search player..."
                                value={activeTab === "home" ? homeSearch : awaySearch}
                                onChange={(e) =>
                                    activeTab === "home"
                                        ? setHomeSearch(e.target.value)
                                        : setAwaySearch(e.target.value)
                                }
                                autoFocus
                                className="w-full pl-8 pr-3 py-2 text-sm bg-foreground/5 dark:bg-black/30 border border-border dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand text-foreground placeholder:text-foreground/30"
                            />
                        </div>
                    </div>

                    {/* Player list */}
                    <div className="overflow-y-auto max-h-52 px-2 pb-2">
                        {(activeTab === "home" ? filteredHome : filteredAway).length === 0 ? (
                            <div className="text-center text-foreground/40 text-sm py-6">No players found</div>
                        ) : (
                            (activeTab === "home" ? filteredHome : filteredAway).map((player) => {
                                const isSelected = String(player.id) === value;
                                return (
                                    <button
                                        key={player.id}
                                        type="button"
                                        onClick={() => handleSelect(player.id)}
                                        className={cn(
                                            "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                                            isSelected
                                                ? "bg-brand/15 dark:bg-brand/20 text-brand dark:text-green-400 font-semibold"
                                                : "text-foreground/80 hover:bg-foreground/5 dark:hover:bg-white/5 hover:text-foreground"
                                        )}
                                    >
                                        <span className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border",
                                            isSelected
                                                ? "bg-brand text-white border-brand"
                                                : "bg-foreground/5 dark:bg-black/30 text-foreground/40 border-border dark:border-white/10"
                                        )}>
                                            {isSelected ? "✓" : player.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="truncate">{player.name}</span>
                                        {isSelected && (
                                            <span className="ml-auto text-xs text-brand/70 dark:text-green-500/70 font-medium shrink-0">MOTM</span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
