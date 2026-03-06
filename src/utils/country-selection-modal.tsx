"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    Box,
    Button,
    TextField,
    Typography,
    Stack,
    Checkbox,
    FormControlLabel
} from "@/components/ui";
import { Search, Globe, X, Check } from "lucide-react";
import { Country } from "country-state-city";

interface CountrySelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCountries: string[];
    onSelectCountries: (countries: string[]) => void;
}

export default function CountrySelectionModal({
    isOpen,
    onClose,
    selectedCountries,
    onSelectCountries
}: CountrySelectionModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [tempSelection, setTempSelection] = useState<string[]>(selectedCountries);

    const allCountries = Country.getAllCountries();

    // Sync temp selection when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setTempSelection(selectedCountries);
        }
    }, [isOpen, selectedCountries]);

    const filteredCountries = allCountries.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleCountry = (countryName: string) => {
        setTempSelection(prev =>
            prev.includes(countryName)
                ? prev.filter(c => c !== countryName)
                : [...prev, countryName]
        );
    };

    const handleApply = () => {
        onSelectCountries(tempSelection);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <DialogTitle className="p-6 text-white flex items-center gap-2 text-xl font-bold">
                    <Globe className="w-5 h-5 text-green-400" />
                    Select Coverage Countries
                </DialogTitle>

                <Box className="p-6 space-y-6">
                    <TextField
                        fullWidth
                        placeholder="Search countries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <Search className="w-4 h-4 text-neutral-400 mr-2" />,
                        }}
                        className="bg-neutral-50 rounded-lg"
                    />

                    <Box className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                                <Box
                                    key={country.isoCode}
                                    onClick={() => toggleCountry(country.name)}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${tempSelection.includes(country.name)
                                        ? 'bg-green-50 border border-green-100'
                                        : 'hover:bg-neutral-50 border border-transparent'
                                        }`}
                                >
                                    <Typography variant="body2" className={tempSelection.includes(country.name) ? 'font-bold text-green-700' : 'text-neutral-700'}>
                                        {country.name}
                                    </Typography>
                                    {tempSelection.includes(country.name) && (
                                        <Check className="w-4 h-4 text-green-600" />
                                    )}
                                </Box>
                            ))
                        ) : (
                            <Typography variant="body2" className="text-center py-8 text-neutral-400">
                                No countries found.
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Box className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-3">
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={onClose}
                        className="rounded-xl border-neutral-200 text-neutral-600"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleApply}
                        className="rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-none"
                    >
                        Apply Selection
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
