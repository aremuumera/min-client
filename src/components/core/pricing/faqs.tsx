"use client";

import React, { useState } from 'react';
import { cn } from '@/utils/helper';
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown';

interface FAQItem {
    question: string;
    answer: string;
}

const faqs: FAQItem[] = [
    {
        question: "Can I upgrade or downgrade my plan?",
        answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will take effect immediately, and any unused time on your current plan will be prorated."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, debit cards, and bank transfers. For enterprise plans, we can also support invoicing."
    },
    {
        question: "Is there a free trial for paid plans?",
        answer: "We offer a Free plan forever. For paid features, we don't standardly offer trials, but you can contact our sales team for a demo of the Gold tier."
    },
    {
        question: "What happens if I cancel my subscription?",
        answer: "If you cancel, you will retain access to your paid features until the end of your billing cycle. Afterward, your account will revert to the Free plan."
    }
];

export function Faqs() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="py-16 px-4 bg-neutral-50">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-neutral-900">Frequently Asked Questions</h2>
                    <p className="text-lg text-neutral-500">Everything you need to know about our pricing and plans.</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl border border-neutral-200 overflow-hidden transition-all duration-200"
                        >
                            <button
                                onClick={() => toggle(index)}
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
                                aria-expanded={openIndex === index}
                            >
                                <span className="font-semibold text-neutral-900">{faq.question}</span>
                                <CaretDownIcon
                                    size={20}
                                    className={cn(
                                        "text-neutral-500 transition-transform duration-200",
                                        openIndex === index && "rotate-180"
                                    )}
                                />
                            </button>

                            <div
                                className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out",
                                    openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                )}
                            >
                                <div className="p-4 pt-0 text-neutral-600 leading-relaxed border-t border-neutral-100">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
