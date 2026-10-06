"use client";

import { Fragment, useEffect, useState } from "react";

const TYPE_MS = 55;
const HOLD_MS = 10000;
const SLEEP_MS = 700;

type Segment = { text: string; isBold?: boolean };

type TypingHeadlineProps = {
  segments: Segment[];
  className?: string;
};

export function TypingHeadline({ segments, className }: TypingHeadlineProps) {
  const total = segments.reduce((sum, segment) => sum + segment.text.length, 0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const delay = count === 0 ? SLEEP_MS : count < total ? TYPE_MS : HOLD_MS;
    const timer = setTimeout(() => setCount(count < total ? count + 1 : 0), delay);
    return () => clearTimeout(timer);
  }, [count, total]);

  const caret = <span className="typing-caret" />;
  let index = 0;

  // O texto completo fica no DOM (letras pendentes transparentes) para a altura não mudar durante a digitação.
  return (
    <p className={className} aria-label={segments.map((segment) => segment.text).join("")}>
      <span aria-hidden>
        {count === 0 && caret}
        {segments.map((segment, segmentIndex) => {
          const Wrapper = segment.isBold ? "strong" : "span";
          return (
            <Wrapper key={segmentIndex} className={segment.isBold ? "font-semibold" : undefined}>
              {[...segment.text].map((char) => {
                index += 1;
                return (
                  <Fragment key={index}>
                    <span className={index > count ? "text-transparent" : undefined}>{char}</span>
                    {index === count && caret}
                  </Fragment>
                );
              })}
            </Wrapper>
          );
        })}
      </span>
    </p>
  );
}
