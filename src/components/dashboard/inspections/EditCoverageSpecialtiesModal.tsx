"use client";

import React, { useState, useEffect } from "react";
import {
    Typography,
    Box,
    Button,
    TextField,
    Stack,
    IconButton
} from "@/components/ui";
import {
    Globe,
    Briefcase,
    X,
    Check,
    MapPin,
    Plus
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/helper";
import StateSelector from "@/utils/state-selector-modal";
import CountrySelectionModal from "@/utils/country-selection-modal";
import { useUpdateInspectorProfileMutation } from "@/redux/features/inspector/inspector_api";

const MINING_SPECIALTIES = [
    "Lithium",
    "Gold",
    "Iron Ore",
    "Rare Earths",
    "Base Metals",
    "Copper",
    "Cobalt",
    "Laboratory Analysis",
    "Site Inspections",
    "Mineral Logistics",
    "Quality Control",
    "Certification Services",
    "ESG Auditing",
    "Mine Safety Inspection"
];

interface EditCoverageSpecialtiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    company: any;
    onSuccess: () => void;
}

export default function EditCoverageSpecialtiesModal({
    isOpen,
    onClose,
    company,
    onSuccess,
}: EditCoverageSpecialtiesModalProps) {
    const [updateProfile, { isLoading }] = useUpdateInspectorProfileMutation();

    const [coverageCountries, setCoverageCountries] = useState<string[]>([]);
    const [coverageStates, setCoverageStates] = useState<string[]>([]);
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [customSpecialty, setCustomSpecialty] = useState("");
    const [showCountryModal, setShowCountryModal] = useState(false);

    useEffect(() => {
        if (company) {
            setCoverageCountries(company.coverageCountries || []);
            setCoverageStates(company.coverageStates || []);
            setSpecialties(company.specialties || []);
        }
    }, [company, isOpen]);

    if (!isOpen) return null;

    const toggleSpecialty = (spec: string) => {
        setSpecialties(prev =>
            prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
        );
    };

    const handleAddCustomSpecialty = () => {
        if (!customSpecialty.trim()) return;
        if (specialties.includes(customSpecialty.trim())) {
            toast.error("Specialty already added");
            return;
        }
        setSpecialties(prev => [...prev, customSpecialty.trim()]);
        setCustomSpecialty("");
        toast.success(`"${customSpecialty.trim()}" added to specialties`);
    };

    const handleSave = async () => {
        if (coverageCountries.length === 0) {
            toast.error("Please select at least one coverage country");
            return;
        }

        try {
            await updateProfile({
                coverageCountries,
                coverageStates,
                specialties,
            }).unwrap();

            toast.success("Coverage regions & specialties updated successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(getErrorMessage(error, "Failed to update coverage and specialties"));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 border border-neutral-100 space-y-6 my-8 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <Typography variant="h6" className="font-bold text-neutral-900">
                                Edit Coverage Regions & Specialties
                            </Typography>
                            <Typography variant="body2" className="text-neutral-500">
                                Update operating countries, state territories, and mineral specialties.
                            </Typography>
                        </div>
                    </div>
                    <IconButton aria-label="Close" onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
                        <X className="w-5 h-5" />
                    </IconButton>
                </div>

                {/* Modal Body */}
                <div className="space-y-6 overflow-y-auto pr-2 flex-1">
                    {/* Section 1: Specialties */}
                    <div className="space-y-4">
                        <Typography variant="subtitle2" className="font-bold text-neutral-900 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-blue-600" />
                            Mining Specialties & Technical Domains
                        </Typography>

                        <div className="flex gap-2">
                            <TextField
                                placeholder="Type a custom specialty..."
                                value={customSpecialty}
                                onChange={(e) => setCustomSpecialty(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSpecialty()}
                                fullWidth
                                inputSize="sm"
                            />
                            <Button
                                size="sm"
                                onClick={handleAddCustomSpecialty}
                                className="bg-green-600 text-white hover:bg-green-700 px-4 whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                            {Array.from(new Set([...MINING_SPECIALTIES, ...specialties])).map((spec) => {
                                const isSelected = specialties.includes(spec);
                                return (
                                    <button
                                        key={spec}
                                        type="button"
                                        onClick={() => toggleSpecialty(spec)}
                                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                            isSelected
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-300'
                                        }`}
                                    >
                                        {isSelected && <Check className="w-3.5 h-3.5" />}
                                        {spec}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 2: Coverage Regions */}
                    <div className="space-y-4 pt-4 border-t border-neutral-100">
                        <Typography variant="subtitle2" className="font-bold text-neutral-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-purple-600" />
                            Geographic Coverage Countries & States
                        </Typography>

                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => setShowCountryModal(true)}
                            className="py-4 border-2 border-dashed border-neutral-200 text-neutral-600 hover:border-purple-500 hover:bg-purple-50 hover:text-purple-700 transition-all rounded-2xl shadow-none"
                        >
                            <span className="flex items-center gap-2 font-bold text-sm">
                                <Globe className="w-5 h-5 text-purple-600" />
                                {coverageCountries.length > 0
                                    ? `${coverageCountries.length} Countries Selected (${coverageCountries.join(", ")})`
                                    : "Choose Coverage Countries"}
                            </span>
                        </Button>

                        {coverageCountries.length > 0 && (
                            <div className="space-y-4 pt-2">
                                {coverageCountries.map((country) => (
                                    <div key={country} className="p-4 border border-neutral-100 rounded-2xl bg-neutral-50/50 space-y-2">
                                        <Typography variant="subtitle2" className="font-bold text-neutral-900 flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-purple-600" />
                                            {country}
                                        </Typography>
                                        <StateSelector
                                            country={country}
                                            selectedStates={coverageStates}
                                            onStateToggle={(state: string) => {
                                                setCoverageStates(prev =>
                                                    prev.includes(state)
                                                        ? prev.filter(s => s !== state)
                                                        : [...prev, state]
                                                );
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 shrink-0">
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        className="border-neutral-200 text-neutral-700 font-bold px-6 py-2.5 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50"
                    >
                        {isLoading ? "Saving..." : "Save Coverage & Specialties"}
                    </Button>
                </div>

                <CountrySelectionModal
                    isOpen={showCountryModal}
                    onClose={() => setShowCountryModal(false)}
                    selectedCountries={coverageCountries}
                    onSelectCountries={(countries: string[]) => {
                        setCoverageCountries(countries);
                        setShowCountryModal(false);
                    }}
                />
            </div>
        </div>
    );
}
