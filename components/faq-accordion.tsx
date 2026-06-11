"use client";

import { useState } from "react";

export type FaqItem = {
  answer: string;
  question: string;
};

export function FaqAccordion({
  defaultOpen = 0,
  items,
}: {
  defaultOpen?: number;
  items: FaqItem[];
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="w-full">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div
            className="border-b border-line first:border-t"
            key={item.question}
          >
            <button
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 bg-transparent px-1 py-5 text-left font-sans text-xl font-semibold text-ink"
              onClick={() => setOpen(isOpen ? -1 : index)}
              type="button"
            >
              <span>{item.question}</span>
              <span
                aria-hidden="true"
                className="relative h-6 w-6 flex-none text-slate"
              >
                <span className="absolute left-1 top-[11px] h-0.5 w-4 bg-current" />
                <span
                  className="absolute left-1 top-[11px] h-0.5 w-4 bg-current transition-transform duration-150"
                  style={{
                    transform: isOpen ? "rotate(0deg)" : "rotate(90deg)",
                  }}
                />
              </span>
            </button>
            {isOpen ? (
              <p className="max-w-3xl px-1 pb-5 text-base leading-7 text-ink-90">
                {item.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
