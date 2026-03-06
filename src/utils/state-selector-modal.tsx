"use client";

import React from "react";
import { Box, Typography, Button } from "@/components/ui";
import { Check } from "lucide-react";
import { Country, State } from "country-state-city";

interface StateSelectorProps {
    country: string;
    selectedStates: string[];
    onStateToggle: (state: string) => void;
    onToggleAll?: (states: string[]) => void;
}

export default function StateSelector({
    country,
    selectedStates,
    onStateToggle,
    onToggleAll
}: StateSelectorProps) {
    const allCountries = Country.getAllCountries();
    const targetCountry = allCountries.find(c => c.name === country);
    const states = targetCountry ? State.getStatesOfCountry(targetCountry.isoCode) : [];

    if (states.length === 0) {
        return (
            <Typography variant="caption" className="text-neutral-400 italic">
                Specific state selection not available for this country. All regions included by default.
            </Typography>
        );
    }

    const allInCountrySelected = states.every(s => selectedStates.includes(s.name));

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <Typography variant="caption" className="text-neutral-400 font-medium">
                    {states.length} states available
                </Typography>
                <button
                    onClick={() => onToggleAll?.(states.map(s => s.name))}
                    className="text-[10px] font-bold text-green-600 hover:text-green-700 hover:underline transition-all"
                >
                    {allInCountrySelected ? "Deselect All States" : "Select All States"}
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {states.map((state) => (
                    <button
                        key={state.isoCode || state.name}
                        onClick={() => onStateToggle(state.name)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${selectedStates.includes(state.name)
                            ? 'bg-green-600 border-green-600 text-white shadow-sm'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                            }`}
                    >
                        <div className="flex items-center gap-1.5">
                            {state.name}
                            {selectedStates.includes(state.name) && <Check className="w-3 h-3" />}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
