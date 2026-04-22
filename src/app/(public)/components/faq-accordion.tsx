"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = { q: string; a: string };

export function FaqAccordion({ questions }: { questions: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {questions.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="rounded-xl border-2 border-page-edge shadow-[2px_2px_0_var(--page-edge)] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left bg-page-deep hover:bg-page-deep/80 transition-colors cursor-pointer"
              aria-expanded={isOpen}
            >
              <span className="text-cr-orange font-bold text-lg shrink-0">Q</span>
              <span className="font-story font-bold text-ink text-sm flex-1">{item.q}</span>
              <ChevronDown
                size={18}
                className={`text-ink-mid shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="px-5 py-4 border-t border-page-edge bg-page">
                <div className="flex gap-3">
                  <span className="text-cr-blue font-bold text-lg shrink-0">A</span>
                  <p className="text-sm text-ink-mid leading-relaxed whitespace-pre-wrap">{item.a}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
