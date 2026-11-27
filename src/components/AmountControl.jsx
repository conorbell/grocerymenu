import React, { useRef, useState } from 'react';
import { round } from '../lib/mealRules';

// How far − and + move each unit; plain counts go by 1.
const STEPS = { g: 50, ml: 50, kg: 0.5, l: 0.5, lb: 0.5, cup: 0.5 };

// − amount + for a Shopping list line, used on the List and Grocery pages.
// Tap the amount to type one; going below the smallest step takes the line
// off the list (setAmount does that for anything ≤ 0).
export const AmountControl = ({ line, onChange }) => {
  const step = STEPS[line.unit] || 1;
  const [draft, setDraft] = useState(null); // what's typed, while typing
  const cancelled = useRef(false);
  const last = line.quantity - step <= 0;

  const finishTyping = () => {
    if (!cancelled.current && draft !== null && draft.trim() !== '') onChange(Number(draft));
    cancelled.current = false;
    setDraft(null);
  };

  return (
    <span className="amount">
      <span className="stepper" role="group" aria-label={`Amount of ${line.name}`}>
        <button
          type="button"
          className="stepper__btn"
          aria-label={last ? `Take ${line.name} off the list` : `Less ${line.name}`}
          onClick={() => onChange(round(line.quantity - step))}
        >
          −
        </button>
        <input
          className="stepper__value amount__input"
          inputMode="decimal"
          aria-label={`How much ${line.name}`}
          value={draft ?? String(line.quantity)}
          onFocus={(e) => {
            setDraft(String(line.quantity));
            e.target.select();
          }}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ''))}
          onBlur={finishTyping}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancelled.current = true;
            if (e.key === 'Enter' || e.key === 'Escape') e.target.blur();
          }}
        />
        <button
          type="button"
          className="stepper__btn"
          aria-label={`More ${line.name}`}
          onClick={() => onChange(round(line.quantity + step))}
        >
          +
        </button>
      </span>
      {line.unit && <span className="amount__unit">{line.unit}</span>}
    </span>
  );
};
